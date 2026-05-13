import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage, Conversation } from '@/lib/api'
import { generateId } from '@/lib/utils'

interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: ChatMessage[]
  loading: boolean
  streaming: boolean
  streamingContent: string
  error: string | null

  fetchConversations: () => Promise<void>
  createConversation: () => Promise<string>
  selectConversation: (id: string | null) => void
  sendMessage: (content: string, keyId: string, model: string) => Promise<void>
  addMessages: (messages: ChatMessage[]) => void
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void
  clearMessages: () => void
  deleteConversation: (id: string) => Promise<void>
  saveMessagesToBackend: () => Promise<void>
  clearError: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      messages: [],
      loading: false,
      streaming: false,
      streamingContent: '',
      error: null,

      fetchConversations: async () => {
        set({ loading: true, error: null })
        try {
          const response = await fetch('/api/chat/history')
          const data = await response.json()
          if (data.success && data.data) {
            set({ conversations: data.data, loading: false })
          } else {
            set({ error: data.error || 'Failed to fetch conversations', loading: false })
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch conversations', loading: false })
        }
      },

      createConversation: async () => {
        const id = generateId()
        const conversation: Conversation = {
          id,
          title: 'New Conversation',
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
          messages: [],
        }))
        return id
      },

      selectConversation: (id) => {
        if (id === null) {
          set({ activeConversationId: null, messages: [] })
          return
        }
        const { conversations } = get()
        const conversation = conversations.find((c) => c.id === id)
        set({
          activeConversationId: id,
          messages: conversation?.messages || [],
        })
      },

      sendMessage: async (content, keyId, model) => {
        // Prevent concurrent streaming requests
        const { streaming } = get()
        if (streaming) {
          console.log('[ChatStore] Skipping send - streaming already in progress')
          return
        }

        const { messages } = get()

        const userMessage: ChatMessage = {
          id: generateId(),
          role: 'user',
          content,
          model,
          provider: '',
          keyId,
          timestamp: new Date().toISOString(),
        }

        // Add user message immediately
        set((state) => ({
          messages: [...state.messages, userMessage],
          streaming: true,
          streamingContent: '',
          error: null,
        }))

        // Create assistant message placeholder
        const assistantMessageId = generateId()

        try {
          const { activeConversationId } = get()
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keyId,
              model,
              conversationId: activeConversationId,
              userMessage: { role: 'user', content, model, provider: '', keyId, timestamp: userMessage.timestamp },
              messages: [...messages, userMessage].map((m) => ({
                role: m.role,
                content: m.content,
              })),
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            set({ error: errorData.error || 'Failed to send message', streaming: false })
            return
          }

          const reader = response.body?.getReader()
          if (!reader) {
            set({ error: 'No response body', streaming: false })
            return
          }

          console.log('Starting to read stream...')
          const decoder = new TextDecoder()
          let buffer = ''
          let fullContent = ''
          let receivedDone = false

          while (true) {
            const { done, value } = await reader!.read()
            console.log('Read chunk:', done, value?.length)
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                console.log('SSE data:', data)
                try {
                  const parsed = JSON.parse(data)

                  if (parsed.error) {
                    console.log('Error in stream:', parsed.error)
                    set({ error: parsed.error, streaming: false })
                    return
                  }

                  if (parsed.content !== undefined) {
                    fullContent += parsed.content
                    set({ streamingContent: fullContent })
                  }

                  if (parsed.done) {
                    receivedDone = true
                    // Finalize the message
                    const assistantMessage: ChatMessage = {
                      id: assistantMessageId,
                      role: 'assistant',
                      content: fullContent,
                      model,
                      provider: '',
                      keyId,
                      timestamp: new Date().toISOString(),
                      tokens: parsed.tokens,
                    }

                    set((state) => {
                      const newMessages = [...state.messages, assistantMessage]
                      const updatedConversations = state.conversations.map((c) =>
                        c.id === state.activeConversationId
                          ? { ...c, messages: newMessages, updatedAt: new Date().toISOString(), title: content.slice(0, 30) + '...' }
                          : c
                      )
                      return {
                        messages: newMessages,
                        conversations: updatedConversations,
                        streaming: false,
                        streamingContent: '',
                      }
                    })
                  }
                } catch (e) {
                  // Skip malformed JSON
                  console.log('JSON parse error:', e, 'Raw data:', data)
                }
              }
            }
          }

          // 兜底：如果循环退出但没有收到 done: true，手动结束流式
          if (!receivedDone) {
            console.log('[ChatStore] Stream ended without done signal, finalizing...')
            const assistantMessage: ChatMessage = {
              id: assistantMessageId,
              role: 'assistant',
              content: fullContent,
              model,
              provider: '',
              keyId,
              timestamp: new Date().toISOString(),
            }

            set((state) => {
              const newMessages = [...state.messages, assistantMessage]
              const updatedConversations = state.conversations.map((c) =>
                c.id === state.activeConversationId
                  ? { ...c, messages: newMessages, updatedAt: new Date().toISOString(), title: content.slice(0, 30) + '...' }
                  : c
              )
              return {
                messages: newMessages,
                conversations: updatedConversations,
                streaming: false,
                streamingContent: '',
              }
            })
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to send message', streaming: false })
        }
      },

      addMessages: (newMessages) => {
        set((state) => {
          if (!state.activeConversationId) return state

          const updatedConversations = state.conversations.map((c) => {
            if (c.id === state.activeConversationId) {
              const title = newMessages[0]?.content?.slice(0, 30) || c.title
              return {
                ...c,
                messages: [...c.messages, ...newMessages],
                updatedAt: new Date().toISOString(),
                title: title.endsWith('...') ? title : (title.length > 30 ? title.slice(0, 30) + '...' : title),
              }
            }
            return c
          })

          return {
            messages: [...state.messages, ...newMessages],
            conversations: updatedConversations,
          }
        })

        // Save to backend after updating state
        get().saveMessagesToBackend()
      },

      // Replace a message by ID (for loading state replacement)
      updateMessage: (id, updates) => {
        set((state) => {
          if (!state.activeConversationId) return state

          const updatedConversations = state.conversations.map((c) => {
            if (c.id === state.activeConversationId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === id ? { ...m, ...updates } : m
                ),
                updatedAt: new Date().toISOString(),
              }
            }
            return c
          })

          return {
            messages: state.messages.map((m) =>
              m.id === id ? { ...m, ...updates } : m
            ),
            conversations: updatedConversations,
          }
        })

        // Save to backend after updating state
        get().saveMessagesToBackend()
      },

      saveMessagesToBackend: async () => {
        const { activeConversationId, conversations } = get()
        if (!activeConversationId) return

        const conversation = conversations.find(c => c.id === activeConversationId)
        if (!conversation) return

        try {
          await fetch(`/api/chat/history/${activeConversationId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: conversation.messages,
              updatedAt: conversation.updatedAt,
            }),
          })
        } catch (error) {
          console.error('[ChatStore] Failed to save messages to backend:', error)
        }
      },

      clearMessages: () => {
        set({ messages: [], streamingContent: '' })
      },

      deleteConversation: async (id) => {
        try {
          const response = await fetch(`/api/chat/history/${id}`, { method: 'DELETE' })
          const data = await response.json()
          if (data.success) {
            set((state) => ({
              conversations: state.conversations.filter((c) => c.id !== id),
              activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
              messages: state.activeConversationId === id ? [] : state.messages,
            }))
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete conversation' })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'keypilot-chat',
      partialize: (state) => ({ conversations: state.conversations, activeConversationId: state.activeConversationId }),
    }
  )
)

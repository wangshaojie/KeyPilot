import { create } from 'zustand'

export type GenerationType = 'image' | 'video' | 'audio' | 'music'

interface GenerationItem {
  id: string
  prompt: string
  model: string
  provider: string
  keyId: string
  url: string
  thumbnailUrl?: string
  duration?: number
  createdAt: string
}

interface GenerationState {
  // Current generation type
  activeType: GenerationType

  // History for each type
  imageHistory: GenerationItem[]
  videoHistory: GenerationItem[]
  audioHistory: GenerationItem[]
  musicHistory: GenerationItem[]

  // Loading states
  loading: boolean
  generating: boolean

  // Error
  error: string | null

  // Actions
  setActiveType: (type: GenerationType) => void
  fetchHistory: (type: GenerationType) => Promise<void>
  generate: (params: {
    keyId: string
    model: string
    prompt: string
    [key: string]: any
  }) => Promise<{ success: boolean; url?: string; error?: string }>
  deleteItem: (type: GenerationType, id: string) => Promise<void>
  clearError: () => void
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  activeType: 'image',
  imageHistory: [],
  videoHistory: [],
  audioHistory: [],
  musicHistory: [],
  loading: false,
  generating: false,
  error: null,

  setActiveType: (type) => {
    set({ activeType: type })
    // Fetch history when switching types
    get().fetchHistory(type)
  },

  fetchHistory: async (type) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(`/api/generation/history/${type}`)
      const data = await response.json()

      if (data.success) {
        const historyKey = `${type}History` as 'imageHistory' | 'videoHistory' | 'audioHistory' | 'musicHistory'
        set({ [historyKey]: data.data, loading: false })
      } else {
        set({ error: data.error || 'Failed to fetch history', loading: false })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch history', loading: false })
    }
  },

  generate: async (params) => {
    const { keyId, model, prompt } = params

    if (!keyId || !model || !prompt) {
      return { success: false, error: 'Missing required fields' }
    }

    set({ generating: true, error: null })

    try {
      const { activeType } = get()

      const response = await fetch(`/api/generation/${activeType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (data.success) {
        // Add to history
        const historyKey = `${activeType}History` as 'imageHistory' | 'videoHistory' | 'audioHistory' | 'musicHistory'
        const url = data.data?.urls?.[0] || data.data?.base64?.[0] || ''

        if (url) {
          const newItem: GenerationItem = {
            id: Math.random().toString(36).substring(2),
            prompt,
            model,
            provider: '',
            keyId,
            url,
            createdAt: new Date().toISOString(),
          }

          set((state) => ({
            [historyKey]: [newItem, ...state[historyKey]],
            generating: false,
          }))
        }

        return { success: true, url }
      } else {
        set({ error: data.error || 'Generation failed', generating: false })
        return { success: false, error: data.error }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Generation failed'
      set({ error: errorMsg, generating: false })
      return { success: false, error: errorMsg }
    }
  },

  deleteItem: async (type, id) => {
    try {
      const response = await fetch(`/api/generation/${type}/${id}`, { method: 'DELETE' })
      const data = await response.json()

      if (data.success) {
        const historyKey = `${type}History` as 'imageHistory' | 'videoHistory' | 'audioHistory' | 'musicHistory'
        set((state) => ({
          [historyKey]: state[historyKey].filter((item) => item.id !== id),
        }))
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete' })
    }
  },

  clearError: () => set({ error: null }),
}))

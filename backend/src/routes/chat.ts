import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { store } from '../dataStore.js'

function generateId() {
  return uuidv4()
}

export const chatRouter = Router()

// Provider API configurations
interface ProviderConfig {
  baseUrl: string
  headers: (key: string) => Record<string, string>
  buildUrl: (baseUrl: string, model: string) => string
  buildBody: (model: string, messages: any[], stream: boolean, baseUrl?: string) => Record<string, any>
  parseResponse: (data: any) => { content: string; tokens?: number }
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    buildUrl: (baseUrl) => `${baseUrl}/chat/completions`,
    buildBody: (model, messages, stream) => ({
      model,
      messages,
      stream,
    }),
    parseResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens,
    }),
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    headers: (key) => ({
      'x-api-key': key,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    }),
    buildUrl: (baseUrl) => `${baseUrl}/messages`,
    buildBody: (model, messages, stream) => {
      const systemMessage = messages.find((m: any) => m.role === 'system')
      const filteredMessages = messages.filter((m: any) => m.role !== 'system')
      return {
        model,
        messages: filteredMessages.map((m: any) => ({ role: m.role, content: m.content })),
        system: systemMessage?.content,
        max_tokens: 4096,
        stream,
      }
    },
    parseResponse: (data) => ({
      content: data.content?.[0]?.text || '',
      tokens: data.usage?.input_tokens + data.usage?.output_tokens,
    }),
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    buildUrl: (baseUrl, model) => `${baseUrl}/models/${model}:generateContent`,
    buildBody: (model, messages, stream) => ({
      contents: messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 40,
        maxOutputTokens: 2048,
      },
    }),
    parseResponse: (data) => ({
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    }),
  },
  azure: {
    baseUrl: '',
    headers: (key) => ({
      'api-key': key,
      'Content-Type': 'application/json',
    }),
    buildUrl: (baseUrl) => `${baseUrl}/chat/completions`,
    buildBody: (model, messages, stream) => ({
      model,
      messages,
      stream,
    }),
    parseResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens,
    }),
  },
  custom: {
    baseUrl: '',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    buildUrl: (baseUrl) => {
      // Only use Anthropic /messages endpoint for actual Anthropic API
      // Other providers (MiniMax, Zhipu, etc.) use OpenAI-compatible /chat/completions
      if (baseUrl.includes('api.anthropic.com')) {
        return `${baseUrl}/messages`
      }
      return `${baseUrl}/chat/completions`
    },
    buildBody: (model, messages, stream, baseUrl) => {
      const systemMessage = messages.find((m: any) => m.role === 'system')
      const filteredMessages = messages.filter((m: any) => m.role !== 'system')

      if (model.startsWith('claude') || model.includes('anthropic')) {
        return {
          model,
          messages: filteredMessages.map((m: any) => ({ role: m.role, content: m.content })),
          system: systemMessage?.content,
          max_tokens: 4096,
          stream,
        }
      }

      // If using MiniMax API via custom provider, set reasoning_level
      const isMiniMax = baseUrl?.includes('minimax')
      return {
        model,
        messages: filteredMessages,
        stream,
        ...(isMiniMax && { reasoning_level: 'minimal' }),
      }
    },
    parseResponse: (data) => {
      if (data.content && Array.isArray(data.content)) {
        return {
          content: data.content[0]?.text || '',
          tokens: data.usage?.input_tokens + data.usage?.output_tokens,
        }
      }
      return {
        content: data.choices?.[0]?.message?.content || '',
        tokens: data.usage?.total_tokens,
      }
    },
  },
  // Chinese Providers
  minimax: {
    baseUrl: 'https://api.minimax.chat/v1',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    buildUrl: (baseUrl) => `${baseUrl}/chat/completions`,
    buildBody: (model, messages, stream) => {
      const systemMessage = messages.find((m: any) => m.role === 'system')
      const filteredMessages = messages.filter((m: any) => m.role !== 'system')
      return {
        model,
        messages: filteredMessages,
        stream,
        ...(systemMessage && { system: systemMessage.content }),
        // MiniMax M2.7 的推理级别: off/minimal/medium/extended
        // 注意: MiniMax-M2.7-highspeed 可能要求必须设置此参数
        reasoning_level: 'minimal',
      }
    },
    parseResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens,
    }),
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    buildUrl: (baseUrl) => `${baseUrl}/chat/completions`,
    buildBody: (model, messages, stream) => ({
      model,
      messages,
      stream,
    }),
    parseResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens,
    }),
  },
  zhipu: {
    baseUrl: 'https://open.bigmodel.cn/api/paulin/v1',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    buildUrl: (baseUrl) => `${baseUrl}/chat/completions`,
    buildBody: (model, messages, stream) => ({
      model,
      messages,
      stream,
    }),
    parseResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens,
    }),
  },
  volcengine: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    buildUrl: (baseUrl) => `${baseUrl}/chat/completions`,
    buildBody: (model, messages, stream) => ({
      model,
      messages,
      stream,
    }),
    parseResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens,
    }),
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    buildUrl: (baseUrl) => `${baseUrl}/chat/completions`,
    buildBody: (model, messages, stream) => ({
      model,
      messages,
      stream,
    }),
    parseResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens,
    }),
  },
  moonshot: {
    baseUrl: 'https://api.moonshot.cn/v1',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    buildUrl: (baseUrl) => `${baseUrl}/chat/completions`,
    buildBody: (model, messages, stream) => ({
      model,
      messages,
      stream,
    }),
    parseResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens,
    }),
  },
  stepfun: {
    baseUrl: 'https://api.stepfun.com/v1',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    buildUrl: (baseUrl) => `${baseUrl}/chat/completions`,
    buildBody: (model, messages, stream) => ({
      model,
      messages,
      stream,
    }),
    parseResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens,
    }),
  },
  sensenova: {
    baseUrl: 'https://token.sensenova.cn/v1',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    buildUrl: (baseUrl) => `${baseUrl}/chat/completions`,
    buildBody: (model, messages, stream) => ({
      model,
      messages,
      stream,
    }),
    parseResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      tokens: data.usage?.total_tokens,
    }),
  },
}

// GET /api/chat/history
chatRouter.get('/history', async (_, res) => {
  try {
    const conversations = await store.conversations.getAll()
    res.json({ success: true, data: conversations })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch conversations' })
  }
})

// PUT /api/chat/history/:id - Update conversation messages
chatRouter.put('/history/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { messages, updatedAt, title } = req.body

    const existing = await store.conversations.getById(id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Conversation not found' })
    }

    const updates: any = {}
    if (messages !== undefined) updates.messages = messages
    if (updatedAt !== undefined) updates.updatedAt = updatedAt
    if (title !== undefined) updates.title = title

    const updated = await store.conversations.update(id, updates)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update conversation' })
  }
})

// DELETE /api/chat/history/:id
chatRouter.delete('/history/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await store.conversations.delete(id)
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Conversation not found' })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete conversation' })
  }
})

// POST /api/chat - Streaming response
chatRouter.post('/', async (req, res) => {
  console.log('[Chat] Received POST /api/chat', req.body)
  const { keyId, model, messages, conversationId, userMessage } = req.body

  if (!keyId || !model || !messages) {
    console.log('[Chat] Missing required fields')
    return res.status(400).json({ success: false, error: 'Missing required fields' })
  }

  const key = await store.keys.getById(keyId)
  console.log('[Chat] Key lookup result:', key)
  if (!key) {
    console.log('[Chat] API key not found for id:', keyId)
    return res.status(404).json({ success: false, error: 'API key not found' })
  }

  if (!key.enabled) {
    return res.status(400).json({ success: false, error: 'API key is disabled' })
  }

  // Handle conversation - create if doesn't exist
  let convId = conversationId
  if (convId) {
    const existing = await store.conversations.getById(convId)
    if (!existing) {
      await store.conversations.add({
        id: convId,
        title: userMessage.content.slice(0, 30) + '...',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
  }

  const config = PROVIDER_CONFIGS[key.provider]
  if (!config) {
    return res.status(400).json({ success: false, error: `Unsupported provider: ${key.provider}` })
  }

  const baseUrl = key.baseUrl || config.baseUrl
  if (!baseUrl) {
    return res.status(400).json({ success: false, error: 'No base URL configured' })
  }

  const url = config.buildUrl(baseUrl, model)
  const body = config.buildBody(model, messages, true, baseUrl)
  const headers = config.headers(key.key)

  // Add Anthropic-specific headers for custom providers
  if (key.provider === 'custom' && (baseUrl.includes('anthropic') || baseUrl.includes('minimax'))) {
    headers['anthropic-version'] = '2023-06-01'
    headers['anthropic-dangerous-direct-browser-access'] = 'true'
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Transfer-Encoding', 'chunked')

  let fullContent = ''
  let totalTokens = 0

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error?.message || errorData.error?.type || errorMessage
      } catch {
        // Response might not be JSON, try to get text
        try {
          const text = await response.text()
          if (text) errorMessage = text.slice(0, 200)
        } catch {}
      }
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
      res.end()
      return
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    if (key.provider === 'openai' || key.provider === 'azure' || key.provider === 'minimax' ||
        key.provider === 'deepseek' || key.provider === 'zhipu' || key.provider === 'volcengine' ||
        key.provider === 'qwen' || key.provider === 'moonshot' || key.provider === 'stepfun' ||
        key.provider === 'sensenova') {
      // OpenAI/Azure and compatible providers streaming format
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
            } else {
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content || ''
                if (content) {
                  fullContent += content
                  res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`)
                }
                if (parsed.usage) {
                  totalTokens = parsed.usage.total_tokens
                }
              } catch (e) {
                // Skip malformed JSON
              }
            }
          }
        }
      }
    } else if (key.provider === 'anthropic') {
      // Anthropic streaming format
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'content_block_delta') {
                const content = parsed.delta?.text || ''
                fullContent += content
                res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`)
              } else if (parsed.type === 'message_delta' && parsed.usage) {
                totalTokens = parsed.usage.output_tokens
              } else if (parsed.type === 'message_stop') {
                res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } else if (key.provider === 'custom' && baseUrl.includes('minimax')) {
      // MiniMax uses OpenAI-style streaming with SSE
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
            } else {
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content || ''
                if (content) {
                  fullContent += content
                  res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`)
                }
                if (parsed.usage) {
                  totalTokens = parsed.usage.total_tokens
                }
              } catch (e) {
                // Skip malformed JSON
              }
            }
          }
        }
      }
    } else {
      // Google or other - non-streaming fallback
      const data = await response.json()
      const { content, tokens } = config.parseResponse(data)
      fullContent = content
      totalTokens = tokens || 0
      res.write(`data: ${JSON.stringify({ content, done: true, tokens: totalTokens })}\n\n`)
    }

    // Update usage stats
    const costEstimate = estimateCost(key.provider, model, totalTokens)
    await store.keys.update(keyId, {
      lastUsedAt: new Date().toISOString(),
      usageCount: key.usageCount + 1,
      usageCost: key.usageCost + costEstimate,
    })

    // Save conversation
    if (conversationId && userMessage) {
      const assistantMessage = {
        id: generateId(),
        role: 'assistant' as const,
        content: fullContent,
        model,
        provider: key.provider,
        keyId,
        timestamp: new Date().toISOString(),
        tokens: totalTokens,
      }
      const allMessages = [...messages, userMessage, assistantMessage]
      await store.conversations.update(conversationId, {
        messages: allMessages,
        updatedAt: new Date().toISOString(),
      })
    }

  } catch (error: any) {
    console.error('Stream error:', error)
    res.write(`data: ${JSON.stringify({ error: error.message || 'Stream error' })}\n\n`)
  }

  res.end()
})

function estimateCost(provider: string, model: string, tokens: number): number {
  const rates: Record<string, number> = {
    'gpt-4o': 0.015, 'gpt-4o-mini': 0.0015, 'gpt-4-turbo': 0.03, 'gpt-3.5-turbo': 0.002,
    'claude-sonnet-4-20250514': 0.015, 'claude-3-5-sonnet-20241022': 0.015,
    'claude-3-5-haiku-20241022': 0.001, 'claude-3-opus-20240229': 0.075,
    'gemini-2.0-flash': 0.0004, 'gemini-1.5-pro': 0.007, 'gemini-1.5-flash': 0.00075,
  }
  return (tokens / 1000) * (rates[model] || 0.01)
}

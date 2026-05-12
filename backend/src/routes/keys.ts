import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { store, APIKey } from '../dataStore.js'

export const keysRouter = Router()

interface SpeedTestResult {
  keyId: string
  keyName: string
  provider: string
  status: 'success' | 'error' | 'timeout'
  latency: number
  ttft?: number
  tps?: number
  error?: string
}

const TEST_PROMPT = 'Say "KeyPilot speed test successful" in exactly those words.'

// GET /api/keys - List all keys
keysRouter.get('/', async (_, res) => {
  try {
    const keys = await store.keys.getAll()
    res.json({ success: true, data: keys })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch keys' })
  }
})

// POST /api/keys - Add new key
keysRouter.post('/', async (req, res) => {
  try {
    const { provider, name, key, baseUrl, models, enabled } = req.body

    if (!provider || !name || !key) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    const newKey: APIKey = {
      id: uuidv4(),
      provider,
      name,
      key,
      baseUrl,
      models,
      enabled: enabled ?? true,
      createdAt: new Date().toISOString(),
      usageCount: 0,
      usageCost: 0,
    }

    await store.keys.add(newKey)
    res.json({ success: true, data: newKey })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add key' })
  }
})

// PUT /api/keys/:id - Update key
keysRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const updated = await store.keys.update(id, updates)
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Key not found' })
    }

    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update key' })
  }
})

// DELETE /api/keys/:id - Delete key
keysRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await store.keys.delete(id)

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Key not found' })
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete key' })
  }
})

// POST /api/keys/:id/test - Test single key
keysRouter.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params
    const key = await store.keys.getById(id)

    if (!key) {
      return res.status(404).json({ success: false, error: 'Key not found' })
    }

    const result = await testKey(key)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to test key' })
  }
})

// POST /api/keys/test-all - Test all keys
keysRouter.post('/test-all', async (req, res) => {
  try {
    const keys = await store.keys.getAll()
    const results: SpeedTestResult[] = []

    for (const key of keys) {
      if (!key.enabled) continue
      const result = await testKey(key)
      results.push(result)
    }

    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to test keys' })
  }
})

async function testKey(key: APIKey): Promise<SpeedTestResult> {
  const result: SpeedTestResult = {
    keyId: key.id,
    keyName: key.name,
    provider: key.provider,
    status: 'error',
    latency: 0,
    error: 'Unknown error',
  }

  const startTime = Date.now()

  try {
    let url: string
    let headers: Record<string, string>
    let body: any

    const baseUrl = key.baseUrl || getDefaultBaseUrl(key.provider)

    if (key.provider === 'openai' || key.provider === 'minimax' || key.provider === 'deepseek' ||
        key.provider === 'zhipu' || key.provider === 'volcengine' || key.provider === 'qwen' ||
        key.provider === 'moonshot' || key.provider === 'stepfun') {
      url = `${baseUrl}/chat/completions`
      headers = {
        'Authorization': `Bearer ${key.key}`,
        'Content-Type': 'application/json',
      }
      body = {
        model: key.provider === 'openai' ? 'gpt-3.5-turbo' : key.provider === 'minimax' ? 'MiniMax-M2.7-mini' :
                key.provider === 'deepseek' ? 'deepseek-chat' : key.provider === 'zhipu' ? 'glm-4' :
                key.provider === 'volcengine' ? 'doubao-pro-32k' : key.provider === 'qwen' ? 'qwen-plus' :
                key.provider === 'moonshot' ? 'moonshot-v1-8k' : 'step-1-flash',
        messages: [{ role: 'user', content: TEST_PROMPT }],
        max_tokens: 50,
      }
    } else if (key.provider === 'anthropic') {
      url = `${baseUrl}/messages`
      headers = {
        'x-api-key': key.key,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      }
      body = {
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: TEST_PROMPT }],
        max_tokens: 50,
      }
    } else if (key.provider === 'google') {
      url = `${baseUrl}/models/gemini-1.5-flash:generateContent?key=${key.key}`
      headers = { 'Content-Type': 'application/json' }
      body = {
        contents: [{ parts: [{ text: TEST_PROMPT }] }],
        generationConfig: { maxOutputTokens: 50 },
      }
    } else {
      result.status = 'error'
      result.error = `Unsupported provider: ${key.provider}`
      return result
    }

    const firstTokenTime = Date.now()
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    result.latency = Date.now() - startTime
    result.ttft = firstTokenTime - startTime

    if (!response.ok) {
      const data = await response.json()
      result.status = 'error'
      result.error = data.error?.message || `API error: ${response.status}`
      return result
    }

    const data = await response.json()
    let content = ''

    if (key.provider === 'openai') {
      content = data.choices?.[0]?.message?.content || ''
    } else if (key.provider === 'anthropic') {
      content = data.content?.[0]?.text || ''
    } else if (key.provider === 'google') {
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }

    const totalTime = Date.now() - startTime
    const tokens = content.split(/\s+/).length
    result.tps = tokens > 0 ? Math.round((tokens / totalTime) * 1000) : 0
    result.status = 'success'
    result.error = undefined

  } catch (error: any) {
    result.status = 'error'
    result.error = error.message || 'Connection failed'
  }

  return result
}

function getDefaultBaseUrl(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1'
    case 'anthropic':
      return 'https://api.anthropic.com/v1'
    case 'google':
      return 'https://generativelanguage.googleapis.com/v1beta'
    case 'minimax':
      return 'https://api.minimax.chat/v1'
    case 'deepseek':
      return 'https://api.deepseek.com/v1'
    case 'zhipu':
      return 'https://open.bigmodel.cn/api/paulin/v1'
    case 'volcengine':
      return 'https://ark.cn-beijing.volces.com/api/v3'
    case 'qwen':
      return 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    case 'moonshot':
      return 'https://api.moonshot.cn/v1'
    case 'stepfun':
      return 'https://api.stepfun.com/v1'
    default:
      return ''
  }
}

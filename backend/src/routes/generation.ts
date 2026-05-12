import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { store } from '../dataStore.js'
import { getProviderForModel, getProvidersByType, type GenerationType } from '../services/generation/index.js'
import { getGenerationBaseUrl, providerSupportsType } from '../services/generation/config.js'

export const generationRouter = Router()

// Database record types
interface GenerationRecord {
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

// GET /api/generation/models - Get all available models by type
generationRouter.get('/models', async (req, res) => {
  const { type } = req.query

  if (!type || !['image', 'video', 'audio', 'music'].includes(type as string)) {
    return res.json({
      success: true,
      data: {
        image: [] as any[],
        video: [] as any[],
        audio: [] as any[],
        music: [] as any[],
      }
    })
  }

  const genType = type as GenerationType
  const providers = getProvidersByType(genType)

  // Return models from all providers that support this type
  // The frontend will filter by enabled keys
  const models = providers.flatMap(p =>
    p.supportedTypes.includes(genType)
      ? { id: p.name, name: p.name, type: genType }
      : []
  )

  res.json({ success: true, data: { [genType]: models } })
})

// GET /api/generation/history/:type - Get history for a type
generationRouter.get('/history/:type', async (req, res) => {
  try {
    const { type } = req.params

    if (!['image', 'video', 'audio', 'music'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid type' })
    }

    const tableName = `${type}History`
    const method = (store as any)[tableName]

    if (!method) {
      return res.status(400).json({ success: false, error: 'History not available for this type' })
    }

    const history = await method.getAll()
    res.json({ success: true, data: history })
  } catch (error) {
    console.error(`[Generation] History error:`, error)
    res.status(500).json({ success: false, error: 'Failed to fetch history' })
  }
})

// POST /api/generation/:type - Generate content
generationRouter.post('/:type', async (req, res) => {
  try {
    const { type } = req.params
    const { keyId, model, prompt, ...options } = req.body

    if (!['image', 'video', 'audio', 'music'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid type' })
    }

    if (!keyId || !model || !prompt) {
      return res.status(400).json({ success: false, error: 'Missing required fields: keyId, model, prompt' })
    }

    // Get API key from store
    const key = await store.keys.getById(keyId)
    if (!key) {
      return res.status(404).json({ success: false, error: 'API key not found' })
    }

    if (!key.enabled) {
      return res.status(400).json({ success: false, error: 'API key is disabled' })
    }

    // Get provider for this model
    const provider = getProviderForModel(model)
    if (!provider) {
      return res.status(400).json({ success: false, error: `Unsupported model: ${model}` })
    }

    if (!provider.supports(type as GenerationType)) {
      return res.status(400).json({ success: false, error: `Provider ${provider.name} does not support ${type} generation` })
    }

    // Check if provider supports this type
    if (!providerSupportsType(key.provider, type as any)) {
      return res.status(400).json({ success: false, error: `Provider ${key.provider} does not support ${type} generation` })
    }

    // Get the correct baseUrl for this provider and type
    const generationBaseUrl = getGenerationBaseUrl(key.provider, type as any, key.baseUrl)
    if (!generationBaseUrl) {
      return res.status(400).json({ success: false, error: 'No API endpoint configured for this provider and type' })
    }

    const genParams = {
      model,
      prompt,
      keyId,
      apiKey: key.key,
      baseUrl: generationBaseUrl,
      ...options,
    }

    console.log(`[Generation] ${type} request:`, { model, provider: provider.name, baseUrl: generationBaseUrl })

    // Call provider's generate function
    if (!provider.generate) {
      return res.status(400).json({ success: false, error: 'This model requires async generation' })
    }

    const result = await provider.generate(genParams)
    console.log(`[Generation] ${type} result:`, result)

    if (!result.success) {
      return res.status(400).json(result)
    }

    // Check if async task
    if ('taskId' in result) {
      // Async result - return task info
      return res.json(result)
    }

    // Sync result - save to history and update usage
    const tableName = `${type}History`
    const method = (store as any)[tableName]

    if (method && result.data) {
      const url = result.data.urls?.[0] || result.data.base64?.[0] || ''
      if (url) {
        let record: any = {
          id: uuidv4(),
          prompt,
          model,
          provider: key.provider,
          keyId,
          createdAt: new Date().toISOString(),
        }

        // Use type-specific URL field name
        if (type === 'image') {
          record.imageUrl = url
        } else if (type === 'video') {
          record.videoUrl = url
          record.thumbnailUrl = (result.data as any).thumbnailUrl
          record.duration = (result.data as any).duration
        } else if (type === 'audio') {
          record.audioUrl = url
        } else if (type === 'music') {
          record.musicUrl = url
        }

        await method.add(record)
      }
    }

    // Update key usage
    await store.keys.update(keyId, {
      lastUsedAt: new Date().toISOString(),
      usageCount: key.usageCount + 1,
      usageCost: key.usageCost + (result.cost || 0),
    })

    res.json(result)
  } catch (error: any) {
    console.error(`[Generation] Generate error:`, error)
    res.status(500).json({ success: false, error: error.message || 'Generation failed' })
  }
})

// GET /api/generation/status/:type/:taskId - Get async task status
generationRouter.get('/status/:type/:taskId', async (req, res) => {
  try {
    const { type, taskId } = req.params
    const { keyId, model } = req.query

    if (!['image', 'video', 'audio', 'music'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid type' })
    }

    if (!keyId || !model) {
      return res.status(400).json({ success: false, error: 'Missing keyId or model' })
    }

    const key = await store.keys.getById(keyId as string)
    if (!key) {
      return res.status(404).json({ success: false, error: 'API key not found' })
    }

    const provider = getProviderForModel(model as string)
    if (!provider?.getStatus) {
      return res.status(400).json({ success: false, error: 'Status check not supported for this model' })
    }

    const result = await provider.getStatus(taskId, {
      model: model as string,
      prompt: '',
      keyId: keyId as string,
      apiKey: key.key,
      baseUrl: key.baseUrl || undefined,
    })

    if (!result.success && result.code === 'PROCESSING') {
      return res.json({ success: true, status: 'processing', taskId })
    }

    res.json(result)
  } catch (error: any) {
    console.error(`[Generation] Status error:`, error)
    res.status(500).json({ success: false, error: error.message || 'Failed to get status' })
  }
})

// DELETE /api/generation/:type/:id - Delete from history
generationRouter.delete('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params

    if (!['image', 'video', 'audio', 'music'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid type' })
    }

    const tableName = `${type}History`
    const method = (store as any)[tableName]

    if (!method) {
      return res.status(400).json({ success: false, error: 'History not available for this type' })
    }

    const deleted = await method.delete(id)

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Record not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error(`[Generation] Delete error:`, error)
    res.status(500).json({ success: false, error: 'Failed to delete' })
  }
})

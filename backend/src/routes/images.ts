import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { store } from '../dataStore.js'

export const imagesRouter = Router()

interface ImageGeneration {
  id: string
  prompt: string
  model: string
  provider: string
  keyId: string
  imageUrl: string
  createdAt: string
}

// GET /api/images/history - Get image history
imagesRouter.get('/history', async (_, res) => {
  try {
    const history = await store.imageHistory.getAll()
    res.json({ success: true, data: history })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch image history' })
  }
})

// POST /api/images/generate - Generate image
imagesRouter.post('/generate', async (req, res) => {
  try {
    const { keyId, model, prompt, size, quality } = req.body

    if (!keyId || !model || !prompt) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    const key = await store.keys.getById(keyId)
    if (!key) {
      return res.status(404).json({ success: false, error: 'API key not found' })
    }

    if (!key.enabled) {
      return res.status(400).json({ success: false, error: 'API key is disabled' })
    }

    let imageUrl: string
    let cost = 0.04

    if (key.provider === 'openai' || key.provider === 'azure') {
      // OpenAI DALL-E API
      const baseUrl = key.baseUrl || 'https://api.openai.com/v1'
      const url = `${baseUrl}/images/generations`

      const body: any = {
        model: model || 'dall-e-3',
        prompt,
        response_format: 'b64_json',
      }

      if (size) body.size = size
      if (quality) body.quality = quality

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error?.message || `API error: ${response.status}`
        return res.status(response.status).json({ success: false, error: errorMessage })
      }

      if (data.data?.[0]?.b64_json) {
        imageUrl = `data:image/png;base64,${data.data[0].b64_json}`
      } else if (data.data?.[0]?.url) {
        imageUrl = data.data[0].url
      } else {
        return res.status(500).json({ success: false, error: 'No image in response' })
      }

      // Estimate cost
      cost = model === 'dall-e-3' ? 0.04 : 0.02
    } else {
      // For other providers, return error (not yet supported)
      return res.status(400).json({
        success: false,
        error: 'Image generation is only supported for OpenAI DALL-E currently'
      })
    }

    // Update key usage
    await store.keys.update(keyId, {
      lastUsedAt: new Date().toISOString(),
      usageCount: key.usageCount + 1,
      usageCost: key.usageCost + cost,
    })

    const imageGeneration: ImageGeneration = {
      id: uuidv4(),
      prompt,
      model,
      provider: key.provider,
      keyId,
      imageUrl,
      createdAt: new Date().toISOString(),
    }

    await store.imageHistory.add(imageGeneration)

    res.json({ success: true, data: { imageUrl } })
  } catch (error: any) {
    console.error('Image generation error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate image' })
  }
})

// DELETE /api/images/:id - Delete image from history
imagesRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await store.imageHistory.delete(id)

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Image not found' })
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete image' })
  }
})

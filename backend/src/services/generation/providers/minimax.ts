import type { GenerationProvider, GenerationParams, GenerationResult, GenerationError, GenerationTaskResult } from '../base'

export const miniMaxProvider: GenerationProvider = {
  name: 'minimax',
  supportedTypes: ['image', 'video', 'audio', 'music'],

  supports(type) {
    return this.supportedTypes.includes(type)
  },

  supportsModel(model: string) {
    const supportedModels = [
      // Image
      'image-01', 'image-01-live',
      // Video
      'MiniMax-Hailuo-2.3', 'MiniMax-Hailuo-2.3-Fast',
      // Audio
      'speech-2.8-hd', 'speech-2.6', 'speech-02',
      // Music
      'music-2.5',
    ]
    return supportedModels.includes(model)
  },

  async generate(params: GenerationParams): Promise<GenerationResult | GenerationTaskResult | GenerationError> {
    const { model, apiKey, baseUrl } = params

    if (!baseUrl) {
      return { success: false, error: 'No baseUrl provided' }
    }

    try {
      // Image generation (sync for image-01)
      if (model === 'image-01' || model === 'image-01-live') {
        return generateImage(params, apiKey, baseUrl)
      }

      // Video generation (async)
      if (model === 'MiniMax-Hailuo-2.3' || model === 'MiniMax-Hailuo-2.3-Fast') {
        return generateVideo(params, apiKey, baseUrl)
      }

      // Audio generation
      if (model.startsWith('speech-')) {
        return generateAudio(params, apiKey, baseUrl)
      }

      // Music generation
      if (model === 'music-2.5') {
        return generateMusic(params, apiKey, baseUrl)
      }

      return { success: false, error: `Unsupported model: ${model}` }
    } catch (error: any) {
      return { success: false, error: error.message || 'Generation failed' }
    }
  },

  async getStatus(taskId: string, params: GenerationParams): Promise<GenerationResult | GenerationError> {
    const { apiKey, baseUrl } = params

    if (!baseUrl) {
      return { success: false, error: 'No baseUrl provided' }
    }

    try {
      const response = await fetch(`${baseUrl}/v1/image_generation?task_id=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error?.message || 'Failed to get status' }
      }

      if (data.status === 'SUCCESS') {
        return {
          success: true,
          data: { urls: data.data?.image_urls || [] },
          cost: 0.04,
          provider: 'minimax',
          model: params.model,
        }
      } else if (data.status === 'FAIL') {
        return { success: false, error: data.error?.message || 'Generation failed' }
      } else {
        // Still processing
        return { success: false, error: 'Task still processing', code: 'PROCESSING' }
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to get status' }
    }
  },
}

// Image generation (sync for image-01)
async function generateImage(params: GenerationParams, apiKey: string, baseUrl: string): Promise<GenerationResult | GenerationError> {
  const {
    model,
    prompt,
    aspect_ratio = '1:1',
    width,
    height,
    n = 1,
    response_format = 'url',
    seed,
    prompt_optimizer = false,
    aigc_watermark = false,
  } = params

  const body: any = {
    model,
    prompt,
    aspect_ratio,
    n,
    response_format,
    prompt_optimizer,
    aigc_watermark,
  }

  // Add width/height for image-01 (takes precedence over aspect_ratio)
  if (model === 'image-01' && width && height) {
    body.width = width
    body.height = height
  }

  // Add style for image-01-live
  if (model === 'image-01-live') {
    body.style = {
      style_type: params.style_type || '漫画',
      style_weight: params.style_weight || 0.8,
    }
  }

  // Add seed if provided
  if (seed !== undefined) {
    body.seed = seed
  }

  console.log(`[MiniMax] Image request to ${baseUrl}/v1/image_generation:`, { model, prompt: prompt.slice(0, 50), aspect_ratio, n })

  const response = await fetch(`${baseUrl}/v1/image_generation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()
  console.log(`[MiniMax] Image response status: ${response.status}, data:`, JSON.stringify(data).slice(0, 500))

  // Check for API errors via base_resp
  if (data.base_resp && data.base_resp.status_code !== 0) {
    return {
      success: false,
      error: data.base_resp.status_msg || 'Image generation failed',
      code: String(data.base_resp.status_code),
    }
  }

  if (!response.ok) {
    return {
      success: false,
      error: data.error?.status_msg || data.error?.message || 'Image generation failed',
      code: String(data.error?.status_code),
    }
  }

  // For image-01/image-01-live, response may include immediate results
  if (data.data?.image_urls || data.data?.image_base64) {
    return {
      success: true,
      data: {
        urls: data.data.image_urls,
        base64: data.data.image_base64,
      },
      cost: 0.04 * n,
      provider: 'minimax',
      model,
    }
  }

  // For async tasks (returns task id for polling)
  if (data.id) {
    return {
      success: true,
      data: { taskId: data.id },
      cost: 0.04 * n,
      provider: 'minimax',
      model,
    }
  }

  return { success: false, error: 'Invalid response from API' }
}

// Video generation (async)
async function generateVideo(params: GenerationParams, apiKey: string, baseUrl: string): Promise<GenerationTaskResult | GenerationError> {
  const { model, prompt } = params

  // MiniMax video uses different endpoint - hailuo video
  const response = await fetch(`${baseUrl}/hailo_v1/video_generation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      duration: params.duration || 6,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    return {
      success: false,
      error: data.error?.message || 'Video generation failed',
      code: String(data.error?.status_code),
    }
  }

  if (data.task_id) {
    return {
      success: true,
      taskId: data.task_id,
      status: 'pending',
      provider: 'minimax',
      model,
    }
  }

  return { success: false, error: 'Invalid response from API' }
}

// Audio generation (TTS)
async function generateAudio(params: GenerationParams, apiKey: string, baseUrl: string): Promise<GenerationResult | GenerationError> {
  const { model, prompt } = params
  const options = params as any

  const voice_id = options.voice_id || 'male-qn-qingse'
  const speed = options.speed ?? 1
  const vol = options.vol ?? 1
  const pitch = options.pitch ?? 0
  const format = options.format || 'mp3'
  const sample_rate = options.sample_rate || 32000
  const bitrate = options.bitrate || 128000

  const response = await fetch(`${baseUrl}/v1/t2a_v2`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      text: prompt,
      stream: false,
      voice_setting: {
        voice_id,
        speed,
        vol,
        pitch,
      },
      audio_setting: {
        sample_rate,
        bitrate,
        format,
        channel: 1,
      },
    }),
  })

  let data: any
  try {
    data = await response.json()
  } catch (e) {
    const text = await response.text()
    console.log(`[MiniMax] Audio response not JSON:`, response.status, text?.slice(0, 500))
    return {
      success: false,
      error: `API error: ${response.status} ${response.statusText}`,
      code: String(response.status),
    }
  }

  console.log(`[MiniMax] Audio response status: ${response.status}`)
  console.log(`[MiniMax] Audio response keys:`, Object.keys(data))
  console.log(`[MiniMax] Audio data:`, JSON.stringify(data).slice(0, 1000))

  if (!response.ok) {
    return {
      success: false,
      error: data.base_resp?.status_msg || data.error?.message || 'Audio generation failed',
      code: String(data.base_resp?.status_code),
    }
  }

  // Check for API errors via base_resp
  if (data.base_resp && data.base_resp.status_code !== 0) {
    return {
      success: false,
      error: data.base_resp.status_msg || 'Audio generation failed',
      code: String(data.base_resp.status_code),
    }
  }

  // For non-streaming, status=2 means completed
  if (data.data?.audio) {
    // Audio is hex-encoded, convert to base64 data URL
    const hexAudio = data.data.audio
    const buffer = Buffer.from(hexAudio, 'hex')
    const base64Audio = buffer.toString('base64')
    const audioDataUrl = `data:audio/${format || 'mp3'};base64,${base64Audio}`

    return {
      success: true,
      data: {
        urls: [audioDataUrl],
      },
      cost: 0.004, // MiniMax TTS cost per 1000 chars approx
      provider: 'minimax',
      model,
    }
  }

  return { success: false, error: 'Invalid response from API' }
}

// Music generation
async function generateMusic(params: GenerationParams, apiKey: string, baseUrl: string): Promise<GenerationResult | GenerationError> {
  const { model, prompt, lyrics, instrumental = false } = params

  const body: any = {
    model,
    prompt,
    instrumental,
  }

  if (lyrics) {
    body.lyrics = lyrics
  }

  const response = await fetch(`${baseUrl}/music_generation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    return {
      success: false,
      error: data.error?.message || 'Music generation failed',
      code: String(data.error?.status_code),
    }
  }

  if (data.data?.music_url || data.data?.music_base64) {
    return {
      success: true,
      data: {
        urls: data.data.music_url ? [data.data.music_url] : undefined,
        base64: data.data.music_base64 ? [data.data.music_base64] : undefined,
      },
      cost: 0.2, // MiniMax music generation cost
      provider: 'minimax',
      model,
    }
  }

  return { success: false, error: 'Invalid response from API' }
}

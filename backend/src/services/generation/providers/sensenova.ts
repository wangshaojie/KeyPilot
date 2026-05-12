import type { GenerationProvider, GenerationParams, GenerationResult, GenerationError } from '../base'

export const senseNovaProvider: GenerationProvider = {
  name: 'sensenova',
  supportedTypes: ['image'],

  supports(type) {
    return this.supportedTypes.includes(type)
  },

  supportsModel(model: string) {
    const supportedModels = [
      'SenseNova-U1-Image',
      'wanx2.1',
      'sensenova-u1-fast',
    ]
    return supportedModels.includes(model)
  },

  async generate(params: GenerationParams): Promise<GenerationResult | GenerationError> {
    const { model, prompt, apiKey, baseUrl } = params

    if (!baseUrl) {
      return { success: false, error: 'No baseUrl provided' }
    }

    try {
      if (model === 'SenseNova-U1-Image' || model === 'wanx2.1' || model === 'sensenova-u1-fast') {
        return generateImage(params, apiKey, baseUrl)
      }

      return { success: false, error: `Unsupported model: ${model}` }
    } catch (error: any) {
      return { success: false, error: error.message || 'Generation failed' }
    }
  },
}

// Image generation
async function generateImage(params: GenerationParams, apiKey: string, baseUrl: string): Promise<GenerationResult | GenerationError> {
  const { model, prompt } = params
  const options = params as any

  // sensenova-u1-fast uses /v1/images/generations
  if (model === 'sensenova-u1-fast') {
    const body: any = {
      model,
      prompt,
      size: options.image_size || '2752x1536',
      n: options.image_num || 1,
    }

    console.log(`[SenseNova] Image request to ${baseUrl}/images/generations:`, { model, prompt: prompt?.slice(0, 50) })

    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    console.log(`[SenseNova] Image response status: ${response.status}, data:`, JSON.stringify(data).slice(0, 200))

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || data.error?.status_msg || 'Image generation failed',
        code: String(data.error?.status_code),
      }
    }

    if (data.data?.[0]?.url) {
      return {
        success: true,
        data: {
          urls: data.data.map((img: any) => img.url),
        },
        cost: 0,
        provider: 'sensenova',
        model,
      }
    }

    return { success: false, error: 'Invalid response from API' }
  }

  // wanx2.1 and SenseNova-U1-Image use /v1/image_generation
  const body: any = {
    model,
    prompt,
  }

  if (model === 'wanx2.1') {
    body.image_size = options.image_size || '1024x1024'
    body.image_num = options.image_num || 1
  }

  console.log(`[SenseNova] Image request to ${baseUrl}/image_generation:`, { model, prompt: prompt?.slice(0, 50) })

  const response = await fetch(`${baseUrl}/image_generation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()
  console.log(`[SenseNova] Image response status: ${response.status}, data:`, JSON.stringify(data).slice(0, 200))

  if (!response.ok) {
    return {
      success: false,
      error: data.error?.message || data.error?.status_msg || 'Image generation failed',
      code: String(data.error?.status_code),
    }
  }

  // For wanx2.1, response has image_urls directly
  // image_urls may be an array of objects {url, width, height} or just strings
  if (data.data?.image_urls || data.data?.image_base64) {
    let urls = data.data.image_urls
    // If each item is an object with url property, extract just the url
    if (urls && urls.length > 0 && typeof urls[0] === 'object' && urls[0].url) {
      urls = urls.map((img: any) => img.url)
    }
    let base64 = data.data.image_base64
    if (base64 && base64.length > 0 && typeof base64[0] === 'object' && base64[0].image_base64) {
      base64 = base64.map((img: any) => img.image_base64)
    }
    return {
      success: true,
      data: {
        urls,
        base64,
      },
      cost: 0,
      provider: 'sensenova',
      model,
    }
  }

  return { success: false, error: 'Invalid response from API' }
}

// Generation API baseUrl configuration for each provider
// Only 'custom' provider uses user-configured baseUrl

export interface GenerationApiConfig {
  image: string
  video: string
  audio: string
  music: string
}

export const GENERATION_API_BASEURLS: Record<string, GenerationApiConfig | null> = {
  // MiniMax: Image/Video/Audio/Music all use api.minimaxi.com
  minimax: {
    image: 'https://api.minimaxi.com',
    video: 'https://api.minimaxi.com',
    audio: 'https://api.minimaxi.com',
    music: 'https://api.minimaxi.com',
  },

  // OpenAI: DALL-E uses api.openai.com
  openai: {
    image: 'https://api.openai.com/v1',
    video: '',  // Not supported
    audio: '',  // Not supported
    music: '',  // Not supported
  },

  // Google: Imagen uses generativelanguage.googleapis.com
  google: {
    image: 'https://generativelanguage.googleapis.com/v1beta',
    video: '',  // Veo uses different endpoint
    audio: '',
    music: '',
  },

  // Azure: Uses user-configured endpoint
  azure: null,  // Uses user's deployment endpoint

  // DeepSeek: Not supported yet
  deepseek: null,

  // 智谱 AI: CogView for images
  zhipu: {
    image: 'https://open.bigmodel.cn/api/paulin/v1',
    video: '',
    audio: '',
    music: '',
  },

  // 火山引擎: Not supported yet
  volcengine: null,

  // 阿里通义: WanX for images
  qwen: {
    image: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    video: '',
    audio: '',
    music: '',
  },

  // 月之暗面: Not supported yet
  moonshot: null,

  // 阶跃星辰: Not supported yet
  stepfun: null,

  // SenseNova: Uses token.sensenova.cn
  sensenova: {
    image: 'https://token.sensenova.cn/v1',
    video: '',
    audio: '',
    music: '',
  },

  // Custom: Uses user-configured baseUrl
  custom: null,
}

// Get baseUrl for a specific provider and type
export function getGenerationBaseUrl(provider: string, type: 'image' | 'video' | 'audio' | 'music', customBaseUrl?: string): string | null {
  // custom provider uses user's configured baseUrl
  if (provider === 'custom') {
    return customBaseUrl || null
  }

  const config = GENERATION_API_BASEURLS[provider]
  if (!config) {
    return null
  }

  return config[type] || null
}

// Check if a provider supports a specific generation type
export function providerSupportsType(provider: string, type: 'image' | 'video' | 'audio' | 'music'): boolean {
  if (provider === 'custom') {
    return true  // Custom could support anything
  }

  const config = GENERATION_API_BASEURLS[provider]
  if (!config) {
    return false
  }

  return !!config[type]
}

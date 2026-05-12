export const PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    color: '#10a37f',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      // GPT-4o Series
      { id: 'gpt-4o', name: 'GPT-4o', type: 'chat' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', type: 'chat' },
      { id: 'gpt-4o-2024-08-06', name: 'GPT-4o (2024-08-06)', type: 'chat' },
      { id: 'chatgpt-4o-latest', name: 'ChatGPT-4o Latest', type: 'chat' },
      // GPT-4 Turbo Series
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', type: 'chat' },
      { id: 'gpt-4-turbo-2024-04-09', name: 'GPT-4 Turbo (2024-04-09)', type: 'chat' },
      // GPT-3.5 Turbo
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', type: 'chat' },
      { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K', type: 'chat' },
      // o1 Series
      { id: 'o1-preview', name: 'o1 Preview', type: 'chat' },
      { id: 'o1-mini', name: 'o1 Mini', type: 'chat' },
      // Image Generation
      { id: 'dall-e-3', name: 'DALL-E 3', type: 'image' },
      { id: 'dall-e-2', name: 'DALL-E 2', type: 'image' },
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg',
    color: '#d97757',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', type: 'chat' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', type: 'chat' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', type: 'chat' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', type: 'chat' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', type: 'chat' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', type: 'chat' },
    ],
  },
  google: {
    id: 'google',
    name: 'Google AI',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Google_AI_logo.svg',
    color: '#4285f4',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', type: 'chat' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp', type: 'chat' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', type: 'chat' },
      { id: 'gemini-1.5-pro-002', name: 'Gemini 1.5 Pro 002', type: 'chat' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', type: 'chat' },
      { id: 'gemini-1.5-flash-002', name: 'Gemini 1.5 Flash 002', type: 'chat' },
      { id: 'gemini-pro', name: 'Gemini Pro', type: 'chat' },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', type: 'chat' },
      { id: 'imagen-3', name: 'Imagen 3', type: 'image' },
      { id: 'imagen-3-fast', name: 'Imagen 3 Fast', type: 'image' },
    ],
  },
  azure: {
    id: 'azure',
    name: 'Azure OpenAI',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Azure_Services_Icon.svg',
    color: '#0078d4',
    baseUrl: '', // Requires deployment endpoint
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', type: 'chat' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', type: 'chat' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', type: 'chat' },
      { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo', type: 'chat' },
      { id: 'dall-e-3', name: 'DALL-E 3', type: 'image' },
    ],
  },
  minimax: {
    id: 'minimax',
    name: 'MiniMax',
    logo: '',
    color: '#00d4aa',
    baseUrl: 'https://api.minimax.chat/v1',
    models: [
      // Chat models
      { id: 'MiniMax-M2.7', name: 'MiniMax M2.7', type: 'chat' },
      { id: 'MiniMax-M2.7-highspeed', name: 'MiniMax M2.7 HighSpeed', type: 'chat' },
      { id: 'MiniMax-M2.5', name: 'MiniMax M2.5', type: 'chat' },
      { id: 'MiniMax-M2.5-highspeed', name: 'MiniMax M2.5 HighSpeed', type: 'chat' },
      // Image models
      { id: 'image-01', name: 'Image-01', type: 'image' },
      { id: 'image-01-live', name: 'Image-01 动态', type: 'image', params: {
        style_type: {
          label: '风格',
          options: [
            { id: '漫画', name: '漫画' },
            { id: '元气', name: '元气' },
            { id: '中世纪', name: '中世纪' },
            { id: '水彩', name: '水彩' },
          ],
          default: '漫画'
        }
      }},
      // Video models
      { id: 'MiniMax-Hailuo-2.3', name: '海螺 2.3', type: 'video' },
      { id: 'MiniMax-Hailuo-2.3-Fast', name: '海螺 2.3 快速', type: 'video' },
      // Audio models
      { id: 'speech-2.8-hd', name: '语音 2.8 HD', type: 'audio', params: {
        voice: {
          label: '音色',
          options: [
            { id: 'English_expressive_narrator', name: '英文解说' },
            { id: 'English_narration', name: '英文旁白' },
            { id: 'Chinese_cn', name: '中文' },
          ],
          default: 'English_expressive_narrator'
        }
      }},
      // Music models
      { id: 'music-2.5', name: '音乐 2.5', type: 'music' },
    ],
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    logo: '',
    color: '#60a5fa',
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', type: 'chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', type: 'chat' },
      { id: 'deepseek-v2.5', name: 'DeepSeek V2.5', type: 'chat' },
      { id: 'deepseek-v3', name: 'DeepSeek V3', type: 'chat' },
      { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', type: 'chat' },
      { id: 'deepseek-r1', name: 'DeepSeek R1', type: 'chat' },
      { id: 'deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 Distill Qwen 32B', type: 'chat' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B', type: 'chat' },
    ],
  },
  zhipu: {
    id: 'zhipu',
    name: '智谱 AI',
    logo: '',
    color: '#8b5cf6',
    baseUrl: 'https://open.bigmodel.cn/api/paulin/v1',
    models: [
      { id: 'glm-4', name: 'GLM-4', type: 'chat' },
      { id: 'glm-4-plus', name: 'GLM-4 Plus', type: 'chat' },
      { id: 'glm-4-vision', name: 'GLM-4 Vision', type: 'chat' },
      { id: 'glm-3-turbo', name: 'GLM-3 Turbo', type: 'chat' },
      { id: 'cogview-3', name: 'CogView 3', type: 'image' },
      { id: 'cogview-3-plus', name: 'CogView 3 Plus', type: 'image' },
    ],
  },
  volcengine: {
    id: 'volcengine',
    name: '火山引擎',
    logo: '',
    color: '#ff6b00',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      { id: 'doubao-pro-32k', name: '豆包 Pro 32K', type: 'chat' },
      { id: 'doubao-pro-128k', name: '豆包 Pro 128K', type: 'chat' },
      { id: 'doubao-beta', name: '豆包 Beta', type: 'chat' },
      { id: 'skylark2', name: 'Skylark2', type: 'chat' },
      { id: 'skylark2-pro', name: 'Skylark2 Pro', type: 'chat' },
      { id: 'skylark2-vision', name: 'Skylark2 Vision', type: 'chat' },
    ],
  },
  qwen: {
    id: 'qwen',
    name: '阿里通义',
    logo: '',
    color: '#ff6b00',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen-plus', name: 'Qwen Plus', type: 'chat' },
      { id: 'qwen-plus-2025-01-25', name: 'Qwen Plus (2025-01-25)', type: 'chat' },
      { id: 'qwen-turbo', name: 'Qwen Turbo', type: 'chat' },
      { id: 'qwen-turbo-2025-01-25', name: 'Qwen Turbo (2025-01-25)', type: 'chat' },
      { id: 'qwen-max', name: 'Qwen Max', type: 'chat' },
      { id: 'qwen-max-longcontext', name: 'Qwen Max LongContext', type: 'chat' },
      { id: 'qwen-vl-plus', name: 'Qwen VL Plus', type: 'chat' },
      { id: 'qwen-vl-max', name: 'Qwen VL Max', type: 'chat' },
      { id: 'qwen-audio-turbo', name: 'Qwen Audio Turbo', type: 'chat' },
      { id: 'wanx2.1', name: 'WanX2.1', type: 'image' },
    ],
  },
  moonshot: {
    id: 'moonshot',
    name: '月之暗面 (Moonshot)',
    logo: '',
    color: '#8b5cf6',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot V1 8K', type: 'chat' },
      { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K', type: 'chat' },
      { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K', type: 'chat' },
    ],
  },
  stepfun: {
    id: 'stepfun',
    name: '阶跃星辰 (StepFun)',
    logo: '',
    color: '#00c7b7',
    baseUrl: 'https://api.stepfun.com/v1',
    models: [
      { id: 'step-1v', name: 'Step-1V', type: 'chat' },
      { id: 'step-1-flash', name: 'Step-1 Flash', type: 'chat' },
      { id: 'step-1o-mini', name: 'Step-1o Mini', type: 'chat' },
    ],
  },
  sensenova: {
    id: 'sensenova',
    name: 'SenseNova',
    logo: '',
    color: '#00a1f1',
    baseUrl: 'https://token.sensenova.cn/v1',
    models: [
      // Chat / Multimodal models
      { id: 'sensenova-6.7-flash-lite', name: 'SenseNova 6.7 Flash-Lite', type: 'chat' },
      { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', type: 'chat' },
      // Image models
      { id: 'sensenova-u1-fast', name: 'SenseNova U1 Fast (图像)', type: 'image' },
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom Provider',
    logo: '',
    color: '#71717a',
    baseUrl: '',
    models: [
      { id: 'custom-chat', name: 'Custom Chat', type: 'chat' },
      { id: 'custom-image', name: 'Custom Image', type: 'image' },
    ],
  },
} as const

export type ProviderId = keyof typeof PROVIDERS

export type ModelType = 'chat' | 'image' | 'video' | 'audio' | 'music'

export interface Model {
  id: string
  name: string
  type: ModelType
  // 扩展参数，如 aspect_ratio, duration 等
  params?: Record<string, {
    label: string
    options?: { id: string; name: string }[]
    default?: string
    min?: number
    max?: number
  }>
}

export interface Provider {
  id: string
  name: string
  logo: string
  color: string
  baseUrl: string
  models: Model[]
}

export const CHAT_MODELS = Object.values(PROVIDERS).flatMap(p =>
  p.models.filter(m => m.type === 'chat').map(m => ({
    ...m,
    provider: p.id,
    providerName: p.name,
  }))
)

export const IMAGE_MODELS = Object.values(PROVIDERS).flatMap(p =>
  p.models.filter(m => m.type === 'image').map(m => ({
    ...m,
    provider: p.id,
    providerName: p.name,
  }))
)

export const VIDEO_MODELS = Object.values(PROVIDERS).flatMap(p =>
  p.models.filter(m => m.type === 'video').map(m => ({
    ...m,
    provider: p.id,
    providerName: p.name,
  }))
)

export const AUDIO_MODELS = Object.values(PROVIDERS).flatMap(p =>
  p.models.filter(m => m.type === 'audio').map(m => ({
    ...m,
    provider: p.id,
    providerName: p.name,
  }))
)

export const MUSIC_MODELS = Object.values(PROVIDERS).flatMap(p =>
  p.models.filter(m => m.type === 'music').map(m => ({
    ...m,
    provider: p.id,
    providerName: p.name,
  }))
)

export const IMAGE_SIZES = [
  { id: '1024x1024', name: '1024x1024', label: 'Square (1:1)' },
  { id: '1024x1792', name: '1024x1792', label: 'Portrait (2:3)' },
  { id: '1792x1024', name: '1792x1024', label: 'Landscape (3:2)' },
]

export const IMAGE_QUALITIES = [
  { id: 'standard', name: 'standard', label: 'Standard' },
  { id: 'hd', name: 'hd', label: 'HD' },
]

// MiniMax specific aspect ratios
export const IMAGE_ASPECT_RATIOS = [
  { id: '1:1', name: '1:1', label: 'Square (1024x1024)' },
  { id: '16:9', name: '16:9', label: 'Landscape (1280x720)' },
  { id: '4:3', name: '4:3', label: 'Standard (1152x864)' },
  { id: '3:2', name: '3:2', label: 'Classic (1248x832)' },
  { id: '2:3', name: '2:3', label: 'Portrait (832x1248)' },
  { id: '3:4', name: '3:4', label: 'Portrait (864x1152)' },
  { id: '9:16', name: '9:16', label: 'Story (720x1280)' },
  { id: '21:9', name: '21:9', label: 'Cinematic (1344x576)' },
]

// Video durations (for MiniMax)
export const VIDEO_DURATIONS = [
  { id: '6', name: '6', label: '6 seconds' },
  { id: '10', name: '10', label: '10 seconds' },
]

// Helper function to get model-specific params
export function getModelParams(modelId: string): Model['params'] {
  for (const provider of Object.values(PROVIDERS)) {
    const model = provider.models.find(m => m.id === modelId)
    if (model?.params) {
      return model.params
    }
  }
  return undefined
}

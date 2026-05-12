// Generation types
export type GenerationType = 'image' | 'video' | 'audio' | 'music'

// Common generation params
export interface GenerationParams {
  model: string
  prompt: string
  keyId: string
  apiKey: string
  baseUrl?: string
  // Type-specific params
  aspect_ratio?: string
  width?: number
  height?: number
  duration?: number
  n?: number
  response_format?: 'url' | 'base64'
  seed?: number
  prompt_optimizer?: boolean
  aigc_watermark?: boolean
  // Style params
  style_type?: string
  style_weight?: number
  // Audio/Music specific
  voice?: string
  speed?: number
  volume?: number
  pitch?: number
  format?: string
  // Music specific
  lyrics?: string
  instrumental?: boolean
}

// Sync generation result
export interface GenerationResult {
  success: true
  data: {
    urls?: string[]
    base64?: string[]
    taskId?: string
    content?: string
  }
  cost: number
  provider: string
  model: string
}

// Async generation task result
export interface GenerationTaskResult {
  success: true
  taskId: string
  status: 'pending' | 'processing'
  provider: string
  model: string
}

// Error result
export interface GenerationError {
  success: false
  error: string
  code?: string
}

// Base provider interface
export interface GenerationProvider {
  readonly name: string
  readonly supportedTypes: GenerationType[]

  // Check if this provider supports the given type
  supports(type: GenerationType): boolean

  // Check if this provider supports the given model
  supportsModel(model: string): boolean

  // Generate content (can return sync result or task ID for async)
  generate(params: GenerationParams): Promise<GenerationResult | GenerationTaskResult | GenerationError>

  // Get async task status (for async generation)
  getStatus?(taskId: string, params: GenerationParams): Promise<GenerationResult | GenerationError>
}

// Factory function type
export type ProviderFactory = () => GenerationProvider

import type { GenerationProvider, GenerationType } from './base'
import { miniMaxProvider } from './providers/minimax'
import { senseNovaProvider } from './providers/sensenova'

// Registry of all providers
const providers: GenerationProvider[] = [
  miniMaxProvider,
  senseNovaProvider,
]

// Get provider by name
export function getProvider(name: string): GenerationProvider | undefined {
  return providers.find(p => p.name === name)
}

// Get providers that support a specific type
export function getProvidersByType(type: GenerationType): GenerationProvider[] {
  return providers.filter(p => p.supports(type))
}

// Get provider for a specific model
export function getProviderForModel(model: string): GenerationProvider | undefined {
  return providers.find(p => p.supportsModel(model))
}

// Supported generation types
export const GENERATION_TYPES: { type: GenerationType; label: string; icon: string }[] = [
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'video', label: 'Video', icon: '🎬' },
  { type: 'audio', label: 'Audio', icon: '🎙️' },
  { type: 'music', label: 'Music', icon: '🎵' },
]

// Export providers for direct access
export { miniMaxProvider } from './providers/minimax'
export { senseNovaProvider } from './providers/sensenova'
export type { GenerationProvider, GenerationParams, GenerationResult, GenerationError, GenerationTaskResult, GenerationType } from './base'

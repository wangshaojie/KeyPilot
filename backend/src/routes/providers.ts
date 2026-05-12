import { Router } from 'express'

export const providersRouter = Router()

const PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    color: '#10a37f',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', type: 'chat' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', type: 'chat' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', type: 'chat' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', type: 'chat' },
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
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', type: 'chat' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', type: 'chat' },
      { id: 'gemini-pro', name: 'Gemini Pro', type: 'chat' },
    ],
  },
  azure: {
    id: 'azure',
    name: 'Azure OpenAI',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Azure_Services_Icon.svg',
    color: '#0078d4',
    baseUrl: '',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', type: 'chat' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', type: 'chat' },
      { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo', type: 'chat' },
      { id: 'dall-e-3', name: 'DALL-E 3', type: 'image' },
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
}

// GET /api/providers - Get supported providers
providersRouter.get('/', (_, res) => {
  try {
    res.json({ success: true, data: PROVIDERS })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch providers' })
  }
})

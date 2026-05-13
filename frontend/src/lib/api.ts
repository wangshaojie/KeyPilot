import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface APIKey {
  id: string
  provider: string
  name: string
  key: string
  baseUrl?: string
  models?: string[]
  enabled: boolean
  createdAt: string
  lastUsedAt?: string
  usageCount: number
  usageCost: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  model: string
  provider: string
  keyId: string
  timestamp: string
  tokens?: number
  generationType?: string
  isLoading?: boolean
  isError?: boolean
  prompt?: string
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface ImageGeneration {
  id: string
  prompt: string
  model: string
  provider: string
  keyId: string
  imageUrl: string
  createdAt: string
}

export interface VideoGeneration {
  id: string
  prompt: string
  model: string
  provider: string
  keyId: string
  videoUrl: string
  thumbnailUrl?: string
  duration?: number
  createdAt: string
}

export interface AudioGeneration {
  id: string
  text: string
  model: string
  provider: string
  keyId: string
  audioUrl: string
  duration?: number
  createdAt: string
}

export interface MusicGeneration {
  id: string
  prompt: string
  model: string
  provider: string
  keyId: string
  musicUrl: string
  createdAt: string
}

export interface UsageRecord {
  keyId: string
  date: string
  requestCount: number
  tokenCount: number
  cost: number
}

export interface Settings {
  theme: 'dark' | 'light' | 'system'
  baseUrl?: string
  lastSync?: string
}

export interface SpeedTestResult {
  keyId: string
  keyName: string
  provider: string
  status: 'success' | 'error' | 'timeout'
  latency: number
  ttft?: number
  tps?: number
  error?: string
}

export const apiClient = {
  // Keys
  getKeys: () => api.get<ApiResponse<APIKey[]>>('/keys').then(res => res.data),
  addKey: (key: Omit<APIKey, 'id' | 'createdAt' | 'usageCount' | 'usageCost'>) =>
    api.post<ApiResponse<APIKey>>('/keys', key).then(res => res.data),
  updateKey: (id: string, key: Partial<APIKey>) =>
    api.put<ApiResponse<APIKey>>(`/keys/${id}`, key).then(res => res.data),
  deleteKey: (id: string) => api.delete<ApiResponse<void>>(`/keys/${id}`).then(res => res.data),
  testKey: (id: string) => api.post<ApiResponse<SpeedTestResult>>(`/keys/${id}/test`).then(res => res.data),
  testAllKeys: () => api.post<ApiResponse<SpeedTestResult[]>>('/keys/test-all').then(res => res.data),

  // Chat
  sendChat: (payload: { keyId: string; model: string; messages: { role: string; content: string }[] }) =>
    api.post<ApiResponse<{ content: string; tokens?: number; latency?: number }>>('/chat', payload).then(res => res.data),

  // Conversations
  getConversations: () => api.get<ApiResponse<Conversation[]>>('/chat/history').then(res => res.data),
  deleteConversation: (id: string) => api.delete<ApiResponse<void>>(`/chat/history/${id}`).then(res => res.data),

  // Generation
  generateContent: (type: 'image' | 'video' | 'audio' | 'music', payload: { keyId: string; model: string; prompt: string; [key: string]: any }) =>
    api.post<ApiResponse<{ urls?: string[]; base64?: string[]; taskId?: string }>>(`/generation/${type}`, payload).then(res => res.data),
  getGenerationHistory: (type: 'image' | 'video' | 'audio' | 'music') =>
    api.get<ApiResponse<ImageGeneration[] | VideoGeneration[] | AudioGeneration[] | MusicGeneration[]>>(`/generation/history/${type}`).then(res => res.data),
  getGenerationModels: (type: 'image' | 'video' | 'audio' | 'music') =>
    api.get<ApiResponse<any>>(`/generation/models?type=${type}`).then(res => res.data),

  // Usage
  getUsage: () => api.get<ApiResponse<UsageRecord[]>>('/usage').then(res => res.data),

  // Settings
  getSettings: () => api.get<ApiResponse<Settings>>('/settings').then(res => res.data),
  updateSettings: (settings: Partial<Settings>) =>
    api.post<ApiResponse<Settings>>('/settings', settings).then(res => res.data),

  // Providers
  getProviders: () => api.get<ApiResponse<typeof import('./constants').PROVIDERS>>('/providers').then(res => res.data),
}

export default api

import { create } from 'zustand'
import { apiClient } from '@/lib/api'
import type { APIKey, SpeedTestResult } from '@/lib/api'
import { generateId } from '@/lib/utils'

interface KeyState {
  keys: APIKey[]
  loading: boolean
  error: string | null
  testingKeys: Set<string>
  speedTestResults: SpeedTestResult[]

  fetchKeys: () => Promise<void>
  addKey: (key: Omit<APIKey, 'id' | 'createdAt' | 'usageCount' | 'usageCost'>) => Promise<void>
  updateKey: (id: string, updates: Partial<APIKey>) => Promise<void>
  deleteKey: (id: string) => Promise<void>
  testKey: (id: string) => Promise<void>
  testAllKeys: () => Promise<void>
  clearError: () => void
}

export const useKeyStore = create<KeyState>()(
  (set, get) => ({
      keys: [],
      loading: false,
      error: null,
      testingKeys: new Set(),
      speedTestResults: [],

      fetchKeys: async () => {
        set({ loading: true, error: null })
        try {
          const response = await apiClient.getKeys()
          if (response.success && response.data) {
            set({ keys: response.data, loading: false })
          } else {
            set({ error: response.error || 'Failed to fetch keys', loading: false })
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch keys', loading: false })
        }
      },

      addKey: async (keyData) => {
        set({ loading: true, error: null })
        try {
          const newKey: APIKey = {
            id: generateId(),
            ...keyData,
            createdAt: new Date().toISOString(),
            usageCount: 0,
            usageCost: 0,
          }
          const response = await apiClient.addKey(newKey)
          if (response.success && response.data) {
            set((state) => ({ keys: [...state.keys, response.data!], loading: false }))
          } else {
            set({ error: response.error || 'Failed to add key', loading: false })
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add key', loading: false })
        }
      },

      updateKey: async (id, updates) => {
        set({ loading: true, error: null })
        try {
          const response = await apiClient.updateKey(id, updates)
          if (response.success && response.data) {
            set((state) => ({
              keys: state.keys.map((k) => (k.id === id ? response.data! : k)),
              loading: false,
            }))
          } else {
            set({ error: response.error || 'Failed to update key', loading: false })
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update key', loading: false })
        }
      },

      deleteKey: async (id) => {
        set({ loading: true, error: null })
        try {
          const response = await apiClient.deleteKey(id)
          if (response.success) {
            set((state) => ({
              keys: state.keys.filter((k) => k.id !== id),
              loading: false,
            }))
          } else {
            set({ error: response.error || 'Failed to delete key', loading: false })
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete key', loading: false })
        }
      },

      testKey: async (id) => {
        const { testingKeys } = get()
        set({ testingKeys: new Set(testingKeys).add(id) })
        try {
          const response = await apiClient.testKey(id)
          if (response.success && response.data) {
            set((state) => ({
              speedTestResults: [...state.speedTestResults.filter(r => r.keyId !== id), response.data!],
            }))
          }
        } finally {
          set((state) => {
            const newSet = new Set(state.testingKeys)
            newSet.delete(id)
            return { testingKeys: newSet }
          })
        }
      },

      testAllKeys: async () => {
        const { keys } = get()
        const activeKeys = keys.filter((k) => k.enabled)
        set({ testingKeys: new Set(activeKeys.map((k) => k.id)) })
        try {
          const response = await apiClient.testAllKeys()
          if (response.success && response.data) {
            set({ speedTestResults: response.data })
          }
        } finally {
          set({ testingKeys: new Set() })
        }
      },

      clearError: () => set({ error: null }),
    })
)

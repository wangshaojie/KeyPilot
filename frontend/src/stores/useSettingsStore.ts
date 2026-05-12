import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '@/lib/api'
import type { Settings } from '@/lib/api'

interface SettingsState extends Settings {
  loading: boolean
  error: string | null

  fetchSettings: () => Promise<void>
  updateSettings: (updates: Partial<Settings>) => Promise<void>
  setTheme: (theme: 'dark' | 'light' | 'system') => void
  clearError: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      baseUrl: undefined,
      lastSync: undefined,
      loading: false,
      error: null,

      fetchSettings: async () => {
        set({ loading: true, error: null })
        try {
          const response = await apiClient.getSettings()
          if (response.success && response.data) {
            set({ ...response.data, loading: false })
          } else {
            set({ error: response.error || 'Failed to fetch settings', loading: false })
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch settings', loading: false })
        }
      },

      updateSettings: async (updates) => {
        set({ loading: true, error: null })
        try {
          const response = await apiClient.updateSettings(updates)
          if (response.success && response.data) {
            set({ ...response.data, loading: false })
          } else {
            set({ error: response.error || 'Failed to update settings', loading: false })
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update settings', loading: false })
        }
      },

      setTheme: (theme) => {
        set({ theme })
        document.documentElement.classList.remove('light')
        if (theme === 'light') {
          document.documentElement.classList.add('light')
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'keypilot-settings',
      partialize: (state) => ({ theme: state.theme, baseUrl: state.baseUrl }),
    }
  )
)

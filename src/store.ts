import { create } from 'zustand'

interface AppState {
    settings: any
    history: any[]
    bonusResults: any[]
    isMonitoring: boolean
    serverStatus: { online: boolean; latency: number }

    // Actions
    setSettings: (settings: any) => void
    setHistory: (history: any[]) => void
    setBonusResults: (results: any[]) => void
    toggleMonitoring: (enabled: boolean) => void
    updateServerStatus: (status: { online: boolean; latency: number }) => void

    // Async initializers
    fetchSettings: () => Promise<void>
    fetchHistory: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
    settings: {},
    history: [],
    bonusResults: [],
    isMonitoring: true,
    serverStatus: { online: false, latency: 0 },

    setSettings: (settings) => set({ settings }),
    setHistory: (history) => set({ history }),
    setBonusResults: (bonusResults) => set({ bonusResults }),
    toggleMonitoring: (isMonitoring) => set({ isMonitoring }),
    updateServerStatus: (serverStatus) => set({ serverStatus }),

    fetchSettings: async () => {
        const settings = await window.electronAPI.getSettings()
        set({ settings })
    },
    fetchHistory: async () => {
        const history = await window.electronAPI.getCachedData()
        set({ history })
    },
}))

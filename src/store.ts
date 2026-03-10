import { createStore } from 'zustand/vanilla'

declare global {
    interface Window {
        electronAPI: any
    }
}

interface AppState {
    settings: any
    history: any[]
    bonusResults: any[]
    isMonitoring: boolean
    serverStatus: { online: boolean; latency: number }
    tickets: any[]
    priorityDevices: any[]
    doubleCopyEnabled: boolean
    isLoadingHistory: boolean
    isLoadingTickets: boolean
    isLoadingPriority: boolean

    // Setters
    setSettings: (settings: any) => void
    setHistory: (history: any[]) => void
    setBonusResults: (results: any[]) => void
    toggleMonitoring: (enabled: boolean) => void
    updateServerStatus: (status: { online: boolean; latency: number }) => void
    setTickets: (tickets: any[]) => void
    setPriorityDevices: (devices: any[]) => void
    setDoubleCopy: (enabled: boolean) => void

    // Async fetchers
    fetchSettings: () => Promise<void>
    fetchHistory: () => Promise<void>
    fetchTickets: () => Promise<void>
    fetchPriorityDevices: () => Promise<void>
    fetchDoubleCopy: () => Promise<void>
    fetchAll: () => Promise<void>
}

export const appStore = createStore<AppState>((set, get) => ({
    settings: {},
    history: [],
    bonusResults: [],
    isMonitoring: true,
    serverStatus: { online: false, latency: 0 },
    tickets: [],
    priorityDevices: [],
    doubleCopyEnabled: false,
    isLoadingHistory: false,
    isLoadingTickets: false,
    isLoadingPriority: false,

    setSettings: (settings) => set({ settings }),
    setHistory: (history) => set({ history }),
    setBonusResults: (bonusResults) => set({ bonusResults }),
    toggleMonitoring: (isMonitoring) => set({ isMonitoring }),
    updateServerStatus: (serverStatus) => set({ serverStatus }),
    setTickets: (tickets) => set({ tickets }),
    setPriorityDevices: (priorityDevices) => set({ priorityDevices }),
    setDoubleCopy: (doubleCopyEnabled) => set({ doubleCopyEnabled }),

    fetchSettings: async () => {
        try {
            const settings = await window.electronAPI.getSettings()
            set({ settings })
        } catch (e) { console.error('[Store] fetchSettings failed:', e) }
    },

    fetchHistory: async () => {
        set({ isLoadingHistory: true })
        try {
            const history = await window.electronAPI.getCachedData()
            set({ history: history || [] })
        } catch (e) { console.error('[Store] fetchHistory failed:', e) }
        finally { set({ isLoadingHistory: false }) }
    },

    fetchTickets: async () => {
        set({ isLoadingTickets: true })
        try {
            const tickets = await window.electronAPI.getTickets()
            set({ tickets: tickets || [] })
        } catch (e) { console.error('[Store] fetchTickets failed:', e) }
        finally { set({ isLoadingTickets: false }) }
    },

    fetchPriorityDevices: async () => {
        set({ isLoadingPriority: true })
        try {
            const priorityDevices = await window.electronAPI.getPriorityDevices()
            set({ priorityDevices: priorityDevices || [] })
        } catch (e) { console.error('[Store] fetchPriorityDevices failed:', e) }
        finally { set({ isLoadingPriority: false }) }
    },

    fetchDoubleCopy: async () => {
        try {
            const enabled = await window.electronAPI.getDoubleCopy()
            set({ doubleCopyEnabled: enabled })
        } catch (e) { console.error('[Store] fetchDoubleCopy failed:', e) }
    },

    fetchAll: async () => {
        const { fetchSettings, fetchHistory, fetchTickets, fetchPriorityDevices, fetchDoubleCopy } = get()
        await Promise.all([
            fetchSettings(),
            fetchHistory(),
            fetchTickets(),
            fetchPriorityDevices(),
            fetchDoubleCopy()
        ])
    }
}))

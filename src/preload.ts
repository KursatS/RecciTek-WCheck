import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    getPathForFile: (file: File) => webUtils.getPathForFile(file),
    // Main Window Actions
    getCachedData: () => ipcRenderer.invoke('get-cached-data'),
    deleteEntry: (serial: string) => ipcRenderer.invoke('delete-entry', serial),
    clearCache: () => ipcRenderer.invoke('clear-cache'),
    toggleMonitoring: (enabled: boolean) => ipcRenderer.send('toggle-monitoring', enabled),

    // Double Copy
    getDoubleCopy: () => ipcRenderer.invoke('get-double-copy'),
    toggleDoubleCopy: (enabled: boolean) => ipcRenderer.invoke('toggle-double-copy', enabled),

    // Settings & Bonus Windows
    openSettings: () => ipcRenderer.send('open-settings'),
    openBonus: () => ipcRenderer.send('open-bonus'),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
    restartApp: (settings?: any) => ipcRenderer.invoke('restart-app', settings),

    // Bonus Calculation
    calculateBonus: (filePath: string, customHours?: any) => ipcRenderer.invoke('calculate-bonus', filePath, customHours),

    // Popup Specific
    onPopupData: (callback: any) =>
        ipcRenderer.on('popup-data', (_event, info, duration) => callback(info, duration)),
    popupHoverEnter: () => ipcRenderer.send('popup-hover-enter'),
    popupHoverLeave: () => ipcRenderer.send('popup-hover-leave'),
    closeWindow: () => window.close(),

    // Server Status
    manualServerStatusRefresh: () => ipcRenderer.send('manual-server-status-refresh'),

    // Event Listeners
    onServerStatusUpdate: (callback: any) =>
        ipcRenderer.on('server-status-update', (_event, value) => callback(value)),
    onServerStatus: (callback: any) =>
        ipcRenderer.on('server-status-update', (_event, value) => callback(value)),
    onRefreshCards: (callback: any) =>
        ipcRenderer.on('refresh-cards', () => callback()),
    onCacheCleared: (callback: any) =>
        ipcRenderer.on('cache-cleared', () => callback()),
    onMonitoringToggled: (callback: any) =>
        ipcRenderer.on('monitoring-toggled', (_event, enabled) => callback(enabled)),

    // Ticket System
    getTickets: () => ipcRenderer.invoke('get-tickets'),
    createTicket: (data: any) => ipcRenderer.invoke('create-ticket', data),
    claimTicket: (id: string, name: string) => ipcRenderer.invoke('claim-ticket', id, name),
    completeTicket: (id: string, response: string) => ipcRenderer.invoke('complete-ticket', id, response),
    updateTicketDetails: (id: string, details: any) => ipcRenderer.invoke('update-ticket-details', id, details),
    onTicketUpdate: (callback: any) =>
        ipcRenderer.on('ticket-update', (_event, tickets) => callback(tickets)),

    // Tickets Window
    openTickets: () => ipcRenderer.send('open-tickets')
})

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

    // Settings, Admin, Profile, Bonus Windows
    openSettings: () => ipcRenderer.send('open-settings'),
    openBonus: () => ipcRenderer.send('open-bonus'),
    openAdmin: () => ipcRenderer.send('open-admin'),
    openProfile: () => ipcRenderer.send('open-profile'),
    loginSuccess: () => ipcRenderer.invoke('login-success'),
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
    closeWindow: () => ipcRenderer.send('close-window'),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),

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
    reopenTicket: (id: string) => ipcRenderer.invoke('reopen-ticket', id),
    updateTicketDetails: (id: string, details: any) => ipcRenderer.invoke('update-ticket-details', id, details),
    onTicketUpdate: (callback: any) =>
        ipcRenderer.on('ticket-update', (_event, tickets) => callback(tickets)),

    // Tickets Window
    openTickets: () => ipcRenderer.send('open-tickets'),

    // Priority Devices
    getPriorityDevices: () => ipcRenderer.invoke('get-priority-devices'),
    addPriorityDevice: (data: any) => ipcRenderer.invoke('add-priority-device', data),
    deletePriorityDevice: (id: string) => ipcRenderer.invoke('delete-priority-device', id),
    onPriorityDeviceMatch: (callback: any) =>
        ipcRenderer.on('priority-device-match', (_event, device) => callback(device)),
    onPriorityDevicesUpdate: (callback: any) =>
        ipcRenderer.on('priority-devices-update', (_event, devices) => callback(devices))
})

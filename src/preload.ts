import { contextBridge, ipcRenderer, webUtils } from 'electron'

const safeInvoke = async (channel: string, ...args: any[]) => {
    try {
        return await ipcRenderer.invoke(channel, ...args)
    } catch (error: any) {
        console.error(`[IPC Error] Channel '${channel}':`, error)
        throw error
    }
}

contextBridge.exposeInMainWorld('electronAPI', {
    getPathForFile: (file: File) => webUtils.getPathForFile(file),
    // Main Window Actions
    getCachedData: () => safeInvoke('get-cached-data'),
    deleteEntry: (serial: string) => safeInvoke('delete-entry', serial),
    clearCache: () => safeInvoke('clear-cache'),
    toggleMonitoring: (enabled: boolean) => ipcRenderer.send('toggle-monitoring', enabled),

    // Double Copy
    getDoubleCopy: () => safeInvoke('get-double-copy'),
    toggleDoubleCopy: (enabled: boolean) => safeInvoke('toggle-double-copy', enabled),

    // Settings, Admin, Profile, Bonus Windows
    openSettings: () => ipcRenderer.send('open-settings'),
    openBonus: () => ipcRenderer.send('open-bonus'),
    openAdmin: () => ipcRenderer.send('open-admin'),
    openProfile: () => ipcRenderer.send('open-profile'),
    getUsers: () => safeInvoke('get-users'),
    loginSuccess: () => safeInvoke('login-success'),
    getSettings: () => safeInvoke('get-settings'),
    saveSettings: (settings: any) => safeInvoke('save-settings', settings),
    restartApp: (settings?: any) => safeInvoke('restart-app', settings),

    // Bonus Calculation
    calculateBonus: (filePath: string, customHours?: any) => safeInvoke('calculate-bonus', filePath, customHours),

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
    onSwitchView: (callback: any) =>
        ipcRenderer.on('switch-view', (_event, view) => callback(view)),

    // Ticket System
    getTickets: () => safeInvoke('get-tickets'),
    createTicket: (data: any) => safeInvoke('create-ticket', data),
    claimTicket: (id: string, name: string) => safeInvoke('claim-ticket', id, name),
    completeTicket: (id: string, response: string) => safeInvoke('complete-ticket', id, response),
    reopenTicket: (id: string) => safeInvoke('reopen-ticket', id),
    updateTicketDetails: (id: string, details: any) => safeInvoke('update-ticket-details', id, details),
    onTicketUpdate: (callback: any) =>
        ipcRenderer.on('ticket-update', (_event, tickets) => callback(tickets)),

    // Tickets & Priority Windows
    openTickets: () => ipcRenderer.send('open-tickets'),
    openPriority: () => ipcRenderer.send('open-priority'),

    // Priority Devices
    getPriorityDevices: () => safeInvoke('get-priority-devices'),
    addPriorityDevice: (data: any) => safeInvoke('add-priority-device', data),
    deletePriorityDevice: (id: string) => safeInvoke('delete-priority-device', id),
    onPriorityDeviceMatch: (callback: any) =>
        ipcRenderer.on('priority-device-match', (_event, device) => callback(device)),
    onPriorityDevicesUpdate: (callback: any) =>
        ipcRenderer.on('priority-devices-update', (_event, devices) => callback(devices)),

    // Admin CRUD
    createUser: (data: any) => safeInvoke('create-user', data),
    updateUser: (id: string, data: any) => safeInvoke('update-user', id, data),
    deleteUser: (id: string) => safeInvoke('delete-user', id),
    resetUserXp: (id: string) => safeInvoke('reset-user-xp', id)
})

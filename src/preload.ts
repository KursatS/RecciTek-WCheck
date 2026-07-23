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
    logout: () => safeInvoke('logout'),
    showLoginWindow: () => ipcRenderer.send('show-login-window'),

    // Bonus Calculation
    calculateBonus: (fileData: ArrayBuffer | string, customHours?: any) => safeInvoke('calculate-bonus', fileData, customHours),
    calculateZReport: (fileData: ArrayBuffer | string) => safeInvoke('calculate-zreport', fileData),

    // Popup Specific
    onPopupData: (callback: any) =>
        ipcRenderer.on('popup-data', (_event, info, duration) => callback(info, duration)),
    popupHoverEnter: () => ipcRenderer.send('popup-hover-enter'),
    popupHoverLeave: () => ipcRenderer.send('popup-hover-leave'),
    openMainView: (view: string) => ipcRenderer.send('open-main-view', view),
    openPriorityDevice: (device: any) => ipcRenderer.send('open-priority-device', device),
    closeWindow: () => ipcRenderer.send('close-window'),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),

    // Server Status
    manualServerStatusRefresh: () => ipcRenderer.send('manual-server-status-refresh'),

    // Event Listeners
    onServerStatusUpdate: (callback: any) =>
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
    reopenTicket: (id: string, name: string) => safeInvoke('reopen-ticket', id, name),
    hideTicket: (id: string, personnelName: string) => safeInvoke('hide-ticket', id, personnelName),
    unhideTicket: (id: string) => safeInvoke('unhide-ticket', id),
    deleteTicket: (id: string) => safeInvoke('delete-ticket', id),
    updateTicketDetails: (id: string, details: any) => safeInvoke('update-ticket-details', id, details),
    markTicketUnreachable: (id: string, name: string) => safeInvoke('mark-ticket-unreachable', id, name),
    onTicketUpdate: (callback: any) =>
        ipcRenderer.on('ticket-update', (_event, tickets) => callback(tickets)),

    // Tickets & Priority Windows
    openTickets: () => ipcRenderer.send('open-tickets'),
    openPriority: () => ipcRenderer.send('open-priority'),

    // Priority Devices
    getPriorityDevices: () => safeInvoke('get-priority-devices'),
    addPriorityDevice: (data: any) => safeInvoke('add-priority-device', data),
    updatePriorityDevice: (id: string, data: any) => safeInvoke('update-priority-device', id, data),
    deletePriorityDevice: (id: string) => safeInvoke('delete-priority-device', id),
    onPriorityDeviceMatch: (callback: any) =>
        ipcRenderer.on('priority-device-match', (_event, device) => callback(device)),
    onFocusPriorityDevice: (callback: any) =>
        ipcRenderer.on('focus-priority-device', (_event, device) => callback(device)),
    onPriorityDevicesUpdate: (callback: any) =>
        ipcRenderer.on('priority-devices-update', (_event, devices) => callback(devices)),

    // Device Calls
    createDeviceCall: (data: any) => safeInvoke('create-device-call', data),
    resolveDeviceCall: (id: string, resolved_by: string) => safeInvoke('resolve-device-call', id, resolved_by),
    onDeviceCallsUpdate: (callback: any) =>
        ipcRenderer.on('device-calls-update', (_event, calls) => callback(calls)),

    // Device Call Toast window channels
    onDeviceCallToastData: (callback: any) =>
        ipcRenderer.on('device-call-toast-data', (_event, data) => callback(data)),
    onDeviceCallToastResolve: (callback: any) =>
        ipcRenderer.on('device-call-toast-resolve', (_event, data) => callback(data)),
    deviceCallAction: (payload: any) => ipcRenderer.send('device-call-action', payload),

    // Admin CRUD
    createUser: (data: any) => safeInvoke('create-user', data),
    updateUser: (id: string, data: any) => safeInvoke('update-user', id, data),
    deleteUser: (id: string) => safeInvoke('delete-user', id),
    resetUserXp: (id: string) => safeInvoke('reset-user-xp', id),

    // Auto-Updater
    checkForUpdates: () => safeInvoke('check-for-updates'),
    onUpdateAvailable: (callback: any) =>
        ipcRenderer.on('update-available', (_event, version) => callback(version)),
    onUpdateNotAvailable: (callback: any) =>
        ipcRenderer.on('update-not-available', () => callback()),
    onUpdateError: (callback: any) =>
        ipcRenderer.on('update-error', (_event, error) => callback(error)),
    onUpdateProgress: (callback: any) =>
        ipcRenderer.on('update-progress', (_event, percent) => callback(percent)),
    onUpdateDownloaded: (callback: any) =>
        ipcRenderer.on('update-downloaded', () => callback()),
    startUpdateDownload: () => ipcRenderer.send('start-update-download'),
    installUpdate: () => ipcRenderer.send('install-update')
})

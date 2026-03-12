"use strict";
const electron = require("electron");
const safeInvoke = async (channel, ...args) => {
  try {
    return await electron.ipcRenderer.invoke(channel, ...args);
  } catch (error) {
    console.error(`[IPC Error] Channel '${channel}':`, error);
    throw error;
  }
};
electron.contextBridge.exposeInMainWorld("electronAPI", {
  getPathForFile: (file) => electron.webUtils.getPathForFile(file),
  // Main Window Actions
  getCachedData: () => safeInvoke("get-cached-data"),
  deleteEntry: (serial) => safeInvoke("delete-entry", serial),
  clearCache: () => safeInvoke("clear-cache"),
  toggleMonitoring: (enabled) => electron.ipcRenderer.send("toggle-monitoring", enabled),
  // Double Copy
  getDoubleCopy: () => safeInvoke("get-double-copy"),
  toggleDoubleCopy: (enabled) => safeInvoke("toggle-double-copy", enabled),
  // Settings, Admin, Profile, Bonus Windows
  openSettings: () => electron.ipcRenderer.send("open-settings"),
  openBonus: () => electron.ipcRenderer.send("open-bonus"),
  openAdmin: () => electron.ipcRenderer.send("open-admin"),
  openProfile: () => electron.ipcRenderer.send("open-profile"),
  getUsers: () => safeInvoke("get-users"),
  loginSuccess: () => safeInvoke("login-success"),
  getSettings: () => safeInvoke("get-settings"),
  saveSettings: (settings) => safeInvoke("save-settings", settings),
  restartApp: (settings) => safeInvoke("restart-app", settings),
  // Bonus Calculation
  calculateBonus: (fileData, customHours) => safeInvoke("calculate-bonus", fileData, customHours),
  // Popup Specific
  onPopupData: (callback) => electron.ipcRenderer.on("popup-data", (_event, info, duration) => callback(info, duration)),
  popupHoverEnter: () => electron.ipcRenderer.send("popup-hover-enter"),
  popupHoverLeave: () => electron.ipcRenderer.send("popup-hover-leave"),
  closeWindow: () => electron.ipcRenderer.send("close-window"),
  minimizeWindow: () => electron.ipcRenderer.send("minimize-window"),
  // Server Status
  manualServerStatusRefresh: () => electron.ipcRenderer.send("manual-server-status-refresh"),
  // Event Listeners
  onServerStatusUpdate: (callback) => electron.ipcRenderer.on("server-status-update", (_event, value) => callback(value)),
  onServerStatus: (callback) => electron.ipcRenderer.on("server-status-update", (_event, value) => callback(value)),
  onRefreshCards: (callback) => electron.ipcRenderer.on("refresh-cards", () => callback()),
  onCacheCleared: (callback) => electron.ipcRenderer.on("cache-cleared", () => callback()),
  onMonitoringToggled: (callback) => electron.ipcRenderer.on("monitoring-toggled", (_event, enabled) => callback(enabled)),
  onSwitchView: (callback) => electron.ipcRenderer.on("switch-view", (_event, view) => callback(view)),
  // Ticket System
  getTickets: () => safeInvoke("get-tickets"),
  createTicket: (data) => safeInvoke("create-ticket", data),
  claimTicket: (id, name) => safeInvoke("claim-ticket", id, name),
  completeTicket: (id, response) => safeInvoke("complete-ticket", id, response),
  reopenTicket: (id) => safeInvoke("reopen-ticket", id),
  updateTicketDetails: (id, details) => safeInvoke("update-ticket-details", id, details),
  onTicketUpdate: (callback) => electron.ipcRenderer.on("ticket-update", (_event, tickets) => callback(tickets)),
  // Tickets & Priority Windows
  openTickets: () => electron.ipcRenderer.send("open-tickets"),
  openPriority: () => electron.ipcRenderer.send("open-priority"),
  // Priority Devices
  getPriorityDevices: () => safeInvoke("get-priority-devices"),
  addPriorityDevice: (data) => safeInvoke("add-priority-device", data),
  deletePriorityDevice: (id) => safeInvoke("delete-priority-device", id),
  onPriorityDeviceMatch: (callback) => electron.ipcRenderer.on("priority-device-match", (_event, device) => callback(device)),
  onPriorityDevicesUpdate: (callback) => electron.ipcRenderer.on("priority-devices-update", (_event, devices) => callback(devices)),
  // Admin CRUD
  createUser: (data) => safeInvoke("create-user", data),
  updateUser: (id, data) => safeInvoke("update-user", id, data),
  deleteUser: (id) => safeInvoke("delete-user", id),
  resetUserXp: (id) => safeInvoke("reset-user-xp", id),
  // Auto-Updater
  onUpdateAvailable: (callback) => electron.ipcRenderer.on("update-available", (_event, version) => callback(version)),
  onUpdateProgress: (callback) => electron.ipcRenderer.on("update-progress", (_event, percent) => callback(percent)),
  onUpdateDownloaded: (callback) => electron.ipcRenderer.on("update-downloaded", () => callback()),
  startUpdateDownload: () => electron.ipcRenderer.send("start-update-download"),
  installUpdate: () => electron.ipcRenderer.send("install-update")
});

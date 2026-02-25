"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Main Window Actions
  getCachedData: () => electron.ipcRenderer.invoke("get-cached-data"),
  deleteEntry: (serial) => electron.ipcRenderer.invoke("delete-entry", serial),
  clearCache: () => electron.ipcRenderer.invoke("clear-cache"),
  toggleMonitoring: (enabled) => electron.ipcRenderer.send("toggle-monitoring", enabled),
  // Double Copy
  getDoubleCopy: () => electron.ipcRenderer.invoke("get-double-copy"),
  toggleDoubleCopy: (enabled) => electron.ipcRenderer.invoke("toggle-double-copy", enabled),
  // Settings & Bonus Windows
  openSettings: () => electron.ipcRenderer.send("open-settings"),
  openBonus: () => electron.ipcRenderer.send("open-bonus"),
  getSettings: () => electron.ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => electron.ipcRenderer.invoke("save-settings", settings),
  // Bonus Calculation
  calculateBonus: (filePath) => electron.ipcRenderer.invoke("calculate-bonus", filePath),
  // Popup Specific
  onPopupData: (callback) => electron.ipcRenderer.on("popup-data", (_event, info, duration) => callback(info, duration)),
  popupHoverEnter: () => electron.ipcRenderer.send("popup-hover-enter"),
  popupHoverLeave: () => electron.ipcRenderer.send("popup-hover-leave"),
  closeWindow: () => window.close(),
  // Server Status
  manualServerStatusRefresh: () => electron.ipcRenderer.send("manual-server-status-refresh"),
  // Event Listeners
  onServerStatusUpdate: (callback) => electron.ipcRenderer.on("server-status-update", (_event, value) => callback(value)),
  onServerStatus: (callback) => electron.ipcRenderer.on("server-status-update", (_event, value) => callback(value)),
  onRefreshCards: (callback) => electron.ipcRenderer.on("refresh-cards", () => callback()),
  onCacheCleared: (callback) => electron.ipcRenderer.on("cache-cleared", () => callback()),
  onMonitoringToggled: (callback) => electron.ipcRenderer.on("monitoring-toggled", (_event, enabled) => callback(enabled)),
  // Ticket System
  getTickets: () => electron.ipcRenderer.invoke("get-tickets"),
  createTicket: (data) => electron.ipcRenderer.invoke("create-ticket", data),
  claimTicket: (id, name) => electron.ipcRenderer.invoke("claim-ticket", id, name),
  completeTicket: (id, response) => electron.ipcRenderer.invoke("complete-ticket", id, response),
  updateTicketDetails: (id, details) => electron.ipcRenderer.invoke("update-ticket-details", id, details),
  onTicketUpdate: (callback) => electron.ipcRenderer.on("ticket-update", (_event, tickets) => callback(tickets)),
  // Tickets Window
  openTickets: () => electron.ipcRenderer.send("open-tickets")
});

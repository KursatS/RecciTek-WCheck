import {
  app,
  Tray,
  Menu,
  ipcMain,
  nativeImage,
  clipboard,
  globalShortcut,
  net,
  dialog,
  Notification,
  BrowserWindow
} from 'electron';
import * as path from 'path';
import { is } from '@electron-toolkit/utils';
import { checkWarranty } from './warrantyChecker';
import {
  getCachedData,
  saveToCache,
  loadCache,
  initCache,
  clearCache,
  deleteEntry
} from './cacheManager';
import { WindowManager } from './windowManager';
import { loadSettings, saveSettings, AppSettings } from './settingsManager';
import { ClipboardMonitor } from './clipboardMonitor';
import { parseBonusData } from './bonusCalculator';
import { createTicket, claimTicket, completeTicket, reopenTicket, subscribeAsKargoKabul, subscribeAsMH, updateTicketDetails, addPriorityDevice, deletePriorityDevice, subscribeToPriorityDevices, getUsers, createUser, updateUser, deleteUser, resetUserXp } from './ticketService';
import type { Unsubscribe } from 'firebase/firestore';
import * as fs from 'fs';
import { autoUpdater } from 'electron-updater';

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
} else {
  app.on('second-instance', () => {
    const mainWindow = windowManager?.getMainWindow();
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'RecciTek WCheck',
        message: 'Uygulama zaten çalışıyor.',
        detail: 'Lütfen sistem tepsisindeki (tray) simgeyi kontrol edin.',
        buttons: ['Tamam']
      });
    }
  });
}

let windowManager: WindowManager;
let clipboardMonitor: ClipboardMonitor;
let tray: Tray | null = null;
let currentSettings: AppSettings;
let monitoringEnabled = true;
let currentPopupData: any = null;
let lastDetectedSerial: string = '';
let statusInterval: NodeJS.Timeout | null = null;
let ticketUnsubscribe: Unsubscribe | null = null;
let priorityUnsubscribe: Unsubscribe | null = null;
let cachedTickets: any[] = [];
let cachedPriorityDevices: any[] = [];

function extractCopyText(data: any): string {
  if (!data) return '';
  if (data.warranty_status === 'KVK GARANTILI' && data.warranty_end) {
    return `GÜVENCE BİTİŞ TARİHİ : ${data.warranty_end}`;
  }
  if (data.warranty_status === 'RECCI GARANTILI' &&
    data.model_name && data.model_name !== 'MODEL BULUNAMADI' &&
    data.model_color && data.model_color !== 'RENK BULUNAMADI') {
    return `${data.model_name} - ${data.model_color}`;
  }
  return '';
}

async function checkServerStatus(): Promise<void> {
  const start = Date.now();
  try {
    const request = net.request({
      method: 'HEAD',
      url: 'https://garantibelgesi.recciteknoloji.com/',
      redirect: 'follow'
    });

    request.on('response', (response) => {
      const latency = Date.now() - start;
      const isOnline = response.statusCode === 200;
      windowManager.getMainWindow()?.webContents.send('server-status-update', {
        online: isOnline,
        latency: latency
      });
    });

    request.on('error', () => {
      windowManager.getMainWindow()?.webContents.send('server-status-update', {
        online: false,
        latency: 0
      });
    });

    request.end();
  } catch {
    windowManager.getMainWindow()?.webContents.send('server-status-update', {
      online: false,
      latency: 0
    });
  }
}

function startServerStatusMonitor() {
  if (statusInterval) clearInterval(statusInterval);
  setTimeout(checkServerStatus, 5000);
  const baseInterval = 5 * 60000;
  const scheduleNext = () => {
    const jitter = Math.floor(Math.random() * 120000);
    statusInterval = setTimeout(() => {
      checkServerStatus();
      scheduleNext();
    }, baseInterval + jitter);
  };
  scheduleNext();
}

function handleDoubleCopy(): void {
  if (!windowManager.isPopupVisible() || !currentPopupData) return;
  const textToCopy = extractCopyText(currentPopupData);
  if (textToCopy) {
    clipboard.writeText(textToCopy);
    windowManager.closePopup();
  }
}

// Helper functions for handleDetection to reduce complexity
function shouldSkipDetection(serial: string): boolean {
  if (!currentSettings.isLoggedIn) return true;
  if (currentSettings.preventDuplicatePopup && serial === lastDetectedSerial) return true;
  return false;
}

async function processWarrantyRequest(serial: string) {
  const cached = await getCachedData(serial);
  if (cached) return cached;

  const warrantyInfo = await checkWarranty(serial);
  await saveToCache(serial, warrantyInfo);
  return warrantyInfo;
}

async function handleDetection(serial: string): Promise<void> {
  if (shouldSkipDetection(serial)) return;
  lastDetectedSerial = serial;

  try {
    const data = await processWarrantyRequest(serial);
    currentPopupData = data;
    windowManager.showPopup(data, currentSettings.popupTimeout, currentSettings.popupSizeLevel);
    windowManager.getMainWindow()?.webContents.send('refresh-cards');
    checkPriorityMatch(serial);
  } catch (error) {
    windowManager.showPopup({
      serial,
      warranty_status: 'İnternet Bağlantı Hatası',
      is_error: true
    }, currentSettings.popupTimeout, currentSettings.popupSizeLevel);
  }
}

function checkPriorityMatch(serial: string): void {
  if (!serial) return;
  const match = cachedPriorityDevices.find(
    (d: any) => d.serial && d.serial.toUpperCase() === serial.toUpperCase()
  );
  if (match) {
    new Notification({
      title: '⚠️ Öncelikli Cihaz!',
      body: `${match.customer_name}: ${match.description}`,
      silent: false
    }).show();
    windowManager.getMainWindow()?.webContents.send('priority-device-match', match);
  }
}

function setupIpcHandlers() {
  ipcMain.handle('get-cached-data', async () => await loadCache());
  ipcMain.handle('get-double-copy', async () => currentSettings.doubleCopyEnabled);

  ipcMain.handle('get-settings', async () => ({
    popupTimeout: currentSettings.popupTimeout,
    popupSizeLevel: currentSettings.popupSizeLevel,
    doubleCopyEnabled: currentSettings.doubleCopyEnabled,
    autoStartEnabled: currentSettings.autoStartEnabled,
    preventDuplicatePopup: currentSettings.preventDuplicatePopup,
    shortcuts: currentSettings.shortcuts,
    role: currentSettings.role,
    personnelName: currentSettings.personnelName,
    username: currentSettings.username,
    isAdmin: currentSettings.isAdmin,
    isLoggedIn: currentSettings.isLoggedIn,
    theme: currentSettings.theme,
    workingHours: currentSettings.workingHours,
    rememberMe: currentSettings.rememberMe,
    savedUsername: currentSettings.savedUsername,
    savedPassword: currentSettings.savedPassword
  }));

  ipcMain.handle('save-settings', async (_, settings) => {
    currentSettings = { ...currentSettings, ...settings };
    saveSettings(currentSettings);
    registerShortcuts();
    startTicketListener(); // Restart listener if role changed

    app.setLoginItemSettings({
      openAtLogin: currentSettings.autoStartEnabled,
      path: app.getPath('exe')
    });
    return true;
  });

  ipcMain.handle('restart-app', async (_, settings) => {
    if (settings) {
      currentSettings = { ...currentSettings, ...settings };
      saveSettings(currentSettings);
    }
    app.relaunch();
    app.exit(0);
  });

  ipcMain.on('toggle-monitoring', (_, enabled) => {
    monitoringEnabled = enabled;
    clipboardMonitor.setEnabled(enabled);
    windowManager.getMainWindow()?.webContents.send('monitoring-toggled', monitoringEnabled);
  });

  ipcMain.on('open-settings', () => {
    windowManager.getMainWindow()?.webContents.send('switch-view', 'settings');
    windowManager.getMainWindow()?.show();
  });
  ipcMain.on('open-bonus', () => {
    windowManager.getMainWindow()?.webContents.send('switch-view', 'bonus');
    windowManager.getMainWindow()?.show();
  });
  ipcMain.on('open-admin', () => {
    windowManager.getMainWindow()?.webContents.send('switch-view', 'admin');
    windowManager.getMainWindow()?.show();
  });
  ipcMain.on('open-profile', () => {
    windowManager.getMainWindow()?.webContents.send('switch-view', 'profile');
    windowManager.getMainWindow()?.show();
  });
  ipcMain.on('open-priority', () => {
    windowManager.getMainWindow()?.webContents.send('switch-view', 'priority');
    windowManager.getMainWindow()?.show();
  });
  ipcMain.on('open-tickets', () => {
    windowManager.getMainWindow()?.webContents.send('switch-view', 'tickets');
    windowManager.getMainWindow()?.show();
  });

  ipcMain.handle('login-success', async () => {
    windowManager.onLoginSuccess();
    return true;
  });

  ipcMain.on('minimize-window', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    win?.minimize();
  });

  ipcMain.on('close-window', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    win?.close();
  });

  ipcMain.handle('calculate-bonus', async (_, fileData, customHours) => {
    try {
      const settings = loadSettings();
      let buffer: Buffer;
      if (typeof fileData === 'string') {
        buffer = fs.readFileSync(fileData);
      } else {
        buffer = Buffer.from(fileData);
      }
      const workingHours = customHours || settings.workingHours || { start: '08:00', end: '18:30' };
      return parseBonusData(buffer, workingHours);
    } catch (error) {
      console.error('Bonus calculation error:', error);
      throw error;
    }
  });

  ipcMain.handle('toggle-double-copy', async (_, enabled) => {
    currentSettings.doubleCopyEnabled = enabled;
    saveSettings(currentSettings);
    return enabled;
  });

  ipcMain.handle('save-note', async () => { });
  ipcMain.handle('get-note', async () => null);

  ipcMain.on('popup-hover-enter', () => {
    windowManager.pausePopupTimeout();
  });

  ipcMain.on('popup-hover-leave', () => {
    windowManager.resumePopupTimeout();
  });

  ipcMain.handle('clear-cache', async () => {
    await clearCache();
    return await loadCache();
  });

  ipcMain.on('manual-server-status-refresh', () => {
    checkServerStatus();
  });

  ipcMain.handle('delete-entry', async (_, s) => {
    await deleteEntry(s);
    return await loadCache();
  });

  ipcMain.handle('get-users', async () => {
    try {
      return await getUsers();
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  });

  ipcMain.handle('create-user', async (_, data) => {
    try {
      const id = await createUser(data);
      return { success: true, id };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('update-user', async (_, id, data) => {
    try {
      await updateUser(id, data);
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('delete-user', async (_, id) => {
    try {
      await deleteUser(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('reset-user-xp', async (_, id) => {
    try {
      await resetUserXp(id);
      return { success: true };
    } catch (error) {
      console.error('Error resetting XP:', error);
      return { success: false, error: String(error) };
    }
  });

  // ── Ticket System IPC ─────────────────────────────────────────────
  ipcMain.handle('get-tickets', async () => cachedTickets);

  ipcMain.handle('create-ticket', async (_, data) => {
    try {
      const id = await createTicket(data);
      return { success: true, id };
    } catch (error) {
      console.error('Error creating ticket:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('claim-ticket', async (_, id, name) => {
    try {
      await claimTicket(id, name);
      return { success: true };
    } catch (error) {
      console.error('Error claiming ticket:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('complete-ticket', async (_, id, response) => {
    try {
      await completeTicket(id, response);
      return { success: true };
    } catch (error) {
      console.error('Error completing ticket:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('reopen-ticket', async (_, id) => {
    try {
      await reopenTicket(id);
      return { success: true };
    } catch (error) {
      console.error('Error reopening ticket:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('update-ticket-details', async (_, id, details) => {
    try {
      await updateTicketDetails(id, details);
      return { success: true };
    } catch (error) {
      console.error('Error updating ticket details:', error);
      return { success: false, error: String(error) };
    }
  });



  // ── Priority Devices IPC ──────────────────────────────────────────
  ipcMain.handle('get-priority-devices', async () => cachedPriorityDevices);

  ipcMain.handle('add-priority-device', async (_, data) => {
    try {
      const id = await addPriorityDevice(data);
      return { success: true, id };
    } catch (error) {
      console.error('Error adding priority device:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('delete-priority-device', async (_, id) => {
    try {
      await deletePriorityDevice(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting priority device:', error);
      return { success: false, error: String(error) };
    }
  });
}

// Helper to create the system tray
function createTray() {
  const mainWindow = windowManager.getMainWindow();

  // Robust icon path for both dev and prod
  let iconPath = path.join(__dirname, '../../assets/logo.png');

  if (!fs.existsSync(iconPath)) {
    // Fallback for some packaging structures
    iconPath = path.join(process.resourcesPath, 'assets/logo.png');
  }

  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon);
  tray.setToolTip('RecciTek WCheck');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Çıkış', click: () => windowManager.forceQuit() }
  ]));

  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

// Helper to register global shortcuts
function registerShortcuts() {
  globalShortcut.unregisterAll(); // Unregister all existing shortcuts

  // Always register the double copy shortcut if enabled
  if (currentSettings.doubleCopyEnabled) {
    try {
      globalShortcut.register('CommandOrControl+Shift+C', () => {
        handleDoubleCopy();
      });
    } catch (e) {
      console.error('Failed to register double copy shortcut:', e);
    }
  }

  if (currentSettings.shortcuts) {
    // Clear Cache Shortcut
    if (currentSettings.shortcuts.clearCache) {
      try {
        globalShortcut.register(currentSettings.shortcuts.clearCache, async () => {
          await clearCache();
          const win = windowManager.getMainWindow();
          if (win) {
            win.webContents.send('cache-cleared');
          }
        });
      } catch (e) {
        console.error('Failed to register clearCache shortcut:', e);
      }
    }

    // Toggle Monitoring Shortcut
    if (currentSettings.shortcuts.toggleMonitoring) {
      try {
        globalShortcut.register(currentSettings.shortcuts.toggleMonitoring, () => {
          monitoringEnabled = !monitoringEnabled;
          clipboardMonitor.setEnabled(monitoringEnabled);
          const win = windowManager.getMainWindow();
          if (win) {
            win.webContents.send('monitoring-toggled', monitoringEnabled);
          }
        });
      } catch (e) {
        console.error('Failed to register toggleMonitoring shortcut:', e);
      }
    }
  }
}

function startPriorityDevicesListener() {
  if (priorityUnsubscribe) {
    priorityUnsubscribe();
    priorityUnsubscribe = null;
  }
  priorityUnsubscribe = subscribeToPriorityDevices((devices: any[]) => {
    cachedPriorityDevices = devices;
    // Broadcast update to all windows
    const { BrowserWindow } = require('electron');
    BrowserWindow.getAllWindows().forEach((win: any) => {
      if (!win.isDestroyed()) {
        win.webContents.send('priority-devices-update', devices);
      }
    });
  });
}

function startTicketListener() {
  // Unsubscribe from previous listener if exists
  if (ticketUnsubscribe) {
    ticketUnsubscribe();
    ticketUnsubscribe = null;
  }

  const broadcastTickets = (tickets: any[]) => {
    // ── Silent Desktop Notifications ──
    if (cachedTickets.length > 0) {
      const oldMap = new Map(cachedTickets.map((t: any) => [t.id, t]));

      tickets.forEach((ticket: any) => {
        const old = oldMap.get(ticket.id);

        if (!old && ticket.status === 'pending' && currentSettings.role === 'mh') {
          // New ticket → notify MH
          new Notification({
            title: 'Yeni Talep',
            body: `${ticket.serial || 'Bilinmeyen'} için yeni bilgi talebi`,
            silent: true
          }).show();
        } else if (old && old.status !== ticket.status) {
          if (ticket.status === 'in_progress' && currentSettings.role === 'kargo_kabul') {
            new Notification({
              title: 'Talep Üstlenildi',
              body: `${ticket.serial || 'Bilinmeyen'} talebiniz üstlenildi`,
              silent: true
            }).show();
          } else if (ticket.status === 'completed' && currentSettings.role === 'kargo_kabul') {
            new Notification({
              title: 'Talep Tamamlandı',
              body: `${ticket.serial || 'Bilinmeyen'} talebiniz tamamlandı`,
              silent: true
            }).show();
          }
        }
      });
    }

    cachedTickets = tickets;
    // Send to all open windows
    const mainWin = windowManager.getMainWindow();
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.webContents.send('ticket-update', tickets);
    }
    // Also broadcast to any BrowserWindow that might be tickets panel
    const { BrowserWindow } = require('electron');
    BrowserWindow.getAllWindows().forEach((win: any) => {
      if (!win.isDestroyed()) {
        win.webContents.send('ticket-update', tickets);
      }
    });
  };

  if (currentSettings.role === 'mh') {
    ticketUnsubscribe = subscribeAsMH(broadcastTickets);
  } else {
    const name = (currentSettings.personnelName || 'İsimsiz Personel').replace(/\s/g, '').toUpperCase();
    ticketUnsubscribe = subscribeAsKargoKabul(name, broadcastTickets);
  }
}

function initializeApp() {
  currentSettings = loadSettings();
  windowManager = new WindowManager(__dirname);
  clipboardMonitor = new ClipboardMonitor(handleDetection);
  registerShortcuts();
  monitoringEnabled = true;

  const splash = windowManager.createSplashWindow();

  setTimeout(() => {
    try {
      splash.close();
    } catch { }

    // Instead of showing the main window directly, create it hidden and show the login window
    windowManager.createMainWindow(); // It starts hidden
    windowManager.createLoginWindow();

    createTray();
    clipboardMonitor.start();
    startServerStatusMonitor();
    startTicketListener();
    startPriorityDevicesListener();

    app.setLoginItemSettings({
      openAtLogin: currentSettings.autoStartEnabled,
      path: app.getPath('exe')
    });
  }, 2500);

  setupIpcHandlers();
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('RecciTek WCheck');
  }
  initCache();
  initializeApp();

  // Auto-updater setup (only in production)
  if (!is.dev) {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
      const mainWindow = windowManager?.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-available', info.version);
      }
    });

    autoUpdater.on('download-progress', (progress) => {
      const mainWindow = windowManager?.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-progress', Math.round(progress.percent));
      }
    });

    autoUpdater.on('update-downloaded', () => {
      const mainWindow = windowManager?.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-downloaded');
      }
    });

    ipcMain.on('start-update-download', () => {
      autoUpdater.downloadUpdate();
    });

    ipcMain.on('install-update', () => {
      autoUpdater.quitAndInstall();
    });

    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.log('Update check failed:', err?.message);
      });
    }, 10000);
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (ticketUnsubscribe) {
    ticketUnsubscribe();
    ticketUnsubscribe = null;
  }
  if (priorityUnsubscribe) {
    priorityUnsubscribe();
    priorityUnsubscribe = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

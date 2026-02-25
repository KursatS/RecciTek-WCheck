import {
  app,
  Tray,
  Menu,
  ipcMain,
  nativeImage,
  clipboard,
  globalShortcut,
  net,
  dialog
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
import { createTicket, claimTicket, completeTicket, subscribeAsKargoKabul, subscribeAsMH, updateTicketDetails } from './ticketService';
import type { Unsubscribe } from 'firebase/firestore';
import * as fs from 'fs';

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
let cachedTickets: any[] = [];

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
      method: 'GET',
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

async function handleDetection(serial: string): Promise<void> {
  // GÜNCELLENEN KISIM: Ayar aktifse ve seri aynıysa işlem yapma
  if (currentSettings.preventDuplicatePopup && serial === lastDetectedSerial) {
    return;
  }
  lastDetectedSerial = serial;

  const cached = await getCachedData(serial);
  if (cached) {
    currentPopupData = cached;
    windowManager.showPopup(cached, currentSettings.popupTimeout, currentSettings.popupSizeLevel);
    windowManager.getMainWindow()?.webContents.send('refresh-cards');
    return;
  }

  try {
    const warrantyInfo = await checkWarranty(serial);
    await saveToCache(serial, warrantyInfo);
    currentPopupData = warrantyInfo;
    windowManager.showPopup(warrantyInfo, currentSettings.popupTimeout, currentSettings.popupSizeLevel);
    windowManager.getMainWindow()?.webContents.send('refresh-cards');
  } catch {
    windowManager.showPopup({
      serial,
      warranty_status: 'İnternet Bağlantı Hatası',
      is_error: true
    }, currentSettings.popupTimeout, currentSettings.popupSizeLevel);
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
    personnelName: currentSettings.personnelName
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

  ipcMain.on('toggle-monitoring', (_, enabled) => {
    monitoringEnabled = enabled;
    clipboardMonitor.setEnabled(enabled);
    windowManager.getMainWindow()?.webContents.send('monitoring-toggled', monitoringEnabled);
  });

  ipcMain.on('open-settings', () => {
    windowManager.openSettingsWindow();
  });

  ipcMain.on('open-bonus', () => {
    windowManager.openBonusWindow();
  });

  ipcMain.handle('calculate-bonus', async (_, filePath) => {
    try {
      const buffer = fs.readFileSync(filePath);
      return parseBonusData(buffer);
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

  ipcMain.handle('update-ticket-details', async (_, id, details) => {
    try {
      await updateTicketDetails(id, details);
      return { success: true };
    } catch (error) {
      console.error('Error updating ticket details:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.on('open-tickets', () => {
    windowManager.openTicketsWindow();
  });
}

// Helper to create the system tray
function createTray() {
  const mainWindow = windowManager.getMainWindow();
  const iconPath = is.dev
    ? path.join(__dirname, '../../assets/logo.png')
    : path.join(process.resourcesPath, 'assets/logo.png');

  tray = new Tray(nativeImage.createFromPath(iconPath));
  tray.setToolTip('Warranty Monitor');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Ana Menü', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { label: 'Ayarlar', click: () => windowManager.openSettingsWindow() },
    { type: 'separator' },
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

function startTicketListener() {
  // Unsubscribe from previous listener if exists
  if (ticketUnsubscribe) {
    ticketUnsubscribe();
    ticketUnsubscribe = null;
  }

  const broadcastTickets = (tickets: any[]) => {
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
    const name = currentSettings.personnelName || 'İsimsiz Personel';
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

    const mainWindow = windowManager.createMainWindow();

    createTray();
    clipboardMonitor.start();
    startServerStatusMonitor();
    startTicketListener();

    app.setLoginItemSettings({
      openAtLogin: currentSettings.autoStartEnabled,
      path: app.getPath('exe')
    });
  }, 2500);

  setupIpcHandlers();
}

app.whenReady().then(() => {
  initCache();
  initializeApp();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (ticketUnsubscribe) {
    ticketUnsubscribe();
    ticketUnsubscribe = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

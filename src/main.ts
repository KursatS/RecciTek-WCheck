import {
  app,
  Tray,
  Menu,
  ipcMain,
  nativeImage,
  clipboard,
  globalShortcut,
  net
} from 'electron';
import * as path from 'path';
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

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let windowManager: WindowManager;
let clipboardMonitor: ClipboardMonitor;
let tray: Tray | null = null;
let currentSettings: AppSettings;
let currentPopupData: any = null;
let lastDetectedSerial: string = '';
let statusInterval: NodeJS.Timeout | null = null;

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

  // Initial check
  setTimeout(checkServerStatus, 5000);

  // Interval check: 5 minutes + random jitter (up to 2 minutes)
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
  if (serial === lastDetectedSerial) {
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
    doubleCopyEnabled: currentSettings.doubleCopyEnabled
  }));

  ipcMain.handle('save-settings', async (_, settings) => {
    currentSettings = settings;
    saveSettings(settings);
    return true;
  });

  ipcMain.on('toggle-monitoring', (_, enabled) => {
    clipboardMonitor.setEnabled(enabled);
  });

  ipcMain.on('open-settings', () => {
    windowManager.openSettingsWindow();
  });

  ipcMain.handle('toggle-double-copy', async (_, enabled) => {
    currentSettings.doubleCopyEnabled = enabled;
    saveSettings(currentSettings);
    return enabled;
  });


  ipcMain.handle('save-note', async () => { }); // No-op to prevent frontend errors if index.html isn't fully cleaned yet
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

  ipcMain.handle('delete-entry', async (_, s) => {
    await deleteEntry(s);
    return await loadCache();
  });
}

function initializeApp() {
  currentSettings = loadSettings();
  windowManager = new WindowManager(__dirname);
  clipboardMonitor = new ClipboardMonitor(handleDetection);

  const splash = windowManager.createSplashWindow();

  setTimeout(() => {
    try {
      splash.close();
    } catch { }

    const mainWindow = windowManager.createMainWindow();

    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, '../logo.png')));
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

    clipboardMonitor.start();
    startServerStatusMonitor();
  }, 2500);

  setupIpcHandlers();

  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (currentSettings.doubleCopyEnabled) {
      handleDoubleCopy();
    }
  });
}

app.whenReady().then(() => {
  initCache();
  initializeApp();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  nativeImage,
  screen,
  clipboard,
  globalShortcut
} from 'electron';
import * as path from 'path';
import { checkWarranty } from './warrantyChecker';
import { isSerialNumber } from './serialDetector';
import {
  getCachedData,
  saveToCache,
  loadCache,
  toggleFavorite,
  saveNote,
  getNote,
  clearCache,
  saveStatus,
  initCache,
  deleteEntry
} from './cacheManager';

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let monitoringEnabled = true;

let popupTimeout: NodeJS.Timeout | null = null;
let currentPopup: BrowserWindow | null = null;
let popupTimeoutDuration = 5000;
let popupSizeLevel = 3;
let currentPopupData: any = null;

let doubleCopyEnabled = true;
let popupVisible = false;

const fs = require('fs');

interface AppSettings {
  popupTimeout: number;
  popupSizeLevel: number;
  doubleCopyEnabled: boolean;
}

function getSettingsPath(): string {
  return path.join(app.getPath('documents'), 'RecciTek', 'settings.json');
}

function loadSettings(): AppSettings {
  try {
    const p = getSettingsPath();
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {}
  return { popupTimeout: 5000, popupSizeLevel: 3, doubleCopyEnabled: true };
}

function saveSettings(settings: AppSettings): void {
  fs.mkdirSync(path.dirname(getSettingsPath()), { recursive: true });
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
}

const POPUP_SIZE_LEVELS = [
  { level: 1, file: 'spopup.html', width: 400, height: 300, label: 'Küçük' },
  { level: 2, file: 'mpopup.html', width: 460, height: 330, label: 'Orta' },
  { level: 3, file: 'lpopup.html', width: 500, height: 350, label: 'Büyük' }
];

function getCurrentPopupSize() {
  return POPUP_SIZE_LEVELS.find(l => l.level === popupSizeLevel) || POPUP_SIZE_LEVELS[2];
}

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

function handleDoubleCopy(): void {
  try {
    if (!popupVisible || !currentPopupData) return;

    const textToCopy = extractCopyText(currentPopupData);
    if (!textToCopy) return;

    clipboard.writeText(textToCopy);

    if (currentPopup && !currentPopup.isDestroyed()) {
      if (popupTimeout) {
        clearTimeout(popupTimeout);
        popupTimeout = null;
      }
      currentPopup.close();
    }
  } catch {}
}

function startClipboardMonitor() {
  let lastClipboard = '';

  setInterval(() => {
    if (!monitoringEnabled) return;

    const text = clipboard.readText().trim();
    if (!text || text === lastClipboard) return;
    lastClipboard = text;

    if (!isSerialNumber(text)) return;

    handleSerialNumber(text);
  }, 800);
}

async function handleSerialNumber(serial: string): Promise<void> {
  const cached = await getCachedData(serial);
  if (cached) {
    showPopup(cached);
    mainWindow?.webContents.send('refresh-cards');
    return;
  }

  try {
    const warrantyInfo = await checkWarranty(serial);
    await saveToCache(serial, warrantyInfo);
    showPopup(warrantyInfo);
    mainWindow?.webContents.send('refresh-cards');
  } catch {
    showPopup({
      serial,
      warranty_status: 'İnternet Bağlantı Hatası',
      is_error: true
    });
  }
}

function showPopup(info: any): void {
  try {
    if (currentPopup && !currentPopup.isDestroyed()) {
      currentPopup.removeAllListeners('closed');
      currentPopup.close();
    }
  } catch {}

  if (popupTimeout) clearTimeout(popupTimeout);

  currentPopupData = info;

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const size = getCurrentPopupSize();

  const popup = new BrowserWindow({
    width: size.width,
    height: size.height,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    x: width - size.width - 20,
    y: height - size.height - 40,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  currentPopup = popup;
  popup.loadFile(path.join(__dirname, size.file));

  popup.once('ready-to-show', () => {
    try {
      popup.show();
      popupVisible = true;
      popup.webContents.send('popup-data', info, popupTimeoutDuration);
      popupTimeout = setTimeout(() => {
        try {
          popup.close();
        } catch {}
      }, popupTimeoutDuration);
    } catch {}
  });

  popup.on('closed', () => {
    popupVisible = false;
    currentPopup = null;
    currentPopupData = null;
  });
}

function createWindow(): void {
  const splash = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    alwaysOnTop: true,
    resizable: false
  });

  splash.loadFile(path.join(__dirname, 'splash.html'));

  setTimeout(() => {
    try {
      splash.close();
    } catch {}

    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 475,
      minHeight: 400,
      show: false,
      webPreferences: { nodeIntegration: true, contextIsolation: false },
      icon: path.join(__dirname, '../logo.png'),
      autoHideMenuBar: true
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.on('close', e => {
      e.preventDefault();
      mainWindow?.hide();
    });

    mainWindow.once('ready-to-show', () => mainWindow?.show());

    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, '../logo.png')));
    tray.setToolTip('Warranty Monitor');

    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Ana Menü', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
      { label: 'Ayarlar', click: () => mainWindow?.webContents.send('open-settings') },
      { type: 'separator' },
      { label: 'Çıkış', click: () => app.quit() }
    ]));

    tray.on('double-click', () => {
      mainWindow?.show();
      mainWindow?.focus();
    });

    startClipboardMonitor();
  }, 2500);
}

ipcMain.handle('get-cached-data', async () => await loadCache());
ipcMain.handle('get-double-copy', async () => doubleCopyEnabled);

ipcMain.handle('get-settings', async () => {
  return {
    popupTimeout: popupTimeoutDuration,
    popupSizeLevel: popupSizeLevel,
    doubleCopyEnabled: doubleCopyEnabled
  };
});

ipcMain.handle('save-settings', async (_, settings) => {
  popupTimeoutDuration = settings.popupTimeout;
  popupSizeLevel = settings.popupSizeLevel;
  doubleCopyEnabled = settings.doubleCopyEnabled;
  saveSettings({
    popupTimeout: settings.popupTimeout,
    popupSizeLevel: settings.popupSizeLevel,
    doubleCopyEnabled: settings.doubleCopyEnabled
  });
  return true;
});

ipcMain.on('toggle-monitoring', (_, enabled) => {
  monitoringEnabled = enabled;
});

ipcMain.on('open-settings', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 450,
    resizable: false,
    frame: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
    title: 'Ayarlar'
  });

  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
});

ipcMain.handle('toggle-double-copy', async (_, enabled) => {
  doubleCopyEnabled = enabled;
  const s = loadSettings();
  s.doubleCopyEnabled = enabled;
  saveSettings(s);
  return enabled;
});

ipcMain.handle('toggle-favorite', async (_, s) => {
  await toggleFavorite(s);
  return await getCachedData(s);
});
ipcMain.handle('save-note', async (_, s, n) => {
  await saveNote(s, n);
  return await getCachedData(s);
});
ipcMain.handle('get-note', async (_, s) => await getNote(s));
ipcMain.handle('clear-cache', async () => {
  await clearCache();
  return await loadCache();
});
ipcMain.handle('delete-entry', async (_, s) => {
  await deleteEntry(s);
  return await loadCache();
});

app.whenReady().then(() => {
  const settings = loadSettings();
  popupTimeoutDuration = settings.popupTimeout;
  popupSizeLevel = settings.popupSizeLevel;
  doubleCopyEnabled = settings.doubleCopyEnabled !== false;

  initCache();
  createWindow();

  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (popupVisible && doubleCopyEnabled) {
      handleDoubleCopy();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

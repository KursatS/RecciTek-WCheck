import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen, clipboard } from 'electron';
import * as path from 'path';
import { checkWarranty } from './warrantyChecker';
import { isSerialNumber } from './serialDetector';
import { getCachedData, saveToCache, loadCache, toggleFavorite, saveNote, getNote, clearCache, saveStatus, initCache } from './cacheManager';

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow: any = null;
let tray: any = null;
let monitoringEnabled = true;
let lockScreenEnabled = false;
let popupTimeout: NodeJS.Timeout | null = null;
let currentPopup: BrowserWindow | null = null;
let popupTimeoutDuration = 5000; // Default 5 seconds
let popupSizeLevel = 3; // Default to large size

// Settings persistence
interface AppSettings {
  popupTimeout: number;
  popupSizeLevel: number;
}

function getSettingsPath(): string {
  const path = require('path');
  const { app } = require('electron');
  return path.join(app.getPath('documents'), 'RecciTek', 'settings.json');
}

function loadSettings(): AppSettings {
  const fs = require('fs');
  const path = require('path');
  const settingsPath = getSettingsPath();

  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('Settings file not found or corrupted, using defaults');
  }

  return {
    popupTimeout: 5000,
    popupSizeLevel: 3
  };
}

function saveSettings(settings: AppSettings): void {
  const fs = require('fs');
  const path = require('path');
  const settingsPath = getSettingsPath();
  const settingsDir = path.dirname(settingsPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// Size levels: 3 predefined popup types
const POPUP_SIZE_LEVELS = [
  { level: 1, file: 'spopup.html', width: 400, height: 300, label: 'Küçük' },
  { level: 2, file: 'mpopup.html', width: 460, height: 330, label: 'Orta' },
  { level: 3, file: 'lpopup.html', width: 520, height: 360, label: 'Büyük' }
];

// Get current size based on level
function getCurrentPopupSize() {
  const level = POPUP_SIZE_LEVELS.find(l => l.level === popupSizeLevel);
  return level || POPUP_SIZE_LEVELS[2]; // Default to large if not found
}

let popupWidth = getCurrentPopupSize().width;
let popupHeight = getCurrentPopupSize().height;
let settingsWindow: BrowserWindow | null = null;

function openSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 400,
    height: 300,
    show: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: 'Ayarlar',
    icon: path.join(__dirname, '../logo.png'),
    autoHideMenuBar: true,
  });

  // Create settings HTML content
  const settingsHtml = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Ayarlar</title>
      <style>
        body {
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 20px;
          background: #f5f5f5;
          color: #333;
        }
        .setting-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
        }
        input, select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
        }
        button {
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 600;
          margin-right: 10px;
        }
        button:hover {
          background: #45a049;
        }
        .buttons {
          text-align: right;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <h2>Popup Ayarları</h2>

      <div class="setting-group">
        <label for="timeout">Popup Kapanma Süresi (saniye):</label>
        <input type="number" id="timeout" min="1" max="30" value="${popupTimeoutDuration / 1000}">
      </div>

      <div class="setting-group">
        <label for="size">Popup Boyutu:</label>
        <select id="size">
          ${POPUP_SIZE_LEVELS.map(level =>
            `<option value="${level.level}" ${level.level === popupSizeLevel ? 'selected' : ''}>${level.label} (${level.width}x${level.height})</option>`
          ).join('')}
        </select>
      </div>

      <div class="buttons">
        <button id="save">Kaydet</button>
        <button id="cancel">İptal</button>
      </div>

      <script>
        const { ipcRenderer } = require('electron');

        document.getElementById('save').onclick = () => {
          const timeout = parseInt(document.getElementById('timeout').value) * 1000;
          const sizeLevel = parseInt(document.getElementById('size').value);

          ipcRenderer.send('save-settings', { timeout, sizeLevel });
          window.close();
        };

        document.getElementById('cancel').onclick = () => {
          window.close();
        };
      </script>
    </body>
    </html>
  `;

  settingsWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(settingsHtml)}`);

  settingsWindow.once('ready-to-show', () => {
    if (settingsWindow) {
      settingsWindow.show();
    }
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function createWindow(): void {
  const splash = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  splash.loadFile(path.join(__dirname, 'splash.html'));

  setTimeout(() => {
    splash.close();

    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 475,
      minHeight: 400,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      icon: path.join(__dirname, '../logo.png'),
      show: false,
      autoHideMenuBar: true,
    });

    mainWindow!.loadFile(path.join(__dirname, 'index.html'));

    mainWindow!.on('closed', () => {
      mainWindow = null;
    });

    mainWindow!.on('close', (event: any) => {
      event.preventDefault();
      mainWindow!.hide();
    });

    const icon = nativeImage.createFromPath(path.join(__dirname, '../logo.png'));
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Ana Menü', click: () => mainWindow?.show() },
      { label: 'Ayarlar', click: () => openSettingsWindow() },
      { label: 'Ekrana Kilitle', type: 'checkbox', checked: lockScreenEnabled, click: () => {
        lockScreenEnabled = !lockScreenEnabled;
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(lockScreenEnabled);
          mainWindow.webContents.send('lock-screen-toggled', lockScreenEnabled);
        }
      }},
      { label: 'Çıkış', click: () => {
        if (mainWindow) {
          mainWindow.destroy();
        }
        app.quit();
      }},
    ]);

    tray!.on('double-click', () => {
      mainWindow?.show();
    });
    tray!.setToolTip('Warranty Monitor');
    tray!.setContextMenu(contextMenu);

    let lastClipboard = '';

    const monitorClipboard = () => {
      if (!monitoringEnabled) return;
      const currentClipboard = clipboard.readText();
      if (currentClipboard !== lastClipboard && isSerialNumber(currentClipboard)) {
        lastClipboard = currentClipboard;
        handleSerialNumber(currentClipboard);
      }
    };

    setInterval(monitorClipboard, 1000);
  }, 3000);
}

async function handleSerialNumber(serial: string): Promise<void> {
  const cached = await getCachedData(serial);
  if (cached) {
    showPopup(cached);
    if (mainWindow) {
      mainWindow.webContents.send('refresh-cards');
    }
    return;
  }

  const warrantyInfo = await checkWarranty(serial);
  await saveToCache(serial, warrantyInfo);
  showPopup(warrantyInfo);
  if (mainWindow) {
    mainWindow.webContents.send('refresh-cards');
  }
}

function showPopup(info: any): void {
  // Close any existing popup before showing new one
  if (currentPopup && !currentPopup.isDestroyed()) {
    currentPopup.close();
  }

  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const currentSize = getCurrentPopupSize();

  const popup = new BrowserWindow({
    width: currentSize.width,
    height: currentSize.height,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    x: width - currentSize.width - 20,
    y: height - currentSize.height - 40,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  currentPopup = popup;
  popup.loadFile(path.join(__dirname, currentSize.file));

  popup.once('ready-to-show', () => {
    popup.show();

    setTimeout(() => {
      popup.webContents.send('popup-data', info, popupTimeoutDuration);
    }, 100);

    // Set initial timeout based on settings
    popupTimeout = setTimeout(() => {
      if (currentPopup && !currentPopup.isDestroyed()) {
        currentPopup.close();
      }
      popupTimeout = null;
    }, popupTimeoutDuration);
  });

  popup.on('closed', () => {
    if (popupTimeout) {
      clearTimeout(popupTimeout);
      popupTimeout = null;
    }
    currentPopup = null;
  });
}

ipcMain.handle('get-cached-data', async () => {
  return await loadCache();
});

ipcMain.on('toggle-monitoring', (event: any, enabled: any) => {
  monitoringEnabled = enabled;
});

ipcMain.handle('toggle-favorite', async (event: any, serial: string) => {
  await toggleFavorite(serial);
  return await getCachedData(serial);
});

ipcMain.handle('save-note', async (event: any, serial: string, note: string) => {
  await saveNote(serial, note);
  return await getCachedData(serial);
});

ipcMain.handle('get-note', async (event: any, serial: string) => {
  return await getNote(serial);
});

ipcMain.handle('clear-cache', async () => {
  await clearCache();
  if (mainWindow) {
    mainWindow.focus();
  }
  return await loadCache();
});

ipcMain.handle('save-status', async (event: any, serial: string, status: string) => {
  await saveStatus(serial, status);
  return await getCachedData(serial);
});

ipcMain.on('toggle-lock-screen', () => {
  lockScreenEnabled = !lockScreenEnabled;
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(lockScreenEnabled);
    mainWindow.webContents.send('lock-screen-toggled', lockScreenEnabled);
  }
  if (tray) {
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Ana Menü', click: () => mainWindow?.show() },
      { label: 'Ekrana Kilitle', type: 'checkbox', checked: lockScreenEnabled, click: () => {
        lockScreenEnabled = !lockScreenEnabled;
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(lockScreenEnabled);
          mainWindow.webContents.send('lock-screen-toggled', lockScreenEnabled);
        }
      }},
      { label: 'Çıkış', click: () => {
        if (mainWindow) {
          mainWindow.destroy();
        }
        app.quit();
      }},
    ]);
    tray.setContextMenu(contextMenu);
  }
});

// Popup hover IPC handlers
ipcMain.on('popup-hover-enter', (event: any) => {
  if (event.sender === currentPopup?.webContents && popupTimeout) {
    clearTimeout(popupTimeout);
    popupTimeout = null;
  }
});

ipcMain.on('popup-hover-leave', (event: any) => {
  if (event.sender === currentPopup?.webContents) {
    // Set a new timeout based on settings to close the popup
    popupTimeout = setTimeout(() => {
      if (currentPopup && !currentPopup.isDestroyed()) {
        currentPopup.close();
      }
      popupTimeout = null;
    }, popupTimeoutDuration);
  }
});

// Settings IPC handler
ipcMain.on('save-settings', (event: any, settings: any) => {
  popupTimeoutDuration = Math.min(settings.timeout, 5000); // Max 5 seconds
  popupSizeLevel = settings.sizeLevel;
  const newSize = getCurrentPopupSize();
  popupWidth = newSize.width;
  popupHeight = newSize.height;

  // Save settings to file
  saveSettings({
    popupTimeout: popupTimeoutDuration,
    popupSizeLevel: popupSizeLevel
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  // Load settings on app startup
  const settings = loadSettings();
  popupTimeoutDuration = settings.popupTimeout;
  popupSizeLevel = settings.popupSizeLevel;

  initCache();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
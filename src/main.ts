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
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const popup = new BrowserWindow({
    width: 520,
    height: 360,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    x: width - 540,
    y: height - 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  currentPopup = popup;
  popup.loadFile(path.join(__dirname, 'popup.html'));

  popup.once('ready-to-show', () => {
    popup.show();

    setTimeout(() => {
      popup.webContents.send('popup-data', info);
    }, 100);

    // Set initial 5-second timeout
    popupTimeout = setTimeout(() => {
      if (currentPopup && !currentPopup.isDestroyed()) {
        currentPopup.close();
      }
      popupTimeout = null;
    }, 5000);
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
    // Set a new 5-second timeout to close the popup
    popupTimeout = setTimeout(() => {
      if (currentPopup && !currentPopup.isDestroyed()) {
        currentPopup.close();
      }
      popupTimeout = null;
    }, 5000);
  }
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
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
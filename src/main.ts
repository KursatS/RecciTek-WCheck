const electron = require('electron');
import * as path from 'path';
import { checkWarranty } from './warrantyChecker';
import { isSerialNumber } from './serialDetector';
import { getCachedData, saveToCache, loadCache, toggleFavorite, saveNote, getNote, clearCache, saveStatus, initCache } from './cacheManager';

const gotTheLock = electron.app.requestSingleInstanceLock();

if (!gotTheLock) {
  electron.app.quit();
  process.exit(0);
}

let mainWindow: any = null;
let tray: any = null;
let monitoringEnabled = true;
let lockScreenEnabled = false;

function createWindow(): void {
  const splash = new electron.BrowserWindow({
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

    mainWindow = new electron.BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 475,
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

    const icon = electron.nativeImage.createFromPath(path.join(__dirname, '../logo.png'));
    tray = new electron.Tray(icon);
    const contextMenu = electron.Menu.buildFromTemplate([
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
        electron.app.quit();
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
      const currentClipboard = require('electron').clipboard.readText();
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

  const popup = new electron.BrowserWindow({
    width: 480,
    height: 360,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    x: width - 500,
    y: height - 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  popup.loadFile(path.join(__dirname, 'popup.html'));

  popup.once('ready-to-show', () => {
    popup.show();

    setTimeout(() => {
      popup.webContents.send('popup-data', info);
    }, 100);

    setTimeout(() => {
      if (popup && !popup.isDestroyed()) {
        popup.close();
      }
    }, 5000);
  });

  popup.on('closed', () => {
  });
}

electron.ipcMain.handle('get-cached-data', async () => {
  return await loadCache();
});

electron.ipcMain.on('toggle-monitoring', (event: any, enabled: any) => {
  monitoringEnabled = enabled;
});

electron.ipcMain.handle('toggle-favorite', async (event: any, serial: string) => {
  await toggleFavorite(serial);
  return await getCachedData(serial);
});

electron.ipcMain.handle('save-note', async (event: any, serial: string, note: string) => {
  await saveNote(serial, note);
  return await getCachedData(serial);
});

electron.ipcMain.handle('get-note', async (event: any, serial: string) => {
  return await getNote(serial);
});

electron.ipcMain.handle('clear-cache', async () => {
  await clearCache();
  return await loadCache();
});

electron.ipcMain.handle('save-status', async (event: any, serial: string, status: string) => {
  await saveStatus(serial, status);
  return await getCachedData(serial);
});

electron.ipcMain.on('toggle-lock-screen', () => {
  lockScreenEnabled = !lockScreenEnabled;
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(lockScreenEnabled);
    mainWindow.webContents.send('lock-screen-toggled', lockScreenEnabled);
  }
  if (tray) {
    const contextMenu = electron.Menu.buildFromTemplate([
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
        electron.app.quit();
      }},
    ]);
    tray.setContextMenu(contextMenu);
  }
});

electron.app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

electron.app.whenReady().then(() => {
  initCache();
  createWindow();
});

electron.app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    electron.app.quit();
  }
});

electron.app.on('activate', () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
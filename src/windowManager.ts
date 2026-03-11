import { BrowserWindow, screen, app, shell, ipcMain } from 'electron';
import * as path from 'path';
import { is } from '@electron-toolkit/utils';
import { loadSettings } from './settingsManager';

export interface PopupSize {
    level: number;
    file: string;
    width: number;
    height: number;
    label: string;
}

export const POPUP_SIZE_LEVELS: PopupSize[] = [
    { level: 1, file: 'popup.html', width: 400, height: 300, label: 'Küçük' },
    { level: 2, file: 'popup.html', width: 460, height: 330, label: 'Orta' },
    { level: 3, file: 'popup.html', width: 500, height: 350, label: 'Büyük' }
];

export class WindowManager {
    private mainWindow: BrowserWindow | null = null;
    private loginWindow: BrowserWindow | null = null;
    private currentPopup: BrowserWindow | null = null;
    private popupTimeout: NodeJS.Timeout | null = null;
    private popupVisible: boolean = false;
    private popupStartTime: number = 0;
    private popupDuration: number = 0;
    private popupRemaining: number = 0;

    private preloadPath: string = '';

    constructor(private appPath: string) {
        this.preloadPath = path.join(__dirname, '../preload/index.js');
    }

    private loadFile(win: BrowserWindow, fileName: string): void {
        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/${fileName}`);
        } else {
            win.loadFile(path.join(__dirname, `../renderer/${fileName}`));
        }
    }

    createSplashWindow(): BrowserWindow {
        const splash = new BrowserWindow({
            width: 600,
            height: 400,
            frame: false,
            alwaysOnTop: true,
            resizable: false,
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false
            }
        });
        this.loadFile(splash, 'splash.html');
        return splash;
    }

    createMainWindow(): BrowserWindow {
        this.mainWindow = new BrowserWindow({
            width: 800,
            height: 600,
            minWidth: 475,
            minHeight: 400,
            show: false,
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                preload: this.preloadPath
            },
            icon: path.join(__dirname, '../../assets/logo.png'),
            autoHideMenuBar: true
        });

        this.loadFile(this.mainWindow, 'index.html');

        this.mainWindow.on('close', (e) => {
            if (this.mainWindow) {
                e.preventDefault();
                this.mainWindow.hide();
            }
        });

        return this.mainWindow;
    }

    createLoginWindow(): BrowserWindow {
        this.loginWindow = new BrowserWindow({
            width: 500,
            height: 500,
            frame: false,
            resizable: false,
            show: false,
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                preload: this.preloadPath
            },
            icon: path.join(__dirname, '../../assets/logo.png'),
        });

        this.loadFile(this.loginWindow, 'login.html');
        this.loginWindow.once('ready-to-show', () => this.loginWindow?.show());

        this.loginWindow.on('closed', () => {
            // If main window is not visible (login was not completed), quit the app
            if (!this.mainWindow?.isVisible()) {
                app.quit();
            }
            this.loginWindow = null;
        });

        return this.loginWindow;
    }

    onLoginSuccess(): void {
        if (this.loginWindow && !this.loginWindow.isDestroyed()) {
            this.loginWindow.close();
        }
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.show();
            this.mainWindow.focus();
            this.mainWindow.webContents.send('refresh-cards');
        }
    }

    getMainWindow(): BrowserWindow | null {
        return this.mainWindow;
    }

    showPopup(info: any, timeoutDuration: number, sizeLevel: number): void {
        this.closePopup();

        const size = POPUP_SIZE_LEVELS.find(l => l.level === sizeLevel) || POPUP_SIZE_LEVELS[2];
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;

        this.currentPopup = new BrowserWindow({
            width: size.width,
            height: size.height,
            show: false,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            resizable: false,
            x: width - size.width - 20,
            y: height - size.height - 40,
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                preload: this.preloadPath
            }
        });

        this.loadFile(this.currentPopup, size.file);

        this.currentPopup.once('ready-to-show', () => {
            if (this.currentPopup) {
                this.currentPopup.show();
                this.popupVisible = true;

                // Pass the size level and theme so the popup can adjust its styling
                const settings = loadSettings();
                const infoWithSize = { ...info, sizeLevel, theme: settings.theme || 'dark' };
                this.currentPopup.webContents.send('popup-data', infoWithSize, timeoutDuration);

                this.popupDuration = timeoutDuration;
                this.popupStartTime = Date.now();
                this.popupRemaining = timeoutDuration;

                this.popupTimeout = setTimeout(() => {
                    this.closePopup();
                }, timeoutDuration);
            }
        });

        const popup = this.currentPopup;
        popup.on('closed', () => {
            if (this.currentPopup === popup) {
                this.currentPopup = null;
                this.popupVisible = false;
            }
        });
    }

    closePopup(): void {
        if (this.popupTimeout) {
            clearTimeout(this.popupTimeout);
            this.popupTimeout = null;
        }
        if (this.currentPopup && !this.currentPopup.isDestroyed()) {
            this.currentPopup.close();
            this.currentPopup = null;
        }
        this.popupVisible = false;
    }

    isPopupVisible(): boolean {
        return this.popupVisible;
    }

    pausePopupTimeout(): void {
        if (this.popupTimeout) {
            clearTimeout(this.popupTimeout);
            this.popupTimeout = null;
            const elapsed = Date.now() - this.popupStartTime;
            this.popupRemaining = Math.max(0, this.popupRemaining - elapsed);
        }
    }

    resumePopupTimeout(): void {
        if (!this.popupTimeout && this.popupVisible && this.popupRemaining > 0) {
            this.popupStartTime = Date.now();
            this.popupTimeout = setTimeout(() => {
                this.closePopup();
            }, this.popupRemaining);
        }
    }

    forceQuit(): void {
        [this.mainWindow, this.loginWindow, this.currentPopup].forEach(win => {
            if (win && !win.isDestroyed()) {
                win.destroy();
            }
        });
        app.exit(0);
    }
}

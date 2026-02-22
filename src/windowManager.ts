import { BrowserWindow, screen, app } from 'electron';
import * as path from 'path';

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
    private settingsWindow: BrowserWindow | null = null;
    private bonusWindow: BrowserWindow | null = null;
    private currentPopup: BrowserWindow | null = null;
    private popupTimeout: NodeJS.Timeout | null = null;
    private popupVisible: boolean = false;
    private popupStartTime: number = 0;
    private popupDuration: number = 0;
    private popupRemaining: number = 0;

    constructor(private appPath: string) { }

    createSplashWindow(): BrowserWindow {
        const splash = new BrowserWindow({
            width: 600,
            height: 400,
            frame: false,
            alwaysOnTop: true,
            resizable: false
        });
        splash.loadFile(path.join(this.appPath, 'splash.html'));
        return splash;
    }

    createMainWindow(): BrowserWindow {
        this.mainWindow = new BrowserWindow({
            width: 800,
            height: 600,
            minWidth: 475,
            minHeight: 400,
            show: false,
            webPreferences: { nodeIntegration: true, contextIsolation: false },
            icon: path.join(this.appPath, '../logo.png'),
            autoHideMenuBar: true
        });

        this.mainWindow.loadFile(path.join(this.appPath, 'index.html'));

        this.mainWindow.on('close', (e) => {
            if (this.mainWindow) {
                e.preventDefault();
                this.mainWindow.hide();
            }
        });

        this.mainWindow.once('ready-to-show', () => this.mainWindow?.show());

        return this.mainWindow;
    }

    getMainWindow(): BrowserWindow | null {
        return this.mainWindow;
    }

    openSettingsWindow(): void {
        if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
            this.settingsWindow.focus();
            return;
        }

        this.settingsWindow = new BrowserWindow({
            width: 500,
            height: 450,
            resizable: false,
            frame: true,
            webPreferences: { nodeIntegration: true, contextIsolation: false },
            title: 'Ayarlar',
            autoHideMenuBar: true
        });

        this.settingsWindow.setMenuBarVisibility(false);
        this.settingsWindow.loadFile(path.join(this.appPath, 'settings.html'));
        this.settingsWindow.on('closed', () => {
            this.settingsWindow = null;
        });
    }

    openBonusWindow(): void {
        if (this.bonusWindow && !this.bonusWindow.isDestroyed()) {
            this.bonusWindow.focus();
            return;
        }

        this.bonusWindow = new BrowserWindow({
            width: 900,
            height: 700,
            resizable: true,
            frame: true,
            webPreferences: { nodeIntegration: true, contextIsolation: false },
            title: 'Prim Hesaplama',
            autoHideMenuBar: true
        });

        this.bonusWindow.setMenuBarVisibility(false);
        this.bonusWindow.loadFile(path.join(this.appPath, 'bonus.html'));
        this.bonusWindow.on('closed', () => {
            this.bonusWindow = null;
        });
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
            webPreferences: { nodeIntegration: true, contextIsolation: false }
        });

        this.currentPopup.loadFile(path.join(this.appPath, size.file));

        this.currentPopup.once('ready-to-show', () => {
            if (this.currentPopup) {
                this.currentPopup.show();
                this.popupVisible = true;

                // Pass the size level so the popup can adjust its styling
                const infoWithSize = { ...info, sizeLevel };
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
        [this.mainWindow, this.settingsWindow, this.currentPopup].forEach(win => {
            if (win && !win.isDestroyed()) {
                win.destroy();
            }
        });
        app.exit(0);
    }
}

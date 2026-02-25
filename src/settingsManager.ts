import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export interface AppSettings {
  popupTimeout: number;
  popupSizeLevel: number;
  doubleCopyEnabled: boolean;
  autoStartEnabled: boolean;
  preventDuplicatePopup: boolean;
  shortcuts?: {
    clearCache: string;
    toggleMonitoring: string;
  };
  role?: 'kargo_kabul' | 'mh';
  personnelName?: string;
}

export function getSettingsPath(): string {
  return path.join(app.getPath('documents'), 'RecciTek', 'settings.json');
}

export function loadSettings(): AppSettings {
  const defaultSettings: AppSettings = {
    popupTimeout: 5000,
    popupSizeLevel: 2,
    doubleCopyEnabled: true,
    autoStartEnabled: false,
    preventDuplicatePopup: true,
    shortcuts: {
      clearCache: 'CommandOrControl+Shift+X',
      toggleMonitoring: 'CommandOrControl+Shift+C'
    },
    role: 'kargo_kabul',
    personnelName: ''
  };

  try {
    const p = getSettingsPath();
    if (fs.existsSync(p)) {
      const savedSettings = JSON.parse(fs.readFileSync(p, 'utf8'));

      return { ...defaultSettings, ...savedSettings };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return defaultSettings;
}

export function saveSettings(settings: AppSettings): void {
  try {
    const settingsPath = getSettingsPath();
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

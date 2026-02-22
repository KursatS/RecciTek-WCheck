import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export interface AppSettings {
  popupTimeout: number;
  popupSizeLevel: number;
  doubleCopyEnabled: boolean;
}

export function getSettingsPath(): string {
  return path.join(app.getPath('documents'), 'RecciTek', 'settings.json');
}

export function loadSettings(): AppSettings {
  try {
    const p = getSettingsPath();
    if (fs.existsSync(p)) {
      const settings = JSON.parse(fs.readFileSync(p, 'utf8'));
      return { ...settings, doubleCopyEnabled: true };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return { popupTimeout: 5000, popupSizeLevel: 2, doubleCopyEnabled: true };
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

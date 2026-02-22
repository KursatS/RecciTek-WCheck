import Database from 'better-sqlite3';
import * as path from 'path';
const electron = require('electron');
const { app } = electron;

let db: any = null;

export function initCache() {
  const dbDir = path.join(app.getPath('documents'), 'RecciTek');
  const fs = require('fs');

  // Create RecciTek directory in Documents if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'cache.db');
  db = new Database(dbPath);

  db.exec(`CREATE TABLE IF NOT EXISTS cache (
    serial TEXT PRIMARY KEY,
    model_name TEXT,
    model_color TEXT,
    warranty_status TEXT,
    copy_date TEXT,
    warranty_end TEXT,
    status TEXT
  )`);

  try {
    db.exec(`ALTER TABLE cache ADD COLUMN status TEXT`);
  } catch (err) {
  }
}

interface CacheEntry {
  serial: string;
  model_name: string;
  model_color: string;
  warranty_status: string;
  copy_date: string;
  warranty_end?: string;
  status?: string;
}

export function loadCache(): Promise<CacheEntry[]> {
  const stmt = db.prepare('SELECT * FROM cache');
  return Promise.resolve(stmt.all() as CacheEntry[]);
}

export function getCachedData(serial: string): Promise<CacheEntry | null> {
  const stmt = db.prepare('SELECT * FROM cache WHERE serial = ?');
  return Promise.resolve(stmt.get(serial) as CacheEntry || null);
}

export function saveToCache(serial: string, info: any): Promise<void> {
  // Override warranty status for RCCVBY and RCFVBY prefixes if out of warranty
  if ((serial.startsWith('RCCVBY') || serial.startsWith('RCFVBY')) && info.warranty_status === 'GARANTI KAPSAMI DISINDA') {
    info.warranty_status = 'RECCI GARANTILI';
    info.model_name = 'cihaz üzerinden öğreniniz';
    info.model_color = 'cihaz üzerinden öğreniniz';
  }

  const entry: CacheEntry = {
    serial,
    model_name: info.model_name || '',
    model_color: info.model_color || '',
    warranty_status: info.warranty_status,
    copy_date: new Date().toISOString(),
    warranty_end: info.warranty_end,
    status: info.status || ''
  };
  const stmt = db.prepare(`INSERT OR REPLACE INTO cache (serial, model_name, model_color, warranty_status, copy_date, warranty_end, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(entry.serial, entry.model_name, entry.model_color, entry.warranty_status, entry.copy_date, entry.warranty_end, entry.status);
  return Promise.resolve();
}



export function saveStatus(serial: string, status: string): Promise<void> {
  const stmt = db.prepare('UPDATE cache SET status = ? WHERE serial = ?');
  stmt.run(status, serial);
  return Promise.resolve();
}

export function clearCache(): Promise<void> {
  const stmt = db.prepare('DELETE FROM cache');
  stmt.run();
  return Promise.resolve();
}

export function deleteEntry(serial: string): Promise<void> {
  const stmt = db.prepare('DELETE FROM cache WHERE serial = ?');
  stmt.run(serial);
  return Promise.resolve();
}

export function getDatabasePath(): string {
  return path.join(app.getPath('documents'), 'RecciTek', 'cache.db');
}
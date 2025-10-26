import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'cache.db');
const db = new Database(dbPath);

db.exec(`CREATE TABLE IF NOT EXISTS cache (
  serial TEXT PRIMARY KEY,
  model_name TEXT,
  model_color TEXT,
  warranty_status TEXT,
  copy_date TEXT,
  warranty_end TEXT,
  is_favorite INTEGER DEFAULT 0,
  has_note INTEGER DEFAULT 0,
  note_content TEXT,
  status TEXT
)`);

try {
  db.exec(`ALTER TABLE cache ADD COLUMN status TEXT`);
} catch (err) {
}

interface CacheEntry {
  serial: string;
  model_name: string;
  model_color: string;
  warranty_status: string;
  copy_date: string;
  warranty_end?: string;
  is_favorite?: number;
  has_note?: number;
  note_content?: string;
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
  const entry: CacheEntry = {
    serial,
    model_name: info.model_name || '',
    model_color: info.model_color || '',
    warranty_status: info.warranty_status,
    copy_date: new Date().toISOString(),
    warranty_end: info.warranty_end,
    is_favorite: info.is_favorite || 0,
    has_note: info.has_note || 0,
    note_content: info.note_content || '',
    status: info.status || ''
  };
  const stmt = db.prepare(`INSERT OR REPLACE INTO cache (serial, model_name, model_color, warranty_status, copy_date, warranty_end, is_favorite, has_note, note_content, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(entry.serial, entry.model_name, entry.model_color, entry.warranty_status, entry.copy_date, entry.warranty_end, entry.is_favorite, entry.has_note, entry.note_content, entry.status);
  return Promise.resolve();
}

export function toggleFavorite(serial: string): Promise<void> {
  const getStmt = db.prepare('SELECT is_favorite FROM cache WHERE serial = ?');
  const row = getStmt.get(serial) as any;
  const newFavorite = row ? (row.is_favorite ? 0 : 1) : 1;
  const updateStmt = db.prepare('UPDATE cache SET is_favorite = ? WHERE serial = ?');
  updateStmt.run(newFavorite, serial);
  return Promise.resolve();
}

export function saveNote(serial: string, note: string): Promise<void> {
  const hasNote = note.trim() ? 1 : 0;
  const stmt = db.prepare('UPDATE cache SET note_content = ?, has_note = ? WHERE serial = ?');
  stmt.run(note, hasNote, serial);
  return Promise.resolve();
}

export function getNote(serial: string): Promise<string | null> {
  const stmt = db.prepare('SELECT note_content FROM cache WHERE serial = ?');
  const row = stmt.get(serial) as any;
  return Promise.resolve(row ? row.note_content : null);
}

export function saveStatus(serial: string, status: string): Promise<void> {
  const stmt = db.prepare('UPDATE cache SET status = ? WHERE serial = ?');
  stmt.run(status, serial);
  return Promise.resolve();
}

export function clearCache(): Promise<void> {
  const stmt = db.prepare('DELETE FROM cache WHERE is_favorite = 0');
  stmt.run();
  return Promise.resolve();
}
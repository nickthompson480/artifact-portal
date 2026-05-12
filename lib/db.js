import Database from 'better-sqlite3';
import { DB_PATH } from './config.js';
import { applyMigrations, applyVersionedMigrations } from '../db/migrate.js';

let _db;

export function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    applyMigrations(_db);
    applyVersionedMigrations(_db);
  }
  return _db;
}

// Lazy proxy — opens DB on first access, binds methods to real instance.
export const db = new Proxy({}, {
  get(_, prop) {
    const instance = getDb();
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

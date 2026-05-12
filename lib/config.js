import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { randomBytes } from 'crypto';

const DATA_DIR = join(homedir(), '.artifact-portal');
const FILES_DIR = join(DATA_DIR, 'files');
const THUMBS_DIR = join(DATA_DIR, 'thumbs');
const LOGS_DIR = join(DATA_DIR, 'logs');
const VERSIONS_DIR = join(DATA_DIR, 'versions');
const ENV_FILE = join(DATA_DIR, '.env');
const DB_PATH = join(DATA_DIR, 'db.sqlite');

function ensureDirs() {
  mkdirSync(DATA_DIR, { recursive: true });
  mkdirSync(FILES_DIR, { recursive: true });
  mkdirSync(THUMBS_DIR, { recursive: true });
  mkdirSync(LOGS_DIR, { recursive: true });
  mkdirSync(VERSIONS_DIR, { recursive: true });
}

function resolveJwtSecret() {
  ensureDirs(); // belt-and-braces: safe if called before server.js boot
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  let envContent = '';
  if (existsSync(ENV_FILE)) {
    envContent = readFileSync(ENV_FILE, 'utf8');
    const match = envContent.match(/^JWT_SECRET=(.+)$/m);
    if (match) return match[1].trim();
  }

  const secret = randomBytes(32).toString('hex');
  const line = `JWT_SECRET=${secret}\n`;
  writeFileSync(ENV_FILE, envContent + line, 'utf8');
  console.warn('[portal] JWT_SECRET not set — generated and saved to', ENV_FILE);
  return secret;
}

const PORT = parseInt(process.env.PORT || '3000', 10);

export { DATA_DIR, FILES_DIR, THUMBS_DIR, LOGS_DIR, VERSIONS_DIR, DB_PATH, PORT, ensureDirs, resolveJwtSecret };

import { join } from 'path';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { FILES_DIR } from './config.js';

export { FILES_DIR as filesDir };

export function pathFor(id) {
  return join(FILES_DIR, `${id}.html`);
}

export function write(id, html) {
  writeFileSync(pathFor(id), html, 'utf8');
}

export function read(id) {
  return readFileSync(pathFor(id), 'utf8');
}

export function remove(id) {
  unlinkSync(pathFor(id));
}

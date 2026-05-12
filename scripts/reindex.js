#!/usr/bin/env node
// Backfills content_text for existing artifacts from files on disk.
// Run once after migration: node scripts/reindex.js

import { db } from '../lib/db.js';
import { stripHtml } from '../lib/strip-html.js';
import { pathFor } from '../lib/files.js';
import { readFileSync, existsSync } from 'fs';

const rows = db.prepare('SELECT id FROM artifacts WHERE content_text IS NULL AND deleted_at IS NULL').all();
console.log(`Reindexing ${rows.length} artifacts...`);

let done = 0, skipped = 0;
for (const { id } of rows) {
  const path = pathFor(id);
  if (!existsSync(path)) { skipped++; continue; }
  const html = readFileSync(path, 'utf8');
  const content_text = stripHtml(html);
  db.prepare('UPDATE artifacts SET content_text = ? WHERE id = ?').run(content_text, id);
  done++;
}

console.log(`Done: ${done} reindexed, ${skipped} skipped (file missing).`);

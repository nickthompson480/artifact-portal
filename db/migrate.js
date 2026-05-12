import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Split SQL into individual statements, correctly handling
// BEGIN...END blocks (used in triggers) that contain inner semicolons.
function splitStatements(sql) {
  const statements = [];
  let depth = 0;   // nesting depth inside BEGIN...END
  let current = '';

  for (const line of sql.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--')) {
      current += line + '\n';
      continue;
    }

    const upper = trimmed.toUpperCase();
    if (upper === 'BEGIN' || upper.endsWith(' BEGIN') || upper === 'BEGIN;') {
      depth++;
    }
    if (upper === 'END;' || upper === 'END') {
      depth = Math.max(0, depth - 1);
    }

    current += line + '\n';

    if (depth === 0 && trimmed.endsWith(';')) {
      const stmt = current.trim().replace(/;$/, '').trim();
      if (stmt) statements.push(stmt);
      current = '';
    }
  }

  const remaining = current.trim().replace(/;$/, '').trim();
  if (remaining) statements.push(remaining);

  return statements;
}

export function applyMigrations(db) {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  const statements = splitStatements(sql);

  const run = db.transaction(() => {
    for (const stmt of statements) {
      db.prepare(stmt).run();
    }
  });

  run();
}

export function applyVersionedMigrations(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `).run();

  const migrationsDir = join(__dirname, 'migrations');
  let files;
  try {
    files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
  } catch {
    // Directory doesn't exist or isn't readable — nothing to apply.
    return;
  }

  for (const filename of files) {
    const already = db.prepare('SELECT 1 FROM _migrations WHERE filename = ?').get(filename);
    if (already) continue;

    const sql = readFileSync(join(migrationsDir, filename), 'utf8');

    db.transaction(() => {
      db.exec(sql);
      db.prepare(
        'INSERT INTO _migrations (filename, applied_at) VALUES (?, ?)'
      ).run(filename, new Date().toISOString());
    })();

    process.stderr.write(`[portal] migration applied: ${filename}\n`);
  }
}

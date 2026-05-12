import { mkdirSync, copyFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { db } from './db.js';
import { newId } from './ids.js';
import { pathFor } from './files.js';
import { VERSIONS_DIR } from './config.js';

const MAX_VERSIONS = 5;

export function snapshotVersion(artifactId) {
  const currentPath = pathFor(artifactId);
  if (!existsSync(currentPath)) return; // nothing to snapshot

  const existing = db.prepare(
    'SELECT MAX(version_num) as max_v FROM artifact_versions WHERE artifact_id = ?'
  ).get(artifactId);
  const nextNum = (existing?.max_v ?? 0) + 1;

  const versionDir = join(VERSIONS_DIR, artifactId);
  mkdirSync(versionDir, { recursive: true });
  const versionId = newId();
  const versionPath = join(versionDir, `${versionId}.html`);

  copyFileSync(currentPath, versionPath);

  db.prepare(
    'INSERT INTO artifact_versions (id, artifact_id, version_num, file_path, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(versionId, artifactId, nextNum, versionPath, new Date().toISOString());

  // Prune: keep only the last MAX_VERSIONS
  const toDelete = db.prepare(`
    SELECT id, file_path FROM artifact_versions
    WHERE artifact_id = ?
    ORDER BY version_num DESC
    LIMIT -1 OFFSET ${MAX_VERSIONS}
  `).all(artifactId);

  for (const row of toDelete) {
    try { unlinkSync(row.file_path); } catch (_) {}
    db.prepare('DELETE FROM artifact_versions WHERE id = ?').run(row.id);
  }
}

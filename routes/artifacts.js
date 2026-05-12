import { Router } from 'express';
import { createReadStream, existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { db } from '../lib/db.js';
import { newId } from '../lib/ids.js';
import { write, pathFor } from '../lib/files.js';
import { uniqueSlug } from '../lib/slug.js';
import { generate as generateToken } from '../lib/share-token.js';
import { hash } from '../lib/passwords.js';
import { parseTags, validateCollectionTags, formatArtifact, VALID_CATEGORIES, VALID_VISIBILITIES } from '../lib/validate-artifact.js';
import { THUMBS_DIR } from '../lib/config.js';
import { generateThumbSvg, scheduleThumb } from '../lib/thumb.js';
import { stripHtml } from '../lib/strip-html.js';
import { snapshotVersion } from '../lib/versions.js';
import { dispatch } from '../lib/webhooks.js';

const router = Router();

function byIdOrSlug(idOrSlug) {
  return db.prepare('SELECT * FROM artifacts WHERE (id = ? OR slug = ?) AND deleted_at IS NULL')
    .get(idOrSlug, idOrSlug);
}

function runUpload(req, res) {
  return new Promise((resolve, reject) =>
    upload.single('file')(req, res, (err) => (err ? reject(err) : resolve())),
  );
}

function safeFtsQuery(raw) {
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return '';
  return tokens.map(t => '"' + t.replace(/"/g, '""') + '"').join(' ');
}

function buildListQuery(query, countOnly = false) {
  const { tag, category, q, sort, pinned, visibility, trash } = query;
  const limit = query.limit;
  const offset = query.offset;
  const params = [];
  const conditions = [trash === '1' ? 'a.deleted_at IS NOT NULL' : 'a.deleted_at IS NULL'];

  // FTS5 — sanitize query to avoid SQLITE_ERROR on operator chars
  const ftsQuery = q ? safeFtsQuery(q) : '';
  const ftsJoin = ftsQuery ? 'JOIN artifacts_fts f ON a.rowid = f.rowid' : '';

  if (ftsQuery) {
    conditions.push('f.artifacts_fts MATCH ?');
    params.push(ftsQuery);
  }
  // EXISTS avoids duplicate rows that a JOIN json_each would produce
  if (tag) {
    conditions.push('EXISTS (SELECT 1 FROM json_each(a.tags) WHERE value = ?)');
    params.push(tag);
  }
  if (category) { conditions.push('a.category = ?'); params.push(category); }
  if (pinned !== undefined && pinned !== '') {
    conditions.push('a.pinned = ?');
    params.push(pinned === '1' ? 1 : 0);
  }
  if (visibility) { conditions.push('a.visibility = ?'); params.push(visibility); }

  const where = 'WHERE ' + conditions.join(' AND ');

  if (countOnly) {
    return { sql: `SELECT COUNT(*) AS total FROM artifacts a ${ftsJoin} ${where}`, params };
  }

  const sortMap = {
    newest: 'a.created_at DESC',
    oldest: 'a.created_at ASC',
    alpha: 'a.slug ASC',
    size: 'a.file_size DESC',
  };
  const orderBy = ftsQuery ? 'rank' : (sortMap[sort] || 'a.created_at DESC');
  const lim = Math.min(parseInt(limit, 10) || 100, 500);
  const off = parseInt(offset, 10) || 0;

  return {
    sql: `SELECT a.*, (SELECT COUNT(*) FROM artifact_views WHERE artifact_id = a.id) as view_count FROM artifacts a ${ftsJoin} ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    params: [...params, lim, off],
    limit: lim,
    offset: off,
  };
}

// GET /artifacts
router.get('/artifacts', requireAuth, (req, res) => {
  const countQ = buildListQuery(req.query, true);
  const listQ = buildListQuery(req.query);
  const { total } = db.prepare(countQ.sql).get(...countQ.params);
  const rows = db.prepare(listQ.sql).all(...listQ.params);
  return res.json({ artifacts: rows.map(formatArtifact), total, limit: listQ.limit, offset: listQ.offset });
});

// POST /artifacts (owner upload)
router.post('/artifacts', requireAuth, async (req, res) => {
  try {
    await runUpload(req, res);
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ code: 'FILE_TOO_LARGE' });
    if (err.code === 'INVALID_FILE_TYPE') return res.status(415).json({ code: 'INVALID_FILE_TYPE' });
    throw err;
  }

  if (!req.file) return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'file' } });

  const body = req.body ?? {};
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title || title.length > 200) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'title' } });
  }

  const category = body.category || 'other';
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'category' } });
  }

  const visibility = body.visibility || 'private';
  if (!VALID_VISIBILITIES.includes(visibility)) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'visibility' } });
  }

  let description = null;
  if (body.description !== undefined && body.description !== '') {
    if (typeof body.description !== 'string' || body.description.length > 2000) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'description' } });
    }
    description = body.description;
  }

  const tags = parseTags(body.tags);
  const id = newId();
  const slug = uniqueSlug(title);
  const html = req.file.buffer.toString('utf8');
  const content_text = stripHtml(html);
  const now = new Date().toISOString();
  const filePath = pathFor(id);

  const row = db.prepare(`
    INSERT INTO artifacts
      (id, title, slug, description, tags, category, visibility, file_path, file_size, published_by, content_text, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).get(id, title, slug, description, JSON.stringify(tags), category, visibility,
    filePath, req.file.buffer.length, 'manual', content_text, now, now);

  try {
    write(id, html);
  } catch (err) {
    db.prepare('DELETE FROM artifacts WHERE id = ?').run(id);
    throw err;
  }

  scheduleThumb(row);
  dispatch('artifact.created', row);
  return res.status(201).json(formatArtifact(row));
});

// GET /artifacts/:id
router.get('/artifacts/:id', requireAuth, (req, res) => {
  const row = byIdOrSlug(req.params.id);
  if (!row) return res.status(404).json({ code: 'NOT_FOUND' });
  db.prepare(
    "INSERT INTO artifact_views (id, artifact_id, source, viewed_at) VALUES (?, ?, 'owner', ?)"
  ).run(newId(), row.id, new Date().toISOString());
  const viewCount = db.prepare(
    'SELECT COUNT(*) as count FROM artifact_views WHERE artifact_id = ?'
  ).get(row.id);
  return res.json(formatArtifact({ ...row, view_count: viewCount?.count ?? 0 }));
});

// GET /artifacts/:id/views
router.get('/artifacts/:id/views', requireAuth, (req, res) => {
  const count = db.prepare(
    'SELECT COUNT(*) as count FROM artifact_views WHERE artifact_id = (SELECT id FROM artifacts WHERE (id = ? OR slug = ?) AND deleted_at IS NULL)'
  ).get(req.params.id, req.params.id);
  return res.json({ artifact_id: req.params.id, view_count: count?.count ?? 0 });
});

// GET /artifacts/:id/versions
router.get('/artifacts/:id/versions', requireAuth, (req, res) => {
  const row = byIdOrSlug(req.params.id);
  if (!row) return res.status(404).json({ code: 'NOT_FOUND' });
  const versions = db.prepare(
    'SELECT id, version_num, created_at FROM artifact_versions WHERE artifact_id = ? ORDER BY version_num DESC'
  ).all(req.params.id);
  return res.json({ versions });
});

// GET /artifacts/:id/thumb
router.get('/artifacts/:id/thumb', requireAuth, (req, res) => {
  const row = byIdOrSlug(req.params.id);
  if (!row) return res.status(404).end();
  const thumbPath = join(THUMBS_DIR, `${row.id}.svg`);
  if (!existsSync(thumbPath)) {
    const tags = JSON.parse(row.tags || '[]');
    const svg = generateThumbSvg({ ...row, tags });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(svg);
  }
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  createReadStream(thumbPath).pipe(res);
});

// PATCH /artifacts/:id — owner can touch any artifact; slug immutable
router.patch('/artifacts/:id', requireAuth, async (req, res) => {
  try {
    await runUpload(req, res);
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ code: 'FILE_TOO_LARGE' });
    if (err.code === 'INVALID_FILE_TYPE') return res.status(415).json({ code: 'INVALID_FILE_TYPE' });
    throw err;
  }

  const row = byIdOrSlug(req.params.id);
  if (!row) return res.status(404).json({ code: 'NOT_FOUND' });

  const body = req.body ?? {};
  const ALLOWED = ['title', 'description', 'tags', 'category', 'visibility', 'pinned'];
  const updates = {};
  for (const field of ALLOWED) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  if (req.file) {
    const html = req.file.buffer.toString('utf8');
    updates.content_text = stripHtml(html);
    updates.file_size = req.file.buffer.length;
    snapshotVersion(req.params.id);
    write(req.params.id, html);
  }

  if (updates.title !== undefined) {
    const t = String(updates.title).trim();
    if (!t || t.length > 200) return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'title' } });
    updates.title = t;
  }
  if (updates.description !== undefined) {
    if (!updates.description) {
      updates.description = null;
    } else if (typeof updates.description !== 'string' || updates.description.length > 2000) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'description' } });
    }
  }
  if (updates.category !== undefined && !VALID_CATEGORIES.includes(updates.category)) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'category' } });
  }
  if (updates.visibility !== undefined && !VALID_VISIBILITIES.includes(updates.visibility)) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'visibility' } });
  }
  if (updates.tags !== undefined) {
    const parsed = parseTags(updates.tags);
    const colErr = validateCollectionTags(parsed);
    if (colErr) return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'tags', message: colErr } });
    updates.tags = JSON.stringify(parsed);
  }
  if (updates.pinned !== undefined) updates.pinned = updates.pinned ? 1 : 0;

  if (Object.keys(updates).length === 0) return res.json(formatArtifact(row));

  updates.updated_at = new Date().toISOString();
  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const updated = db.prepare(`UPDATE artifacts SET ${sets} WHERE id = ? RETURNING *`)
    .get(...Object.values(updates), req.params.id);

  dispatch('artifact.updated', updated);
  return res.json(formatArtifact(updated));
});

// DELETE /artifacts/:id — soft delete
router.delete('/artifacts/:id', requireAuth, (req, res) => {
  const row = byIdOrSlug(req.params.id);
  if (!row) return res.status(404).json({ code: 'NOT_FOUND' });
  const now = new Date().toISOString();
  db.prepare('UPDATE artifacts SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, req.params.id);
  dispatch('artifact.deleted', { ...row, deleted_at: now });
  return res.json({ ok: true });
});

// POST /artifacts/:id/restore
router.post('/artifacts/:id/restore', requireAuth, (req, res) => {
  const row = db.prepare('SELECT id FROM artifacts WHERE id = ? AND deleted_at IS NOT NULL').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'NOT_FOUND' });
  db.prepare('UPDATE artifacts SET deleted_at = NULL, updated_at = ? WHERE id = ?')
    .run(new Date().toISOString(), req.params.id);
  return res.json({ ok: true });
});

// DELETE /artifacts/:id/permanent — requires ?confirm=1
router.delete('/artifacts/:id/permanent', requireAuth, async (req, res) => {
  if (req.query.confirm !== '1') {
    return res.status(400).json({ code: 'CONFIRMATION_REQUIRED', message: 'Pass ?confirm=1 to permanently delete' });
  }
  const row = db.prepare('SELECT * FROM artifacts WHERE id = ? AND deleted_at IS NOT NULL').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'NOT_FOUND' });

  // DB delete first (source of truth) then file delete (tolerate missing file)
  db.prepare('DELETE FROM artifacts WHERE id = ?').run(req.params.id);
  const filePath = pathFor(row.id);
  try { await unlink(filePath); } catch (err) { if (err.code !== 'ENOENT') throw err; }

  return res.json({ ok: true, removed: { id: row.id, file_path: filePath } });
});

// POST /artifacts/:id/share-token
router.post('/artifacts/:id/share-token', requireAuth, async (req, res) => {
  const row = byIdOrSlug(req.params.id);
  if (!row) return res.status(404).json({ code: 'NOT_FOUND' });

  const token = generateToken();
  const body = req.body ?? {};
  let expiresAt = null;
  let passwordHash = null;

  if (body.expires_at) {
    const d = new Date(body.expires_at);
    if (isNaN(d.getTime())) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'expires_at' } });
    }
    expiresAt = d.toISOString();
  }

  if (body.password && typeof body.password === 'string' && body.password.length > 0) {
    // rounds=10: share password is secondary — the 192-bit token provides primary entropy
    passwordHash = await hash(body.password, 10);
  }

  db.prepare(`UPDATE artifacts
    SET share_token = ?, share_expires_at = ?, share_password_hash = ?, updated_at = ?
    WHERE id = ?`).run(token, expiresAt, passwordHash, new Date().toISOString(), req.params.id);

  return res.json({ token, url: `${req.protocol}://${req.get('host')}/share/${token}` });
});

// DELETE /artifacts/:id/share-token
router.delete('/artifacts/:id/share-token', requireAuth, (req, res) => {
  const row = byIdOrSlug(req.params.id);
  if (!row) return res.status(404).json({ code: 'NOT_FOUND' });
  db.prepare(`UPDATE artifacts
    SET share_token = NULL, share_expires_at = NULL, share_password_hash = NULL,
        visibility = 'private', updated_at = ?
    WHERE id = ?`).run(new Date().toISOString(), req.params.id);
  return res.json({ ok: true });
});

// GET /artifacts/:id/file — streamed to iframe (src=) or fetch; frame-ancestors 'self' required for viewer
// Supports ?v=<version_id> to stream a historical version.
router.get('/artifacts/:id/file', requireAuth, (req, res) => {
  const row = byIdOrSlug(req.params.id);
  if (!row) return res.status(404).json({ code: 'NOT_FOUND' });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; frame-ancestors 'self'");

  if (req.query.v) {
    const ver = db.prepare(
      'SELECT file_path FROM artifact_versions WHERE id = ? AND artifact_id = ?'
    ).get(req.query.v, req.params.id);
    if (!ver) return res.status(404).end();
    const stream = createReadStream(ver.file_path);
    stream.on('error', () => res.status(404).end());
    return stream.pipe(res);
  }

  const stream = createReadStream(pathFor(row.id));
  stream.on('error', (err) => {
    if (!res.headersSent) {
      if (err.code === 'ENOENT') return res.status(404).json({ code: 'FILE_MISSING' });
      res.status(500).end();
    }
  });
  stream.pipe(res);
});

export default router;

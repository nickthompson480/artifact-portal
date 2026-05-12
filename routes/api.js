import { Router } from 'express';
import { randomBytes } from 'crypto';
import { requireApiKey } from '../middleware/apiKey.js';
import { upload } from '../middleware/upload.js';
import { db } from '../lib/db.js';
import { newId } from '../lib/ids.js';
import { write, pathFor } from '../lib/files.js';
import { uniqueSlug } from '../lib/slug.js';
import { parseTags, validateCollectionTags, formatArtifact, VALID_CATEGORIES, VALID_VISIBILITIES } from '../lib/validate-artifact.js';
import { scheduleThumb } from '../lib/thumb.js';
import { stripHtml } from '../lib/strip-html.js';
import { dispatch } from '../lib/webhooks.js';
import { snapshotVersion } from '../lib/versions.js';
import { lintContract } from '../lib/contract-linter.js';

const router = Router();
router.use(requireApiKey);

function runUpload(req, res) {
  return new Promise((resolve, reject) =>
    upload.single('file')(req, res, (err) => (err ? reject(err) : resolve())),
  );
}

// POST /api/artifacts
router.post('/artifacts', async (req, res) => {
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
  const colTagError = validateCollectionTags(tags);
  if (colTagError) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: colTagError, detail: { field: 'tags' } });
  }
  const id = newId();
  const slug = uniqueSlug(title);
  const html = req.file.buffer.toString('utf8');
  const content_text = stripHtml(html);
  const now = new Date().toISOString();
  const filePath = pathFor(id);

  // Insert first — if DB fails, no orphan file is created on disk.
  const row = db.prepare(`
    INSERT INTO artifacts
      (id, title, slug, description, tags, category, visibility, file_path, file_size, published_by, content_text, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).get(id, title, slug, description, JSON.stringify(tags), category, visibility,
    filePath, req.file.buffer.length, req.apiKey.name, content_text, now, now);

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

// GET /api/artifacts
// ?include_trashed=true  — include soft-deleted artifacts in results
// ?trashed_only=true     — only soft-deleted artifacts
router.get('/artifacts', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  const offset = parseInt(req.query.offset, 10) || 0;
  const trashedOnly = req.query.trashed_only === 'true';
  const includeAll = req.query.include_trashed === 'true';
  const trashClause = trashedOnly
    ? 'AND deleted_at IS NOT NULL'
    : includeAll ? '' : 'AND deleted_at IS NULL';
  const rows = db.prepare(
    `SELECT * FROM artifacts WHERE published_by = ? ${trashClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  ).all(req.apiKey.name, limit, offset);
  return res.json(rows.map(formatArtifact));
});

// GET /api/artifacts/:id
router.get('/artifacts/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(req.params.id);
  if (!row || row.deleted_at || row.published_by !== req.apiKey.name) {
    return res.status(404).json({ code: 'NOT_FOUND' });
  }
  return res.json(formatArtifact(row));
});

// PATCH /api/artifacts/:id — slug is immutable even when title changes
router.patch('/artifacts/:id', (req, res) => {
  const ct = req.headers['content-type'] ?? '';
  if (ct.includes('multipart/form-data')) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'PATCH does not accept file uploads. To replace artifact content use PUT /api/artifacts/:id/file.',
    });
  }

  const row = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(req.params.id);
  if (!row || row.deleted_at || row.published_by !== req.apiKey.name) {
    return res.status(404).json({ code: 'NOT_FOUND' });
  }

  const body = req.body ?? {};
  const ALLOWED = ['title', 'description', 'tags', 'category', 'visibility', 'pinned'];
  const updates = {};
  for (const field of ALLOWED) {
    if (body[field] !== undefined) updates[field] = body[field];
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
    const parsedTags = parseTags(updates.tags);
    const colTagError = validateCollectionTags(parsedTags);
    if (colTagError) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: colTagError, detail: { field: 'tags' } });
    }
    updates.tags = JSON.stringify(parsedTags);
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

// PUT /api/artifacts/:id/file — replace HTML content in-place; preserves slug, id, metadata
router.put('/artifacts/:id/file', async (req, res) => {
  try {
    await runUpload(req, res);
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ code: 'FILE_TOO_LARGE' });
    if (err.code === 'INVALID_FILE_TYPE') return res.status(415).json({ code: 'INVALID_FILE_TYPE' });
    throw err;
  }

  if (!req.file) return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'file' } });

  const row = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(req.params.id);
  if (!row || row.deleted_at || row.published_by !== req.apiKey.name) {
    return res.status(404).json({ code: 'NOT_FOUND' });
  }

  const html = req.file.buffer.toString('utf8');
  if (req.query.snapshot !== 'false') snapshotVersion(req.params.id);
  write(req.params.id, html);

  const now = new Date().toISOString();
  const updated = db.prepare(
    'UPDATE artifacts SET content_text = ?, file_size = ?, updated_at = ? WHERE id = ? RETURNING *'
  ).get(stripHtml(html), req.file.buffer.length, now, req.params.id);

  scheduleThumb(updated);
  dispatch('artifact.updated', updated);
  return res.json(formatArtifact(updated));
});

// DELETE /api/artifacts/:id — soft delete only
router.delete('/artifacts/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(req.params.id);
  if (!row || row.deleted_at || row.published_by !== req.apiKey.name) {
    return res.status(404).json({ code: 'NOT_FOUND' });
  }
  const now = new Date().toISOString();
  db.prepare('UPDATE artifacts SET deleted_at = ?, updated_at = ? WHERE id = ?')
    .run(now, now, req.params.id);
  dispatch('artifact.deleted', { ...row, deleted_at: now });
  return res.json({ ok: true });
});

// GET /api/artifacts/:id/versions
router.get('/artifacts/:id/versions', (req, res) => {
  const row = db.prepare(
    'SELECT id FROM artifacts WHERE id = ? AND published_by = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.apiKey.name);
  if (!row) return res.status(404).json({ code: 'NOT_FOUND' });
  const versions = db.prepare(
    'SELECT id, version_num, created_at FROM artifact_versions WHERE artifact_id = ? ORDER BY version_num DESC'
  ).all(req.params.id);
  return res.json({ versions });
});

// POST /api/artifacts/:id/restore — restore a soft-deleted artifact; idempotent
router.post('/artifacts/:id/restore', (req, res) => {
  const row = db.prepare('SELECT id, deleted_at, slug FROM artifacts WHERE id = ? AND published_by = ?')
    .get(req.params.id, req.apiKey.name);
  if (!row) return res.status(404).json({ code: 'NOT_FOUND' });
  if (!row.deleted_at) return res.json({ id: row.id, slug: row.slug, deleted_at: null });
  const now = new Date().toISOString();
  db.prepare('UPDATE artifacts SET deleted_at = NULL, updated_at = ? WHERE id = ?').run(now, row.id);
  dispatch('artifact.updated', { ...row, deleted_at: null, updated_at: now });
  return res.json({ id: row.id, slug: row.slug, deleted_at: null });
});

// POST /api/validate
router.post('/validate', async (req, res) => {
  try {
    await runUpload(req, res);
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ code: 'FILE_TOO_LARGE' });
    if (err.code === 'INVALID_FILE_TYPE') return res.status(415).json({ code: 'INVALID_FILE_TYPE' });
    throw err;
  }
  if (!req.file) return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'file' } });

  const html = req.file.buffer.toString('utf8');
  const opts = {
    title: typeof req.body.title === 'string' ? req.body.title.trim() || null : null,
    category: typeof req.body.category === 'string' ? req.body.category : null,
  };

  const result = lintContract(html, opts);
  return res.json(result);
});

// POST /api/artifacts/:id/share
router.post('/artifacts/:id/share', (req, res) => {
  const row = db.prepare('SELECT * FROM artifacts WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!row || row.published_by !== req.apiKey.name) return res.status(404).json({ code: 'NOT_FOUND' });

  const token = randomBytes(24).toString('base64url');
  // Clear any owner-set expiry/password — fresh share semantics on every regeneration.
  db.prepare(`UPDATE artifacts
    SET share_token = ?, visibility = 'unlisted', share_expires_at = NULL, share_password_hash = NULL, updated_at = ?
    WHERE id = ?`).run(token, new Date().toISOString(), req.params.id);

  return res.json({ token, url: `${req.protocol}://${req.get('host')}/share/${token}` });
});

export default router;

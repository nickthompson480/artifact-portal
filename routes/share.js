import { Router } from 'express';
import { createReadStream } from 'fs';
import { compare } from '../lib/passwords.js';
import { db } from '../lib/db.js';
import { pathFor } from '../lib/files.js';
import { passwordGatePage } from '../lib/password-gate.js';

const router = Router();

function streamArtifact(res, id) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; frame-ancestors 'self'");
  const stream = createReadStream(pathFor(id));
  stream.on('error', (err) => {
    if (!res.headersSent) {
      if (err.code === 'ENOENT') return res.status(404).end();
      res.status(500).end();
    }
  });
  stream.pipe(res);
}

// GET /share/:token
router.get('/share/:token', async (req, res) => {
  const row = db.prepare(
    'SELECT * FROM artifacts WHERE share_token = ? AND deleted_at IS NULL',
  ).get(req.params.token);
  // Uniform 404 — never reveal whether a token existed or the artifact is private
  if (!row) return res.status(404).end();

  // Expiry checked in JS — avoid sqlite datetime('now') inconsistencies
  if (row.share_expires_at && new Date(row.share_expires_at) < new Date()) {
    return res.status(410).end();
  }

  if (row.share_password_hash) {
    // Coerce to string — Express parses ?p=a&p=b as an array, which bcrypt would stringify as "a,b"
    const pw = typeof req.query.p === 'string' ? req.query.p : '';
    if (!pw) {
      return res.status(401).type('html').send(passwordGatePage(req.path));
    }
    const ok = await compare(pw, row.share_password_hash);
    if (!ok) {
      return res.status(401).type('html').send(passwordGatePage(req.path, { error: true }));
    }
  }

  streamArtifact(res, row.id);
});

// GET /p/:slug — public artifacts only; 404 even if exists-but-private (no 403 leak)
router.get('/p/:slug', (req, res) => {
  const row = db.prepare(
    "SELECT id FROM artifacts WHERE slug = ? AND visibility = 'public' AND deleted_at IS NULL",
  ).get(req.params.slug);
  if (!row) return res.status(404).end();
  streamArtifact(res, row.id);
});

// GET /public — JSON index of all public artifacts (gated by setting)
router.get('/public', (_req, res) => {
  const setting = db.prepare("SELECT value FROM settings WHERE key = 'public_index_enabled'").get();
  if (!setting || setting.value !== 'true') return res.status(404).end();

  const rows = db.prepare(
    "SELECT id, title, slug, description, tags, category, created_at FROM artifacts WHERE visibility = 'public' AND deleted_at IS NULL ORDER BY created_at DESC",
  ).all();

  return res.json({
    artifacts: rows.map(r => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      description: r.description,
      tags: JSON.parse(r.tags || '[]'),
      category: r.category,
      created_at: r.created_at,
      url: `/p/${r.slug}`,
    })),
  });
});

export default router;

import { Router } from 'express';
import { randomBytes } from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { hash } from '../lib/passwords.js';
import { db } from '../lib/db.js';
import { newId } from '../lib/ids.js';

const DEFAULT_WEBHOOK_EVENTS = ['artifact.created', 'artifact.updated', 'artifact.deleted'];

const router = Router();

const SETTINGS_ALLOWLIST = ['portal_title', 'public_index_enabled'];

// GET /settings
router.get('/settings', requireAuth, (_req, res) => {
  const rows = db.prepare(
    `SELECT key, value FROM settings WHERE key IN (${SETTINGS_ALLOWLIST.map(() => '?').join(',')})`,
  ).all(...SETTINGS_ALLOWLIST);
  return res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});

// PATCH /settings
router.patch('/settings', requireAuth, (req, res) => {
  const { key, value } = req.body ?? {};
  if (!SETTINGS_ALLOWLIST.includes(key)) {
    return res.status(400).json({ code: 'INVALID_SETTING_KEY' });
  }
  if (key === 'portal_title') {
    if (typeof value !== 'string' || !value.trim() || value.length > 200) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'value' } });
    }
  }
  if (key === 'public_index_enabled') {
    if (value !== true && value !== false && value !== 'true' && value !== 'false') {
      return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'value' } });
    }
  }
  db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(String(value), key);
  return res.json({ ok: true });
});

// GET /settings/api-keys
router.get('/settings/api-keys', requireAuth, (_req, res) => {
  const rows = db.prepare(
    'SELECT id, name, key_prefix, created_at, last_used_at, revoked_at FROM api_keys ORDER BY created_at DESC',
  ).all();
  return res.json(rows);
});

// POST /settings/api-keys
router.post('/settings/api-keys', requireAuth, async (req, res) => {
  const { name } = req.body ?? {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'name' } });
  }
  const trimmedName = name.trim();

  // Name uniqueness among active keys — name is the ownership namespace for published_by
  const existing = db.prepare(
    'SELECT 1 FROM api_keys WHERE name = ? AND revoked_at IS NULL',
  ).get(trimmedName);
  if (existing) return res.status(409).json({ code: 'NAME_TAKEN' });

  const key = 'pk_live_' + randomBytes(24).toString('base64url').slice(0, 32);
  // 12-char prefix: 'pk_live_' (8) + 4 random chars — matches requireApiKey middleware slice(0,12)
  const keyPrefix = key.slice(0, 12);
  // rounds=10: API key is 192-bit random — brute force impossible regardless of cost factor
  const keyHash = await hash(key, 10);
  const id = newId();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO api_keys (id, name, key_hash, key_prefix, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, trimmedName, keyHash, keyPrefix, now);

  return res.status(201).json({ id, name: trimmedName, key_prefix: keyPrefix, key }); // plaintext shown once
});

// DELETE /settings/api-keys/:id
router.delete('/settings/api-keys/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT id FROM api_keys WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'NOT_FOUND' });
  db.prepare('UPDATE api_keys SET revoked_at = ? WHERE id = ?')
    .run(new Date().toISOString(), req.params.id);
  return res.json({ ok: true });
});

// GET /settings/webhooks — list all webhooks (secret omitted)
router.get('/settings/webhooks', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT id, url, events, created_at, last_triggered_at, last_status FROM webhooks ORDER BY created_at DESC').all();
  return res.json(rows.map(r => ({ ...r, events: JSON.parse(r.events || '[]') })));
});

// POST /settings/webhooks — register a new webhook
router.post('/settings/webhooks', requireAuth, (req, res) => {
  const { url, secret, events } = req.body ?? {};

  let parsedUrl;
  try { parsedUrl = new URL(url); } catch {
    return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'url', message: 'url must be a valid https:// URL' } });
  }
  if (!url || typeof url !== 'string' || parsedUrl.protocol !== 'https:') {
    return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'url', message: 'url must start with https://' } });
  }
  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'secret' } });
  }

  const resolvedEvents = Array.isArray(events) && events.length > 0 ? events : DEFAULT_WEBHOOK_EVENTS;
  const VALID_EVENTS = ['artifact.created', 'artifact.updated', 'artifact.deleted'];
  for (const e of resolvedEvents) {
    if (!VALID_EVENTS.includes(e)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'events', message: `Unknown event: ${e}` } });
    }
  }

  const count = db.prepare('SELECT COUNT(*) AS n FROM webhooks').get();
  if (count.n >= 5) {
    return res.status(400).json({ code: 'LIMIT_REACHED', message: 'Maximum of 5 webhooks allowed' });
  }

  const id = newId();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO webhooks (id, url, secret, events, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, url.trim(), secret.trim(), JSON.stringify(resolvedEvents), now);

  return res.status(201).json({
    id,
    url: url.trim(),
    secret: secret.trim(), // shown once
    events: resolvedEvents,
    created_at: now,
    last_triggered_at: null,
    last_status: null,
  });
});

// DELETE /settings/webhooks/:id — permanent delete
router.delete('/settings/webhooks/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT id FROM webhooks WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'NOT_FOUND' });
  db.prepare('DELETE FROM webhooks WHERE id = ?').run(req.params.id);
  return res.json({ ok: true });
});

export default router;

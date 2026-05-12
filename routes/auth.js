import { Router } from 'express';
import { hash, compare } from '../lib/passwords.js';
import { sign, verify } from '../lib/tokens.js';
import { db } from '../lib/db.js';

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: false,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const CLEAR_OPTS = { httpOnly: true, sameSite: 'lax', secure: false, path: '/' };

function getPasswordHash() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'password_hash'").get();
  return row?.value || '';
}

// POST /setup — first-run only; 410 if already set up.
router.post('/setup', async (req, res) => {
  const { password } = req.body ?? {};
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'password' } });
  }
  const hashed = await hash(password, 12);
  // Atomic: only updates when the hash is still empty — prevents race between two simultaneous setup calls.
  const result = db.prepare(
    "UPDATE settings SET value = ? WHERE key = 'password_hash' AND value = ''"
  ).run(hashed);
  if (result.changes === 0) {
    return res.status(410).json({ code: 'ALREADY_SETUP' });
  }
  return res.json({ ok: true });
});

// POST /login
router.post('/login', async (req, res) => {
  const passwordHash = getPasswordHash();
  if (!passwordHash) return res.status(400).json({ code: 'NOT_SETUP' });
  const { password } = req.body ?? {};
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ code: 'VALIDATION_ERROR', detail: { field: 'password' } });
  }
  const ok = await compare(password, passwordHash);
  if (!ok) return res.status(401).json({ code: 'INVALID_PASSWORD' });
  const token = sign({ role: 'owner' });
  res.cookie('auth_token', token, COOKIE_OPTS);
  return res.json({ ok: true });
});

// POST /logout
router.post('/logout', (_req, res) => {
  res.clearCookie('auth_token', CLEAR_OPTS);
  return res.json({ ok: true });
});

// GET /me — intentionally no requireAuth middleware.
// Returns setup/login state so the SPA can route on boot without triggering a redirect.
// Responses:
//   { ok: true }                    — valid cookie, logged in
//   { ok: false, setup: true }      — no password set (first run)
//   { ok: false, setup: false }     — password set, not logged in
router.get('/me', (req, res) => {
  const token = req.cookies?.auth_token;
  if (token) {
    try {
      verify(token);
      return res.json({ ok: true });
    } catch {
      // Token present but invalid — clear the stale cookie and fall through.
      res.clearCookie('auth_token', CLEAR_OPTS);
    }
  }
  const passwordHash = getPasswordHash();
  if (!passwordHash) return res.json({ ok: false, setup: true });
  return res.json({ ok: false, setup: false });
});

export default router;

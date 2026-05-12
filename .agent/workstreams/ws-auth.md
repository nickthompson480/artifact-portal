---
id: ws-auth
title: Owner login + JWT cookie, agent X-API-Key middleware, first-run setup
state: pending
depends_on: [ws-server-core]
summary: All authentication primitives — owner password+JWT, agent X-API-Key bcrypt compare, first-run /setup, requireAuth and requireApiKey middlewares.
phase: 1
---

## What done looks like

- `POST /setup` (only when `settings.password_hash` is empty): body `{ password }` → bcrypt(password, 12) → stored. Returns `{ ok: true }`. Subsequent calls return `410 Gone`.
- `POST /login` body `{ password }`: bcrypt.compare against `settings.password_hash`. On match, sign JWT `{ role: 'owner', iat, exp }` with `JWT_SECRET`, 7-day expiry. Set cookie `auth_token` (HttpOnly, SameSite=Lax, path `/`, Secure=false). Response: `{ ok: true }`.
- `POST /logout`: clear cookie. Response: `{ ok: true }`.
- `GET /me`: behind requireAuth, returns `{ ok: true }`.
- Middleware `requireAuth`: reads `req.cookies.auth_token`, verifies JWT, attaches `req.user = payload`. On failure → `401 { code: 'UNAUTHORIZED' }`.
- Middleware `requireApiKey`: reads `req.headers['x-api-key']`. Iterates `api_keys WHERE revoked_at IS NULL`. `bcrypt.compare(incoming, row.key_hash)` until one matches. On match → update `last_used_at = now()`, attach `req.apiKey = { id, name }`, call next. On no-match → `401 { code: 'INVALID_API_KEY' }`.
- The agent middleware MUST NOT log the incoming key value.

## Key files

- `routes/auth.js` — `/setup`, `/login`, `/logout`, `/me`.
- `middleware/auth.js` — `requireAuth(req,res,next)`.
- `middleware/apiKey.js` — `requireApiKey(req,res,next)`.
- `lib/passwords.js` — `hash(pw)`, `compare(pw, hash)` (bcrypt wrappers; rounds=12).
- `lib/tokens.js` — `sign(payload)`, `verify(token)`.

## Acceptance

1. `curl -X POST -H 'Content-Type: application/json' -d '{"password":"hunter2"}' http://127.0.0.1:3000/setup` → ok. Repeat → 410.
2. `curl -X POST -H 'Content-Type: application/json' -d '{"password":"hunter2"}' -c cookies.txt http://127.0.0.1:3000/login` → ok + sets cookie.
3. `curl -b cookies.txt http://127.0.0.1:3000/me` → ok.
4. `curl http://127.0.0.1:3000/me` (no cookie) → 401.
5. A test script can: create an API key (next ws), then POST artifacts via `X-API-Key` and read them back.

## Rule cross-refs

- `api-keys-never-plain`: confirm no log line includes the plaintext key.

## Out of scope

- Rate limiting on /login (could add 5/min later — not P1)
- Password reset flow — single user, file-edit recovery is fine.

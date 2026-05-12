---
id: ws-owner-api
title: Owner CRUD routes — full artifact management, settings, API key admin
state: pending
depends_on: [ws-auth]
summary: All `/artifacts/*`, `/settings/*`, and `/settings/api-keys/*` routes behind cookie auth. List/filter/sort, soft delete + restore + permanent, share-token mgmt, file streaming.
phase: 1
---

## What done looks like

All routes under `requireAuth` (cookie). See SPEC §6.1 for the table; key behaviors:

### `GET /artifacts`

Query parameters (all optional):
- `tag` — filter to artifacts containing this tag in their tags JSON.
- `category` — exact match.
- `q` — FTS5 query against `artifacts_fts`. Title-only initially is acceptable; full FTS query landed in this workstream.
- `sort` — `newest` (default) | `oldest` | `alpha` | `size`.
- `pinned` — `0` | `1` to filter.
- `visibility` — `private`|`unlisted`|`public` exact match.
- `trash` — `1` to show only soft-deleted; default excludes them.
- `limit` (default 100, max 500), `offset` (default 0).

Response: `{ artifacts: [...], total, limit, offset }`. Each artifact row has tags parsed from JSON, file URL `'/artifacts/<id>/file'`.

### `POST /artifacts`

Same multipart contract as the agent `POST /api/artifacts`. `published_by` defaults to `'manual'`.

### `GET /artifacts/:id`

Single row. 404 if missing.

### `PATCH /artifacts/:id`

Partial update: title (re-derives slug, collision suffix), description, tags, category, visibility, pinned. Updates `updated_at`.

### `DELETE /artifacts/:id`

Soft delete only — sets `deleted_at = now()`. File stays on disk. (See rule `soft-delete-default`.)

### `POST /artifacts/:id/restore`

Clears `deleted_at`.

### `DELETE /artifacts/:id/permanent`

Requires `?confirm=1`. Removes row AND file (`fs.unlink(filePath)` — must tolerate file already-missing). Returns `{ ok: true, removed: { id, file_path } }`.

### `POST /artifacts/:id/share-token`

Generates new 32-char share token (URL-safe). Optional body: `{ expires_at, password }`. Returns `{ token, url }`. Replaces any prior token.

### `DELETE /artifacts/:id/share-token`

Sets share_token = NULL, share_expires_at = NULL, share_password_hash = NULL, visibility = 'private'.

### `GET /artifacts/:id/file`

Streams the raw HTML with `Content-Type: text/html; charset=utf-8`. Sets `Content-Security-Policy: default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; frame-ancestors 'self'` (defense-in-depth — the iframe sandbox is the real isolation).

### Settings

- `GET /settings` → all rows except `password_hash`.
- `PATCH /settings` → `{ key, value }`. Whitelist: `portal_title`, `public_index_enabled`. Reject anything else.

### API key admin

- `GET /settings/api-keys` → `[{ id, name, key_prefix, created_at, last_used_at, revoked_at }]`.
- `POST /settings/api-keys` body `{ name }` → generate `pk_live_<32 url-safe chars>`, bcrypt, insert. Return `{ id, name, key_prefix, key: 'pk_live_...' }`. **One-time plaintext** (see rule `api-keys-never-plain`).
- `DELETE /settings/api-keys/:id` → set `revoked_at = now()`.

## Key files

- `routes/artifacts.js`
- `routes/settings.js`
- `lib/share-token.js` (`crypto.randomBytes(24).toString('base64url')`)

## Acceptance

1. After Phase-1 seed: `curl -b cookies.txt 'http://127.0.0.1:3000/artifacts?sort=newest&limit=10'` returns 10 newest.
2. `?tag=q2` filters correctly; `?category=spec` filters correctly.
3. `?q=payment` (FTS5) returns the Payment Gateway artifacts.
4. Soft delete → row hidden from default list; `?trash=1` shows it; restore brings it back.
5. `?confirm=1` permanent delete removes file + row; running it without `?confirm=1` returns 400.
6. Share token round-trip works: POST → token → DELETE → null.
7. Creating an API key returns plaintext once; listing keys never includes plaintext.

## Out of scope

- Index page / SPA serving (handled by ws-frontend-shell / server.js static mount)
- Public share routes (ws-public-routes)

---
id: ws-public-routes
title: Public unauthenticated routes — /share/:token, /p/:slug, /public
state: pending
depends_on: [ws-owner-api]
summary: The three routes that serve artifacts without authentication. Includes share-token validation, slug lookup for public artifacts, and optional /public index.
phase: 1
---

## What done looks like

### `GET /share/:token`

- Look up artifact by `share_token` (case-sensitive).
- 404 if not found, soft-deleted, or revoked (token = NULL).
- 410 if `share_expires_at` is past `now()`.
- If `share_password_hash` is set:
  - Without `?p=` query: render a minimal password gate (HTML), 401.
  - With `?p=<password>`: bcrypt.compare; on success serve artifact, on failure 401.
- Otherwise stream artifact HTML (same headers as `/artifacts/:id/file`).
- Increment a future view-counter when ws-analytics lands (no-op for now).

### `GET /p/:slug`

- Look up artifact by `slug`.
- 404 if not found, soft-deleted, or `visibility != 'public'`.
- Stream artifact HTML.

### `GET /public`

- If `settings.public_index_enabled != 'true'` → 404.
- Else: return JSON `{ artifacts: [{ id, title, slug, description, tags, category, created_at, url }] }` for all public, non-deleted artifacts. Sorted by `created_at DESC`.
- Optional bonus (low priority): `GET /public/index.html` renders the same data as a styled HTML page using the portal tokens. If skipped, leave a TODO and JSON is sufficient.

### Common

- All three routes must work without any cookies / headers.
- All three must NOT leak existence of private artifacts (return 404 uniformly, not 403 distinguishing).
- Same security headers on streamed HTML as `/artifacts/:id/file`.

## Key files

- `routes/share.js`
- `lib/password-gate.js` (small html template for the password gate)

## Acceptance

1. With a public artifact at slug `payment-gateway-integration-spec` and `public_index_enabled=true`:
   - `curl http://127.0.0.1:3000/p/payment-gateway-integration-spec` returns HTML.
   - `curl http://127.0.0.1:3000/public` returns it in JSON.
2. Set the same artifact private → both routes return 404.
3. Generate a share token → `curl http://127.0.0.1:3000/share/<token>` returns HTML.
4. Revoke → 404.
5. Set `public_index_enabled=false` → `/public` returns 404.

## Out of scope

- View counter / analytics (ws-analytics)
- Embedding referrer headers / signing requests

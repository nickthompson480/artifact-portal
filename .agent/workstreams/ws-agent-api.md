---
id: ws-agent-api
title: Agent REST API for publishing artifacts
state: pending
depends_on: [ws-auth]
summary: All `/api/artifacts/*` routes protected by X-API-Key. Multipart upload, list/get/patch/delete, share-token convenience endpoint.
phase: 1
---

## What done looks like

All routes mounted on `routes/api.js` under `/api`, all gated by `requireApiKey`:

| Method | Route | Behavior |
|---|---|---|
| POST | `/api/artifacts` | multipart/form-data. Fields: `file` (HTML), `title` (required), `description`, `tags` (JSON array or CSV), `category`, `visibility`, `published_by`. Validates, generates UUID + slug, writes file to `~/.artifact-portal/files/<uuid>.html`, inserts row, returns full artifact. |
| GET | `/api/artifacts` | List artifacts where `published_by = req.apiKey.name` (or owned by this key). Supports `?limit`, `?offset`. |
| GET | `/api/artifacts/:id` | Single artifact (own only — 404 if not owned by this key). |
| PATCH | `/api/artifacts/:id` | Partial update (own only): title, description, tags, category, visibility, pinned. Re-runs slug derivation if title changes (with collision suffix). |
| DELETE | `/api/artifacts/:id` | Soft delete: sets `deleted_at` (own only). File stays on disk. |
| PUT | `/api/artifacts/:id/file` | Replace HTML content in-place. Preserves slug, id, and metadata. Snapshots previous version by default; pass `?snapshot=false` to skip. Triggers FTS reindex, thumbnail regen, and webhooks. |
| POST | `/api/artifacts/:id/share` | Convenience: sets visibility=unlisted, generates 32-char share token, returns `{ token, url: '<base>/share/<token>' }`. |

### Validation rules

- `title`: required, max 200 chars, trimmed.
- `tags`: array of strings, max 12, each max 32 chars, lowercased.
- `category`: must be in `('spec','report','prototype','review','other')`. Default `other`.
- `visibility`: must be in `('private','unlisted','public')`. Default `private`.
- `file`: required, must be HTML (`Content-Type: text/html` or filename ending `.html`), max 10MB.
- `published_by`: optional; defaults to `req.apiKey.name`.

### Slug derivation

`slug = lower(title).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)`. On collision, append `-2`, `-3`, … until unique. Implemented in `lib/slug.js`.

### Errors

- 400 `VALIDATION_ERROR` with `detail.field`
- 401 `INVALID_API_KEY` (from middleware)
- 404 `NOT_FOUND` for missing or non-owned artifacts
- 413 `FILE_TOO_LARGE` for > 10MB

## Key files

- `routes/api.js`
- `middleware/upload.js` — multer config: memory storage, 10MB limit, file filter for `text/html`.
- `lib/slug.js`
- `lib/files.js` — writes file in chunks if needed.

## Acceptance

1. Helper script `scripts/seed.js` uses `pk_live_...` to publish 50 artifacts (drawn from `IMPORTS/personal-web/project/portal-data.js` data + the four `makeSpecDoc / makeReportDoc / makeProtoDoc / makeReviewDoc` HTML generators) → succeeds.
2. `curl -H "X-API-Key: $K" http://127.0.0.1:3000/api/artifacts` returns the 50.
3. Files exist at `~/.artifact-portal/files/*.html` matching the row count.
4. `DELETE /api/artifacts/:id` sets `deleted_at`; subsequent `GET /api/artifacts/:id` returns 404; file is still on disk.

## Out of scope

- Versioning when same slug re-published (deferred to ws-version-history)
- Webhooks (ws-webhooks)
- Owner-side cross-agent reads (handled by ws-owner-api)

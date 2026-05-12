# Artifact Portal — Claude Code Guide

A self-hosted web portal where AI agents publish HTML artifacts (specs, reports, prototypes, code reviews, dashboards) via a REST API. The owner browses, tags, shares, and manages them through a dark-themed React SPA.

**Single user. Single machine. No managed cloud services.**

## Stack

```
Runtime:     Node.js 20 LTS
Server:      Express 5
Database:    SQLite (better-sqlite3) with FTS5
Auth:        bcryptjs + jsonwebtoken (httpOnly cookie, 7-day expiry)
Agent auth:  X-API-Key header (bcrypt-hashed keys in DB)
File store:  ~/.artifact-portal/files/<uuid>.html
Frontend:    React 18 + React Router 6 + Vite
```

## How to run (development)

```bash
# Backend (auto-restart on changes)
node --watch server.js
# or: npx nodemon server.js

# Frontend (Vite dev server with HMR, proxies API to :3000)
cd frontend && npm run dev
```

Visit `http://localhost:5173` during dev. The built SPA is served by Express on `http://localhost:3000`.

## How to run (production)

```bash
cd frontend && npm run build && cd ..
node server.js
# Visit http://localhost:3000
```

On macOS you can auto-start with launchd — see the `launchd` section in `SPEC.md`.

## Data paths

| Path | Contents |
|---|---|
| `~/.artifact-portal/db.sqlite` | All metadata (artifacts, api_keys, settings) |
| `~/.artifact-portal/files/<uuid>.html` | Raw artifact HTML files |
| `~/.artifact-portal/.env` (optional) | `JWT_SECRET`, `PORT` overrides |

The server creates `~/.artifact-portal/` on first run if missing.

## Environment variables

```
PORT=3000                # default
JWT_SECRET=<random>      # generated and stored on first run if absent
DB_PATH=~/.artifact-portal/db.sqlite
FILES_DIR=~/.artifact-portal/files
```

## Project layout

```
artifact-portal/
├── server.js                  # Express entry
├── package.json
├── db/
│   ├── schema.sql             # Full DDL
│   └── migrate.js             # Idempotent migration runner
├── routes/                    # auth, artifacts, api (agents), share, settings, export
├── middleware/                # auth.js, apiKey.js, upload.js, error.js
├── lib/                       # db.js, files.js, slug.js, versions.js, webhooks.js, ...
├── scripts/                   # reindex.js (FTS backfill), smoke tests, contract linter test
├── public/                    # Vite build output (served by Express — gitignored)
└── frontend/
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── styles/colors_and_type.css   # design tokens — source of truth
        ├── data/api.js
        ├── components/
        └── views/
```

## Agent API (publishing artifacts)

Agents publish artifacts via `POST /api/artifacts` with an `X-API-Key` header. Create API keys in the Settings page — the key is shown exactly once at creation.

```bash
curl -X POST http://localhost:3000/api/artifacts \
  -H "X-API-Key: ap_<your-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Report",
    "html": "<html>...</html>",
    "tags": ["report"],
    "visibility": "private"
  }'
```

See `routes/api.js` for the full surface (list, get, update metadata, replace file, delete).

To replace an artifact's HTML without changing its slug: `PUT /api/artifacts/:id/file`.

## HTML artifact design contract

Artifacts rendered in the viewer are sandboxed (`sandbox="allow-scripts"`, no `allow-same-origin`). The portal sends the current theme via `postMessage`:

```js
// In your artifact's IIFE — request the theme synchronously on load
(function () {
  window.parent.postMessage({ type: 'portal:theme:request' }, '*');
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'portal:theme') {
      document.documentElement.setAttribute('data-scheme', e.data.theme);
    }
  });
})();
```

Use `[data-scheme="dark"]` / `[data-scheme="light"]` CSS selectors for adaptive color — not `@media (prefers-color-scheme)`, which is blocked in sandboxed iframes.

## Design rules

- All colors, spacing, and typography come from `frontend/src/styles/colors_and_type.css` — no hardcoded hex values in components.
- Viewer iframe must use `sandbox="allow-scripts"` (no `allow-same-origin`).
- Deletes are soft by default; hard-delete requires the explicit `/permanent` route.
- API keys are stored as bcrypt hashes only; plaintext is shown once at creation.

## Architectural decisions

See `.agent/decisions/` for documented choices (slug URLs, SQLite over Postgres, soft deletes, postMessage theme protocol, and more).

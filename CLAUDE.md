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

# Frontend (Vite dev server with HMR, proxies API to :4567)
cd frontend && npm run dev
```

Visit `http://localhost:5173` during dev. The built SPA is served by Express on `http://localhost:4567`.

## How to run (production)

```bash
npm install
cd frontend && npm install && npm run build && cd ..
node server.js
# Visit http://localhost:4567
```

On macOS you can auto-start with a launchd plist — see the example in `README.md`.

## Data paths

| Path | Contents |
|---|---|
| `~/.artifact-portal/db.sqlite` | All metadata (artifacts, api_keys, settings) |
| `~/.artifact-portal/files/<uuid>.html` | Raw artifact HTML files |
| `~/.artifact-portal/.env` (optional) | `JWT_SECRET`, `PORT` overrides |

The server creates `~/.artifact-portal/` on first run if missing.

## Environment variables

```
PORT=4567                # default
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

## Publishing artifacts (for AI agents)

If you are an AI agent working in this repo and need to publish to the portal, the canonical instructions live in `skills/artifact-portal/`. Load them before generating HTML or calling the API:

@skills/artifact-portal/SKILL.md

`SKILL.md` covers the full agent REST API (publish, update, delete, validate, share, version history), authentication, error codes, and the publish workflow. It references two companions you should load on demand when relevant:

- `skills/artifact-portal/design-contract.md` — the 11 hard requirements and strong recommendations every published HTML artifact must satisfy. Load this before generating or editing HTML.
- `skills/artifact-portal/reference.md` — non-prescriptive catalog of fonts, icon sets, JS libraries, and CDNs known to work in the sandboxed iframe. Load this when picking external resources.

Starter templates for the four categories (`spec`, `report`, `review`, `prototype`) are in `skills/artifact-portal/templates/`.

### One-line summary of the design contract

Artifacts run inside `<iframe sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox">` — single self-contained HTML file, opaque background, no horizontal scroll, layout ≤ 1600px, prose ≤ 72ch, body ≥ 16px, `prefers-reduced-motion` guard, `target="_blank" rel="noopener noreferrer"` on external links, no storage/cookies, and an adaptive `[data-scheme]` palette driven by the `portal:theme` postMessage handshake. Full contract is in `design-contract.md`.

## Design rules

- All colors, spacing, and typography come from `frontend/src/styles/colors_and_type.css` — no hardcoded hex values in components.
- Viewer iframe must use `sandbox="allow-scripts"` (no `allow-same-origin`).
- Deletes are soft by default; hard-delete requires the explicit `/permanent` route.
- API keys are stored as bcrypt hashes only; plaintext is shown once at creation.

## Architectural decisions

See `.agent/decisions/` for documented choices (slug URLs, SQLite over Postgres, soft deletes, postMessage theme protocol, and more).

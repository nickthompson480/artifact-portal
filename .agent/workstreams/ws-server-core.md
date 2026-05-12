---
id: ws-server-core
title: Express server skeleton, SQLite init, config loading
state: pending
depends_on: []
summary: Bring up server.js with config, lib/db, schema migration, and the ~/.artifact-portal/ directory layout. No routes yet beyond a health check.
phase: 1
---

## What done looks like

- `node server.js` starts, binds to `127.0.0.1:3000` (or `process.env.PORT`), logs `[portal] listening on http://127.0.0.1:3000`.
- On startup the process ensures `~/.artifact-portal/`, `~/.artifact-portal/files/`, and `~/.artifact-portal/logs/` exist (mkdir -p semantics).
- A `better-sqlite3` connection opens against `~/.artifact-portal/db.sqlite`. If the file is new, `db/schema.sql` is applied. If it exists, schema-creation statements are idempotent (`CREATE TABLE IF NOT EXISTS ...`) so re-running is safe.
- All schema in SPEC §4 exists: `artifacts`, `artifacts_fts` + triggers, `api_keys`, `settings`, indexes, default seed rows for `portal_title`, `public_index_enabled`, `password_hash`.
- `GET /healthz` returns `{ ok: true, db: 'connected', files_dir: '<path>' }`.
- `JWT_SECRET` resolution: env var → else read from `~/.artifact-portal/.env` → else generate a random 32-byte value, persist to `.env`, and log a warning the first time.

## Key files

- `server.js` — express app, mounts `/healthz`, exports `app` for testing.
- `lib/config.js` — resolves data dir, port, JWT_SECRET. Handles `~` expansion.
- `lib/db.js` — exports `db` (better-sqlite3 instance) and `applyMigrations()`.
- `lib/files.js` — `filesDir`, `pathFor(id)`, `write(id, html)`, `read(id)`, `remove(id)`.
- `lib/ids.js` — `newId()` (UUID v4).
- `db/schema.sql` — full DDL.
- `db/migrate.js` — reads schema.sql, splits on `;`, executes each statement.
- `package.json` — `dev`, `start` scripts, deps: `express`, `better-sqlite3`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `multer`, `dotenv`.

## Acceptance

1. `rm -rf ~/.artifact-portal && node server.js` creates the data dir, sqlite file, all tables.
2. `sqlite3 ~/.artifact-portal/db.sqlite '.schema'` lists every table in the spec.
3. Re-running the server doesn't error on the existing DB.
4. `curl http://127.0.0.1:3000/healthz` returns ok JSON.
5. The Express app loads in <300ms warm.

## Out of scope

- Auth, login, real routes (separate workstreams)
- TLS, PM2, any process supervisor

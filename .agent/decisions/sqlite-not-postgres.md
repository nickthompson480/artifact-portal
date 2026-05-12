---
id: sqlite-not-postgres
choice: SQLite (via better-sqlite3) is the database. No Postgres, no MySQL, no managed DB service.
scope: backend, data, infrastructure
date: 2026-05-11
---

## Rationale

The data is single-tenant, single-writer, low-volume (estimated < 10k artifacts over years of use). SQLite handles this trivially:

- Single file at `~/.artifact-portal/db.sqlite` → trivially backed up by Time Machine
- `better-sqlite3` is synchronous, fast (no connection pool overhead), zero-config
- FTS5 ships in the standard SQLite build → full-text search without any external service
- Schema migrations are plain SQL files we apply on startup
- No port to allocate, no daemon to run, no separate process

Postgres would add: a daemon, a connection-pool / driver layer, separate backup story, configuration (`max_connections`, etc.) — none of which the portal needs.

## Alternatives considered

- **Postgres**: justifiable if multi-user / multi-writer / replication needed. None of those apply.
- **JSON file**: tempting for "everything is just one user's data," but loses transactional safety, indexes, and FTS. SQLite gives us all three for the same level of operational simplicity.
- **DuckDB**: optimised for analytics workloads, not transactional. Wrong fit.

## Consequence

- `lib/db.js` exports a single `better-sqlite3` Database instance.
- Schema in `db/schema.sql`, applied via `db/migrate.js` (idempotent `CREATE TABLE IF NOT EXISTS …`).
- Future migrations are additive SQL files numbered `db/migrations/0001-*.sql`, tracked in a `migrations` table.
- All queries are prepared statements via `db.prepare(...)`. No raw string interpolation.
- FTS5 virtual table `artifacts_fts` + triggers handle the full-text path; see SPEC §4.

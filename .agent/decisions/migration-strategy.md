---
id: migration-strategy
type: decision
date: 2026-05-11
choice: versioned migration files tracked in _migrations table
scope: all Phase 5 schema changes
---

## Decision

Use a `_migrations` table to track which named migration files have been applied. Each schema change is a numbered SQL file under `db/migrations/NNNN-name.sql`. On startup, the runner checks which files have already been applied and runs only the new ones in order.

The existing `schema.sql` is NOT converted — it remains the initial schema applied via `IF NOT EXISTS` as before. Migration files are additive: new columns (`ALTER TABLE ... ADD COLUMN`), new tables, new indexes. The runner wraps each file in a transaction.

**Why:** `ALTER TABLE ADD COLUMN` in SQLite is not idempotent (no `IF NOT EXISTS`). Phase 5 adds columns to `artifacts` and creates new tables. We need to apply each exactly once. The `_migrations` table approach is minimal, self-contained, and doesn't require a third-party library.

**How to apply:** Before any Phase 5 schema work, `db/migrations/` must exist and `migrate.js` must call the versioned runner after the initial schema application. Each Phase 5 workstream adds its own migration file.

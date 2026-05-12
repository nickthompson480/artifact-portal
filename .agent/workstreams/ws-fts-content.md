---
id: ws-fts-content
title: Extend FTS5 to index stripped HTML body content
state: pending
depends_on: [ws-agent-api, ws-search-overlay]
summary: Add a `content` column to artifacts_fts and populate it with HTML-stripped artifact body on insert/update. Search overlay then matches against body text, not just metadata.
phase: 5
---

## What done looks like

- Migration adds `content` column to `artifacts_fts` virtual table (drop + recreate, or rebuild).
- New column populated at write time:
  - `lib/strip-html.js`: regex/tokenizer that drops tags, decodes entities, collapses whitespace, limits to 200KB of plain text per artifact.
  - On `POST /artifacts` (both owner + agent): after the file write, compute plain text and store it in a new `artifacts.content_text` column. The FTS trigger picks it up automatically.
- Add a one-shot `db/migrations/0002-fts-content.sql` and a `scripts/reindex.js` that backfills content_text for existing rows.
- Search query unchanged from the API surface; under the hood it now matches body too.
- Optional UI tweak: search result rows show a 1-line content snippet with `<mark>` when the match was in body (not title).

## Acceptance

1. Publish an artifact whose body contains "circular dependency" but whose title doesn't.
2. ⌘K search for "circular dependency" finds it.
3. Reindex script runs to completion on 50 artifacts in <5s.

## Out of scope

- Stemming / synonyms — Porter tokenizer is the SQLite default and that's enough.

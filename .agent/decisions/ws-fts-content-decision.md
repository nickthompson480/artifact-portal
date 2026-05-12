---
id: ws-fts-content-decision
type: decision
date: 2026-05-11
choice: content_text column + simple HTML strip + FTS5 trigger
scope: ws-fts-content
---

## Decision

Add `content_text TEXT` column to `artifacts` table. Populate it with stripped plain-text content (HTML tags removed, entities decoded, truncated at 200KB) on every artifact write. Update the FTS5 triggers to index `content_text` alongside `title`, `description`, and `tags`.

**HTML stripping:** `lib/strip-html.js` uses a regex-based approach: remove `<script>`, `<style>` blocks and their content first, then strip all remaining tags, decode common HTML entities, collapse whitespace, truncate at 200KB.

**Backfill:** `scripts/reindex.js` reads all artifacts from DB, strips HTML from files on disk, updates `content_text`. Run once after migration.

**Why simple regex over a DOM parser:** No `jsdom` dependency. The content is indexed for search, not rendered — regex stripping is sufficient accuracy.

**How to apply:** Migration `0002-fts-content.sql` adds the column and updates FTS5 virtual table definition. After migration, update both `routes/api.js` and `routes/artifacts.js` to populate `content_text` on write.

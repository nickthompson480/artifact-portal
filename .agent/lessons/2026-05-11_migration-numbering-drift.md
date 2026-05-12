---
id: 2026-05-11_migration-numbering-drift
type: lesson
date: 2026-05-11
tags: [sqlite, migrations, sequencing]
workstream: ws-fts-content
routed_to: null
---

## Lesson

Pre-decision docs that specify migration numbers (e.g. "Migration `0002-fts-content.sql`") become wrong when workstreams are implemented in a different order than planned. In this session, ws-analytics created `0004-analytics.sql` before ws-fts-content ran, so fts-content became `0005-fts-content.sql` — not `0002` as the decision doc said.

**Fix:** Never hard-code a migration number in a decision doc or prompt. Instead, tell the agent: "Create the next-numbered migration file — check existing files in `db/migrations/` and increment." The agent applied this correctly by reading the directory first.

**Context:** The migration runner uses lexicographic sort, so actual file numbering matters. A gap or duplicate would cause migrations to be applied out of order or skipped.

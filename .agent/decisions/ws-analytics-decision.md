---
id: ws-analytics-decision
type: decision
date: 2026-05-11
choice: log owner UI views only, no IP storage, cascade delete
scope: ws-analytics
---

## Decision

Log a view event when the owner views an artifact in the Viewer (`GET /artifacts/:id` metadata fetch from the React app, identified by cookie auth). Do NOT log agent API reads (`GET /api/artifacts/:id`).

**No IP storage:** Single-user portal, localhost-only. Storing IP adds no value and creates unnecessary data. The `source` column stores `'owner'` (cookie) or `'public'` (unauthenticated share/slug access).

**Table:** `artifact_views(id TEXT PK, artifact_id TEXT, source TEXT, viewed_at TEXT)` with `FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE`. Hard delete cascades and removes view history. Soft delete preserves it (owner may restore).

**Display:** View count shown on FeedCardRich (compact mono label, `var(--text3)`) and in the Viewer metadata drawer. No counts on BrowseCard (too dense).

**Why owner views only:** Agent reads are programmatic and high-frequency — they'd drown out meaningful engagement signals.

**How to apply:** Migration `0004-analytics.sql`. Record view in `routes/artifacts.js` `GET /artifacts/:id` (requireAuth route). Aggregate count via `SELECT COUNT(*) FROM artifact_views WHERE artifact_id = ?`.

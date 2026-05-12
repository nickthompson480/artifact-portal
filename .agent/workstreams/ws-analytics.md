---
id: ws-analytics
title: View analytics — artifact_views log + per-card view counter
state: pending
depends_on: [ws-public-routes, ws-owner-api]
summary: Log a row to artifact_views every time an artifact is opened (viewer, /share/:token, /p/:slug). Show view count on cards and in the metadata drawer.
phase: 5
---

## Pre-decision required

Open question §13.4:
- Log only authenticated views, or all views (including share/public)?
- Persist IP? (Privacy: it's the owner's portal, but share viewers are external.)
- Default: log all, store source (`owner|share|public`) and only hash-truncated IP for share/public (`sha256(ip).slice(0,16)`) to allow rough uniqueness counts without retaining PII.

## What done looks like

- New table:
  ```sql
  CREATE TABLE artifact_views (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    artifact_id  TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    ts           TEXT NOT NULL,
    source       TEXT NOT NULL CHECK (source IN ('owner','share','public')),
    ip_hash      TEXT
  );
  CREATE INDEX idx_views_artifact_ts ON artifact_views(artifact_id, ts DESC);
  ```
- Hooks:
  - `GET /artifacts/:id` (owner) → source=owner.
  - `GET /share/:token` → source=share + ip_hash.
  - `GET /p/:slug` → source=public + ip_hash.
- New endpoint `GET /artifacts/:id/views` → `{ total, by_source: {owner,share,public}, last_30d_count }`.
- FeedCardRich and BrowseCard show a small `👁 N` next to the size when N > 0.
- Metadata drawer shows total + last-30d count + a stacked source breakdown.

## Acceptance

1. Open artifact in viewer → views table gets one new row with source=owner.
2. Visit a share URL → row with source=share + non-null ip_hash.
3. Cards show view counter; matches DB count.

## Out of scope

- Per-day chart in the viewer (nice-to-have)
- Geo / referrer logging

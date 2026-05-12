---
id: ws-feed-view
title: Feed view — day-grouped river, pinned strip, rich/compact cards
state: pending
depends_on: [ws-design-system]
summary: Implement `<FeedView />` at `/`. Pinned strip on top, day groups (Today=rich, older=compact), collapse/expand, tag filter, empty state.
phase: 2
---

## What done looks like

### Data load
- On mount: `listArtifacts({ sort: 'newest', limit: 500 })` → store in local state.
- Re-fetches when `tagFilter` changes (server-side filter `?tag=`).
- Listens to `store.collapsedDays` for collapse state.

### Layout
- Outer container: `max-width: 760px; margin: 0 auto; padding: 0 0 80px`.
- Pinned strip (only if pinned exist):
  - `<SectionLabel icon="📌" label="Pinned" />` divider above.
  - Stack of `<FeedCardCompact />` rows, gap 1px.
- Day groups (from `groupByDay(unpinnedArtifacts)`):
  - Header: button (full-width left-aligned). DM Serif Display italic.
    - Today: 28px, color `var(--cat-amber)`.
    - Yesterday: 22px, color `var(--text2)`.
    - Older: 18px, color `var(--text2)`.
  - Right-aligned `▾` rotates -90deg when collapsed (transition .2s).
  - Below header (when not collapsed):
    - Today → rich cards with 10px gap.
    - Older → all compact rows inside a single bordered container (`bg var(--bg2)`, `border var(--border)`, `radius 10`).
- Bottom margin: Today 36, other groups 28.

### Behaviors
- Card click → `navigate('/a/' + id)`.
- Share button on FeedCardRich → `openShare(artifact)` (modal mounted at App level).
- Day header click → `toggleDay(key)`.
- Tag filter pill at top of feed (if `tagFilter` set): chip showing `#tag ×` → click clears.
- Empty state: `"No artifacts"` italic in `var(--cat-amber)`-flavored copy + mono caption "Nothing published yet" (or with tagFilter: `No results for tag "tagFilter"`).

### Density
- Read `store.density`. Pass down to cards (FeedCardRich + FeedCardCompact both react to it).

## Key files

- `src/views/Feed.jsx`
- `src/utils/groupBy.js` — `groupByDay(artifacts)` reimplemented from `portal-data.js` line 240.

## Acceptance

1. With 25 seeded artifacts spanning today → 35 days ago, the feed renders:
   - Pinned strip at top (2 pinned items in seed data).
   - "Today" group with 4 rich cards.
   - "Yesterday", "3 days ago" labeled groups with compact rows.
   - "Last week", "Two weeks ago", "March 2026" for older.
2. Clicking a day header collapses the group with a smooth ▾ rotation.
3. Refreshing the page preserves collapse state (via store + localStorage).
4. Clicking a card opens the Viewer.
5. Setting a tag filter from the sidebar narrows the feed appropriately.

## Out of scope

- Optimistic mutations (delete/pin from feed) — defer.
- Real-time updates / SSE — defer.

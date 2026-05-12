---
id: ws-browse-view
title: Browse view — filter sidebar + auto-fill grid + sort bar
state: pending
depends_on: [ws-design-system]
summary: Implement `<BrowseView />` at `/browse`. Left filter sidebar (180px) with category + tag lists, sort bar, auto-fill grid of BrowseCards. QUHD right pane is a separate workstream.
phase: 2
---

## What done looks like

### Data
- On mount: fetch artifacts (`limit: 500`).
- Local state: `catFilter`, `sortBy`. `tagFilter` from global store.
- Compute `tagCounts` and `catCounts` client-side from the loaded set (or call dedicated `/artifacts/aggregate` if added later — not needed for P1).

### Layout
- Two-column flex inside the content area: filter sidebar + main grid.
- **Filter sidebar** (180px, right border `var(--border)`, padding `20px 0`):
  - `CATEGORY` section: `All (N)` + one row per category present, with 6×6 colored dot and count.
  - `TAGS` section: `All tags` + top 16 by count, each with count.
  - Filter items: full-width left-aligned buttons; active → `bg var(--bg3)`, `color var(--text)`, font-weight 500.
- **Main grid container** (flex column, overflow hidden):
  - Sort bar (44px): `N artifacts` label + sort buttons `newest / oldest / alpha / size` (active → `bg var(--bg3)`, border `var(--border2)`).
  - Grid: `display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;` (8px in compact density). Padding `16px 20px 80px`.
  - Pinned cards first within sort.
  - Empty state: italic "No results" + mono caption naming the active filter.

### Behaviors
- Click filter item → toggle (clicking active item clears).
- Click card → navigate to viewer (QUHD-rightPane behavior comes in ws-quhd-layout).
- Tag filter is bidirectional: tag clicked in sidebar updates the global store; the FeedView reads the same.

### Density
- Compact mode tightens card padding + grid gap; pulls `density` from store.

## Key files

- `src/views/Browse.jsx`
- Internal sub-components: `FilterSection`, `FilterItem`, `SortBtn`, `EmptyBrowse`.

## Acceptance

1. `/browse` shows all artifacts in a responsive grid.
2. Resize window 400 → 1800px: column count adapts (1 → 7+).
3. Category filter narrows; sort buttons re-order live.
4. Clicking a tag in sidebar narrows; switching to Feed shows the same filter applied.
5. Empty filter combinations show the correct empty state.

## Out of scope

- Right detail pane / no-viewer-on-click behavior at QUHD (ws-quhd-layout)
- Bulk-select / multi-edit

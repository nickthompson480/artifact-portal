---
id: ws-mobile-layout
title: Mobile (<768px) layout — top bar, bottom tab nav, tag chips, viewer
state: pending
depends_on: [ws-feed-view, ws-browse-view, ws-viewer, ws-settings-view]
summary: Verify and tune every breakpoint at <768px: top bar (52px), bottom tab bar (60px), feed/browse adjustments, viewer without drawer, tag filter chips.
phase: 4
---

## What done looks like

### Shell
- Sidebar fully hidden below 768px.
- Top bar (52px, `bg var(--bg2)`, bottom border `var(--border)`, padding `0 14px`): brand wordmark left, `🔍` Search button right.
- Bottom tab bar (60px fixed, `bg var(--bg2)`, top border `var(--border)`): 4 cells — Feed / Browse / Search / Settings. Each cell: 18px icon + 10px mono label. Active: color `var(--text)` + 4px amber dot above icon.
- Main content padding-bottom = 60 + safe-area-inset to clear the tab bar.

### Feed
- Container max-width 100vw, padding 16px.
- Today rich cards: same layout but tighter padding (`16px 18px 14px 22px`), title 17px.
- Compact rows: tags hidden on smallest widths (<480), only category + title + time.
- Day headers: 24px / 18px / 16px instead of 28 / 22 / 18.
- Tag filter pill at the top of the content area.

### Browse
- Filter sidebar moves to horizontal scroll chips above the grid:
  - Category chips (All / Spec / Report / …) in a horizontally-scrolling row.
  - Tag chips in a second row below.
- Sort buttons collapse to a single dropdown menu.
- Grid: `minmax(160px, 1fr)`, gap 8.

### Viewer
- Drawer is replaced with a bottom sheet: pressing `[i]` slides up a sheet from the bottom (height 60vh, slide .25s).
- Top bar items overflow allow: tags hidden, only Back / title / Share / `[i]`.

### Settings
- Sections stack normally; segmented controls switch to full-width buttons.

## Key files

- `src/components/MobileTabBar.jsx`
- `src/components/MobileTopBar.jsx`
- Media-query refinements scattered through view files.

## Acceptance

1. Open Chrome DevTools at 375×667 — entire app navigable.
2. Sidebar absent; bottom tab bar present and switches views.
3. Viewer drawer opens as a bottom sheet, not a side drawer.
4. Feed and Browse render legibly without horizontal scroll.

## Out of scope

- Touch gesture polish (swipe-to-back, pull-to-refresh) — defer
- PWA install prompts — defer

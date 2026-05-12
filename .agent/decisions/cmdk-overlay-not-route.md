---
id: cmdk-overlay-not-route
choice: Search is a ⌘K command-palette overlay that appears on top of any view, not a dedicated `/search` route in the navigation.
scope: frontend, routing, search
date: 2026-05-11
---

## Rationale

The owner already knows what they're looking for when they want search — usually a title or a tag. Forcing a navigation to `/search`, then back, then to the artifact is three context switches. A command palette is one keystroke (`⌘K`), one Enter (to open), and zero navigations away from where you were.

The palette is also the right shape for the data: 8 max results in a flat list, keyboard-driven (↑↓ Enter), with substring highlighting via `<mark>`. There's no faceting in search (filters live in Browse).

Behaviorally:
- `⌘K` (or `Ctrl+K`) opens the overlay from any view except the Viewer (where the iframe owns the keyboard).
- Empty query → show pinned + recent (8 total). This makes ⌘K useful even when you don't have a query, as a "where did I leave off" view.
- Typing → debounced 200ms → `GET /artifacts?q=…` → FTS5 over title/description/tags from day one (no fallback to LIKE matching).
- `Escape` closes. `Enter` opens the focused result and closes the palette.

## Alternatives considered

- **/search route with rich filters**: too many clicks; duplicates Browse's filter sidebar.
- **Inline search bar in the top header**: takes up horizontal real estate; doesn't scale to mobile.
- **No keyboard shortcut, only a button**: misses the muscle-memory pattern that's now universal (Linear, Raycast, GitHub, Vercel — every modern tool has ⌘K).

## Consequence

- A button labelled "Search… ⌘K" lives in the sidebar (desktop) and as a tab on mobile, mostly for discoverability.
- Search lives in `frontend/src/views/SearchOverlay.jsx`, mounted at the App.jsx level so it can overlay any route.
- Mobile: the same overlay opens; the trigger is the search tab in the bottom tab bar.
- No `/search?q=…` URL — search state is purely client-side.

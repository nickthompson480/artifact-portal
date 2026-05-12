---
id: ws-search-overlay
title: ⌘K command palette — keyboard, FTS5 query, navigation
state: pending
depends_on: [ws-feed-view, ws-owner-api]
summary: Mount SearchOverlay at App level. Open via ⌘K from any non-viewer view, sidebar Search button, mobile search tab. Debounced FTS5 against /artifacts?q=.
phase: 3
---

## What done looks like

### Mount + trigger
- Mounted in `App.jsx`, controlled by `store.searchOpen`.
- Global keydown listener (in App.jsx) for `(meta||ctrl)+K` opens when not in viewer.
- Sidebar Search button + mobile tab → `openSearch()`.

### Layout
- Backdrop: `rgba(0,0,0,.55)` + `backdrop-filter: blur(4px)`, z 300.
- Panel: `position: fixed; top: 18%; left: 50%; transform: translateX(-50%); width: 560; max-width: calc(100vw - 32px);`. `bg var(--bg2)`, border `var(--border2)`, radius 14, shadow overlay, z 400.
- Top row (padding 14/18): `⌕` icon + input (DM Sans 15px, no border, caretColor amber) + `esc` chip.
- Results area: max-height 400, overflow-y auto.
- Footer hints: `↵ open  ↑↓ navigate  esc close       N results`.

### Behavior
- On open: input auto-focuses.
- Empty query: results = pinned (up to 4) + recent (up to 4), max 8. Show eyebrow `PINNED · RECENT`.
- On typing: debounce 200ms → `listArtifacts({ q: query, limit: 8 })` → results.
- Each result row: category accent dot (8×8) · title with `<mark>` highlighting on matched substring · tags (mono with `#` prefix, also highlight matches) · relative time on the right.
- Hover or ArrowUp/Down → updates `focused` index.
- Click or Enter on focused → navigate to `/a/<id>`, then `closeSearch()`.
- Esc → close. Backdrop click → close.
- "No results for \"<query>\"" empty state when query is non-empty and results empty.

### Highlighting
- Case-insensitive substring match; wrap with `<mark style={{ background:'rgba(232,160,66,.25)', color:'var(--cat-amber)' }}>`.

## Key files

- `src/views/SearchOverlay.jsx`
- Helper `useDebounce(value, ms)` in `src/utils/useDebounce.js`.

## Acceptance

1. ⌘K opens overlay from Feed, Browse, Settings.
2. ⌘K is a no-op in Viewer.
3. Typing "payment" returns Payment Gateway artifact within ~250ms.
4. ↑↓ moves focus; Enter opens that artifact; overlay closes.
5. Esc closes without navigating.
6. With empty query, pinned and recent appear.

## Out of scope

- Search-inside-content (full HTML body) — ws-fts-content
- Saved searches / search history

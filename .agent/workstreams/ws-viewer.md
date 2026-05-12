---
id: ws-viewer
title: Artifact viewer — full-screen iframe, top bar, metadata drawer
state: pending
depends_on: [ws-design-system]
summary: Implement `<Viewer />` at `/a/:id`. 44px top bar, sandboxed iframe loading the artifact HTML, slide-in metadata drawer.
phase: 2
---

## What done looks like

### Data
- On mount: `getArtifact(id)` (metadata) and fetch the file HTML as text from `/artifacts/:id/file` (via `credentials: 'include'`).
- Show loading skeleton (light shimmer on `var(--bg2)`) while either request pends.
- 404 → render "Artifact not found" centered, with a `← Back` link.

### Layout
- `position: fixed; inset: 0; background: var(--bg); display: flex; flex-direction: column; z-index: 200;`
- Top bar (44px, `bg var(--bg2)`, bottom border `var(--border)`, padding `0 16px`, gap 12, flex row):
  - `← Back` IconBtn → `navigate(-1)` (fallback `/`)
  - 7px category dot
  - Title (DM Sans 13.5px / 500, ellipsis, flex 1)
  - Up to 3 `<TagChip />`
  - `<IconBtn>i</IconBtn>` toggles drawer (active state when open)
  - `<IconBtn>Share</IconBtn>` → `openShare(artifact)`
  - `<IconBtn>↗</IconBtn>` opens srcdoc in new tab via `window.open` + `document.write`

### Body
- Flex row: iframe + drawer.
- `<iframe srcDoc={html} sandbox="allow-scripts" title={title} style={{ flex:1, border:'none', background:'#0C0E14', transition:'margin-right .25s ease' }} />`
- See rule `iframe-sandbox`. No `allow-same-origin`.

### Metadata drawer
- Outer wrapper: `width: drawerOpen ? 280 : 0`, `transition: width .25s ease`, `overflow: hidden`, left border on open, `bg var(--bg2)`.
- Inner content (rendered only when open) at fixed `width: 280`, padding `20px 18px`, overflow-y auto.
- Section label "METADATA" mono uppercase.
- Rows (label-value): Title, Category badge, Agent badge, Size (formatSize), Published (timeLabel), Visibility (dot + label).
- Tags chip list.
- Description (if present).
- Bottom: full-width "Share this artifact…" button in teal.

### Keybindings
- `Escape` when drawer open → close drawer.
- `Escape` when drawer closed → `navigate(-1)`.
- `⌘K` is suppressed inside the viewer (let the iframe own keyboard).

## Key files

- `src/views/Viewer.jsx`
- `src/components/DrawerRow.jsx` (internal)

## Acceptance

1. Navigate to a feed card → `/a/<uuid>` → top bar shows correct title, category dot color matches.
2. iframe renders the artifact HTML (`Payment Gateway Integration Spec` body) within the sandbox.
3. Click `[i]` → drawer slides in over .25s; iframe content reflows to give it space.
4. Click `[↗]` → new tab opens with the artifact HTML at full window.
5. `← Back` returns to the feed at the same scroll position.
6. Esc closes drawer; Esc again returns to feed.
7. With `sandbox="allow-scripts"` confirmed in DevTools.

## Out of scope

- Versioning / "show previous versions" (ws-version-history)
- Inline editing of metadata (small input controls TBD)
- Mobile-specific drawer behavior (ws-mobile-layout)

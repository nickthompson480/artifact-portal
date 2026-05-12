---
id: ws-quhd-layout
title: QUHD (≥1920px) layout — wider sidebar + Browse right detail pane
state: pending
depends_on: [ws-browse-view, ws-settings-view]
summary: At ≥1920px viewports, widen the sidebar to 280px (via CSS var override) and enable an optional right detail pane in Browse that previews the selected card without leaving the view.
phase: 4
---

## What done looks like

### Sidebar
- Already CSS-driven via `:root { --nav-w: 240px } @media (min-width: 1920px) { :root { --nav-w: 280px } }` from `colors_and_type.css`. Confirm visually nothing breaks; brand wordmark + search button + nav fit comfortably.

### Browse right detail pane
- A 280px panel attached to the right of the Browse view content area.
- Visible only when:
  - `window.innerWidth >= 1920`, AND
  - `store.rightPane === true` (toggled in Settings → Appearance), AND
  - The user has selected (clicked) a BrowseCard.
- When visible, BrowseCard clicks no longer navigate to the viewer — they update `selectedArtifact` and the pane updates.
- A "Open artifact" CTA button inside the pane still navigates to the viewer.
- Pane content (from portal-browse.jsx `RightDetailPane`):
  - Header: `SELECTED` eyebrow + `×` close button.
  - Thumbnail area (130px tall) with category-tinted gradient + italic artifact title (placeholder until ws-thumbnails lands real previews).
  - Title (DM Sans 13/500), description (11.5/text2), MetaRows (Category/Agent/Size/Published/Visibility), tag list.
  - Two action buttons stacked: `Open artifact` (teal primary), `Share…` (secondary).

### Window-resize behavior
- Listen to `resize`. If window falls below 1920px while pane is visible: hide pane, restore "click → viewer" behavior, deselect.

## Key files

- `src/views/Browse.jsx` (extend with right pane render path)
- `src/components/RightDetailPane.jsx`

## Acceptance

1. On a 1920+ display with `rightPane: true`, clicking a Browse card opens the right pane and does NOT navigate.
2. Clicking the pane's "Open artifact" navigates to the viewer.
3. Resize to <1920 → pane disappears, next click navigates to viewer.
4. Toggling rightPane off in Settings hides the pane immediately.

## Out of scope

- Real thumbnails (ws-thumbnails)
- Monthly heatmap on the feed (deferred — open question)

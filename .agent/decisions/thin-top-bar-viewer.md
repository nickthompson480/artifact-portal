---
id: thin-top-bar-viewer
choice: The artifact viewer uses a 44px top bar (Back · category dot · title · tags · [i] [Share] [↗]) and a slide-in 280px metadata drawer. The portal sidebar is fully replaced, not preserved.
scope: frontend, viewer
date: 2026-05-11
---

## Rationale

When viewing an artifact, the artifact is the content. The portal chrome should disappear as much as possible without making the user feel trapped or losing context (what is this thing, who made it, can I share it).

The 44px bar gives just enough surface for:
- A clear escape hatch (`← Back`) on the left
- A category indicator (7px accent dot) so the user knows what kind of doc they're in without needing the metadata drawer open
- The title (always visible, ellipsis on overflow)
- Inline tags (up to 3) — match the feed/browse pills exactly, reinforce identity
- Three actions: toggle metadata drawer (`[i]`), open Share modal, open in new tab (`[↗]`)

Metadata that's nice-to-have but not always-needed (size, agent, full tag list, description) goes into a 280px drawer that animates in over .25s when the user presses `[i]`. Closed by default. The drawer also hosts the secondary Share action so users who arrived via "I want to share this" have two natural targets (top-bar Share button or drawer "Share this artifact…" button).

The full sidebar (Feed/Browse/Tags/Settings nav) is replaced — keeping it would compete with the artifact and create a "is this part of the portal or part of the artifact?" visual confusion.

## Alternatives considered

- **Keep portal sidebar visible** (artifact in a content well): visually busier; iframe rendering inside a constrained column makes many artifact layouts (full-width prototypes) look broken.
- **Bottom-anchored chrome**: would conflict with artifact content (charts, footers, mobile-style bottom nav inside artifacts).
- **Floating overlay metadata** instead of drawer: tested poorly when the artifact has its own dark UI in the same corner.

## Consequence

- Viewer is its own React route `/a/:id`, `position: fixed inset 0 z-index 200`.
- Iframe uses `srcdoc` from `GET /artifacts/:id/file` + `sandbox="allow-scripts"` (see rule `iframe-sandbox`).
- The drawer animates `width: 0 → 280px` over `.25s ease`; iframe gets `margin-right` transition to match.
- Back button uses `history.back()`, falling back to `/`.

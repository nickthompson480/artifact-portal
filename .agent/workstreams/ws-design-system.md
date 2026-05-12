---
id: ws-design-system
title: Design tokens + shared components (badges, chips, cards)
state: pending
depends_on: [ws-frontend-shell]
summary: Import colors_and_type.css verbatim, build all reusable React components from the design handoff. Pixel-accurate to the HTML prototype.
phase: 2
---

## What done looks like

### Tokens
- `src/styles/colors_and_type.css` is a verbatim copy of `IMPORTS/personal-web/project/colors_and_type.css`.
- Imported once in `src/main.jsx` (above any component imports).
- Google Fonts link (DM Serif Display + DM Sans + DM Mono) loaded via `index.html` `<link>` (preferred — avoids @import latency) AND `colors_and_type.css`'s `@import` is kept as fallback.

### Components

Each in `src/components/`, written as React functional components, props match the prototype's JSX exactly.

| Component | Source reference | Notes |
|---|---|---|
| `CategoryBadge` | portal-ui.jsx | Maps category → varName → `var(--cat-<v>)`, `var(--cat-<v>-bg)`, `var(--cat-<v>-bd)` |
| `TagChip` | portal-ui.jsx | Active/hover states; pass onClick to make interactive |
| `AgentBadge` | portal-ui.jsx | `⟡` (AI, teal) vs `✎` (manual, text3) |
| `VisibilityDot` | portal-ui.jsx | 5×5 dot, color by visibility, `title` attr |
| `IconBtn` | portal-ui.jsx | Border + padding + hover/active states |
| `FeedCardRich` | portal-ui.jsx | 3px accent bar, full layout |
| `FeedCardCompact` | portal-ui.jsx | Single-row layout |
| `BrowseCard` | portal-ui.jsx | Grid card, selected state, pin icon |
| `SectionLabel` | portal-feed.jsx | "PINNED" / "RECENT" label |

All sizing/colors via `var(--token)` — see rule `design-token-fidelity`. No hex literals.

### Category helper

`src/utils/category.js`:
```js
export const CATEGORY_META = {
  spec:      { label: 'Spec',   varName: 'amber'  },
  report:    { label: 'Report', varName: 'teal'   },
  prototype: { label: 'Proto',  varName: 'purple' },
  review:    { label: 'Review', varName: 'coral'  },
  other:     { label: 'Other',  varName: 'blue'   },
};
export function categoryColorVar(cat) { return `var(--cat-${(CATEGORY_META[cat] || CATEGORY_META.other).varName})`; }
```

### Formatting helpers

`src/utils/format.js` exports `formatSize`, `timeLabel`, `dayKey` — implementations from SPEC §11.

### Storybook-lite (optional but recommended)

`src/views/Preview.jsx` (route `/__preview` in dev only) renders one of each component with seeded artifacts so the work can be visually checked against `IMPORTS/personal-web/project/Artifact Portal.html`.

## Key files

- `src/styles/colors_and_type.css`
- `src/components/*.jsx`
- `src/utils/category.js`, `src/utils/format.js`

## Acceptance

1. Open `Preview.jsx` route side-by-side with `IMPORTS/personal-web/project/Artifact Portal.html` — pixel-level parity for each component (badge sizes, padding, colors, hover states).
2. `rg -n '#[0-9A-Fa-f]{3,8}' src --glob '!styles/colors_and_type.css'` — zero matches in components/.
3. Switching `data-theme` to `light` re-themes every component without code changes.

## Out of scope

- Composing components into views (handled by individual view workstreams)
- Mobile-specific layout adjustments (ws-mobile-layout)

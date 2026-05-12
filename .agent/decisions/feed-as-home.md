---
id: feed-as-home
choice: The home route `/` is the Activity Feed — a day-grouped river of artifacts. Not a dashboard, not a search bar, not the Browse grid.
scope: frontend, routing, IA
date: 2026-05-11
---

## Rationale

The portal is used in two modes:

1. **"What just happened?"** — the owner opens the portal, scans what their agents have published in the last hour or day. This is by far the dominant use case (multiple times per day, single-line summary digestion).
2. **"Find that specific thing"** — happens 0–3 times per day. Better served by ⌘K search, which is one keystroke away from anywhere.

Browse-grid-as-home would optimise for #2 and force #1 to either scroll a flat grid (no temporal structure) or stop at a category filter sidebar before seeing today's output. Both make the dominant path slower.

The Activity Feed is opinionated about time: today gets rich cards (full description, agent, tags, share button), older days collapse into compact rows. The day headers — `Today` (italic 28px amber), `Yesterday` (22px italic var(--text2)), `Last week`, etc. — are recognisable scan-targets. The pinned strip sits above the feed so high-value artifacts don't get buried.

## Alternatives considered

- **Dashboard with metrics** (artifact count, agents active, recent share clicks): looks impressive but adds no real information for a single user. Cut.
- **Browse grid as home**: discoverable but visually noisy for the daily-use case. Better as a separate `/browse` route reached from the sidebar.
- **Two-column home** (feed + activity sidebar): adds cognitive load. The portal already has a sidebar with tags; a third column is overload.

## Consequence

- `/` renders `<FeedView />` (workstream `ws-feed-view`)
- Browse is at `/browse` (workstream `ws-browse-view`)
- There's no `/search` route — ⌘K opens an overlay on top of whatever view you're on

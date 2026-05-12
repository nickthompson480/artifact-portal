---
id: ws-collections
title: Collections — reserve `col/*` tag prefix as collection identifiers
state: pending
depends_on: [ws-browse-view]
summary: Treat tags starting with `col/` as collection memberships. The Browse sidebar gets a Collections section listing all `col/*` tags; clicking one filters the grid. No new tables — purely a tag convention.
phase: 5
---

## Pre-decision required

Open question §13.3 — choose one:
1. **Convention-only** (this workstream's default): `col/auth-work`, `col/q2-launch`, etc., are just tags with a reserved prefix.
2. **First-class table**: `collections(id, name, slug)` + `artifact_collections(artifact_id, collection_id)`. More machinery, allows per-collection settings (cover image, description) later.

Default: option 1 — minimal. Reserve `col/` so future migration to option 2 is mechanical.

## What done looks like

- Tag validation rejects names starting with `col/` from agent-side input unless they look like `col/<slug>` where slug matches `^[a-z0-9-]{1,40}$`.
- Browse filter sidebar:
  - New section `COLLECTIONS` between Category and Tags.
  - Lists all distinct `col/*` tags from active artifacts, count beside each.
  - Selecting one filters Browse to artifacts containing that tag.
- Sidebar TAGS section no longer shows `col/*` entries (they live in Collections).
- Feed continues to use the same `tagFilter`; collection-tag filter and regular-tag filter share the slot.

## Acceptance

1. Tag an artifact with `col/auth-work` → it appears under Collections in Browse.
2. Filter shows only artifacts containing that collection tag.
3. Regular tag list excludes `col/*`.

## Out of scope

- Collections-as-pages with rich descriptions
- Migration to a dedicated `collections` table (deferred until v2)

---
id: ws-collections-decision
type: decision
date: 2026-05-11
choice: col/* tag convention — no first-class table
scope: ws-collections
---

## Decision

Collections use the reserved tag prefix `col/` (e.g. `col/auth-work`, `col/q2-reports`). No new DB table. No schema migration needed.

**Why convention over table:** Agents already interact with tags via the API. A `col/*` tag is just a tag with a namespace. Browse sidebar gets a "Collections" section that filters `col/*` tags from the regular tag list. Feed filtering works automatically since `col/*` is a valid tag.

**Validation:** Agent tag validation (in `routes/api.js`) rejects `col/` prefix unless the value matches `^col/[a-z0-9-]{1,40}$`. This prevents malformed collection names while allowing agents to create collections by simply tagging with `col/<name>`.

**Browse sidebar:** The Collections section lists unique `col/*` tag values (prefix stripped for display). Regular Tags section excludes `col/*`. Clicking a collection sets `tagFilter` to the full `col/<name>` value.

**How to apply:** No migration. Update `routes/api.js` tag validation. Update `frontend/src/views/Browse.jsx` to split `col/*` from regular tags.

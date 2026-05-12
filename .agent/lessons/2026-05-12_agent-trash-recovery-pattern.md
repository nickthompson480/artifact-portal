---
id: 2026-05-12_agent-trash-recovery-pattern
date: 2026-05-12
tags: [agent-api, soft-delete, slug, trash, restore]
workstream: ws-agent-api
routed_to: "web.artifact-portal"
---

## Lesson

Even with `PUT /api/artifacts/:id/file` available, the soft-delete footgun has a residual case: an agent that has already deleted an artifact and lost the ID has no API path to recover. `GET /api/artifacts` filtered `deleted_at IS NULL`, so the ID was invisible. The only escape was sqlite access.

Fix: two additions to the agent API:
- `GET /api/artifacts?trashed_only=true` — lets agents find deleted artifacts (scoped to their key namespace)
- `GET /api/artifacts?include_trashed=true` — mixed live + deleted listing
- `POST /api/artifacts/:id/restore` — restores by ID, idempotent

The full self-recovery workflow for an agent that deleted and lost the slug:
1. `GET /api/artifacts?trashed_only=true` → find the ID
2. `POST /api/artifacts/:id/restore` → bring it back (slug reclaimed)
3. `PUT /api/artifacts/:id/file` → replace content

## Why non-obvious

`GET /api/artifacts` returning only live artifacts is the obvious default, but it creates a blind spot for agents managing their own lifecycle. Owner UI has `?trash=1` — agents needed the equivalent.

## Routed

`web.artifact-portal` SKILL.md updated: list endpoint docs expanded, new Restore section added, slug-reservation gotcha expanded to cover full recovery workflow.

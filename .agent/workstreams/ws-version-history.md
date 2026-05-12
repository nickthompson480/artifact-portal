---
id: ws-version-history
title: Version history — keep last 5 versions per artifact slug
state: pending
depends_on: [ws-agent-api]
summary: When an agent re-publishes with the same slug (intentional update), keep the previous file + a versions row. UI surfaces "previous versions" in the metadata drawer.
phase: 5
---

## Pre-decision required

Open question §13.2:
- Is "republish with same slug" the trigger, or "PATCH that includes a new file"? 
- Default: agent calls `POST /api/artifacts/:slug/versions` (new dedicated route) to upload a new version; PATCH only updates metadata.

## What done looks like

- New table `artifact_versions(id, artifact_id, file_path, file_size, created_at, note)`. Up to 5 rows per `artifact_id`, oldest pruned on insert.
- New file path: `~/.artifact-portal/files/<id>.<v>.html` (v starts at 1).
- New route `POST /api/artifacts/:id/versions` (X-API-Key, must own). Multipart: `file`, optional `note`. Writes new file with bumped suffix, updates `artifacts.file_path` to point at it, inserts a row in `artifact_versions`, prunes to 5.
- Metadata drawer in the viewer adds a "Previous versions" disclosure: lists older versions with timestamp + note + "View" link that opens the prior file in a new tab.

## Acceptance

1. Re-publish an artifact 6 times → only 5 versions remain; oldest file removed from disk.
2. Drawer shows previous versions list; clicking opens that version's HTML.
3. Soft-deleting an artifact also hides its version list (don't expose via the API).

## Out of scope

- Diff view between versions
- Version-level sharing (share v3 specifically)

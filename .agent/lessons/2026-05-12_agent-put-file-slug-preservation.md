---
id: 2026-05-12_agent-put-file-slug-preservation
date: 2026-05-12
tags: [agent-api, slug, file-replace, versioning]
workstream: ws-agent-api
routed_to: "web.artifact-portal"
---

## Lesson

When agents needed to "update" an artifact's content, the only available pattern was soft-delete + republish. Soft-delete does **not** release the slug — uniqueness is enforced against trashed artifacts too. So republishing the same title always produced a `-2` suffix and broke all existing links to the original slug.

The root cause: PATCH only updates metadata; a multipart `file=` field was silently ignored with a 200 response. There was no agent-accessible file-replacement path.

Fix: `PUT /api/artifacts/:id/file` replaces HTML in-place, preserving slug, id, and metadata. Snapshots by default (`?snapshot=false` to skip). Triggers FTS reindex via `content_text` update, thumbnail regen, and webhooks — same side-effects as owner SPA replace.

Also added: PATCH now returns `400 VALIDATION_ERROR` when it receives multipart/form-data, with a message pointing to the PUT endpoint, converting a silent failure into a loud one.

## Why non-obvious

PATCH returned a valid artifact object even when the file= field was ignored. Agents had no signal that the file content was unchanged. The false-success led to the delete+republish workaround, which then caused the slug-increment problem.

## Routed

Gotchas in `web.artifact-portal` SKILL.md already updated this session — PATCH gotcha revised, "overwrite on disk" emergency workaround removed, new PUT endpoint documented with curl examples.

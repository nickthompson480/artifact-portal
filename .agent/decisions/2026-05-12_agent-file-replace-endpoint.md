---
id: 2026-05-12_agent-file-replace-endpoint
type: decision
date: 2026-05-12
choice: new PUT /api/artifacts/:id/file endpoint; PATCH returns 400 on multipart; snapshot on by default with ?snapshot=false opt-out
scope: ws-agent-api
---

## Decision

Add `PUT /api/artifacts/:id/file` to the agent API as the canonical file-replacement primitive. Preserves slug, id, and all metadata. Mirrors the side-effect chain from the owner PATCH-with-file: `snapshotVersion → write → DB update (content_text, file_size, updated_at) → scheduleThumb → dispatch`. Snapshot is on by default; agents can skip with `?snapshot=false`.

Rejected alternatives:
- **Release slug on soft-delete** — fixes the symptom (slug churn) but not the cause (no replace path), and introduces a new surprise: slugs may change after trash restore.
- **Extend PATCH to accept file=** — overloads a metadata endpoint with binary write semantics; different cost profile and side-effects belong on a separate route. PUT is the correct verb for sub-resource replacement (`/file`).

PATCH now returns `400 VALIDATION_ERROR` (with guidance message) when it receives `Content-Type: multipart/form-data`, converting a silent false-success into an explicit error.

**Reviewed by:** Opus 4.7 (subagent). Confirmed separate endpoint, snapshot-on-by-default, and FTS/thumb/webhook side-effect parity. Also flagged: extract shared replaceFile() helper to prevent divergence — deferred; inline implementation with comment to owner route is sufficient for current scale (~30 artifacts, single developer).

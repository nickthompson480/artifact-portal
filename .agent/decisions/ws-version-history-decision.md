---
id: ws-version-history-decision
type: decision
date: 2026-05-11
choice: version on every file-replacing write, cap at 5, no trigger-based auto-capture
scope: ws-version-history
---

## Decision

Create a version snapshot whenever the artifact's HTML file is replaced (agent `POST /api/artifacts` for same slug, or owner `POST /artifacts` for same file replacement). Cap at 5 versions per artifact — prune the oldest on insert.

**Trigger mechanism:** Route-level (not DB trigger). Before writing the new file, copy the current file to `~/.artifact-portal/versions/<artifact_id>/<version_id>.html` and insert a row into `artifact_versions`. This keeps version logic visible in the route handler and avoids SQLite trigger complexity with file I/O.

**Table:** `artifact_versions(id, artifact_id, version_num, file_path, created_at)`. Pruning: after insert, `DELETE FROM artifact_versions WHERE artifact_id = ? AND id NOT IN (SELECT id FROM artifact_versions WHERE artifact_id = ? ORDER BY created_at DESC LIMIT 5)`.

**API:** `GET /api/artifacts/:id/versions` lists versions for own artifacts. `GET /artifacts/:id/file?v=<version_id>` streams a historical version (owner auth only). Soft-delete hides version list.

**How to apply:** Migration `0003-version-history.sql`. Update `routes/api.js` and `routes/artifacts.js` for the snapshot-before-write logic.

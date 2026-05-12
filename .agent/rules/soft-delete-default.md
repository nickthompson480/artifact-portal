---
id: soft-delete-default
statement: All artifact deletion is soft by default — DELETE /artifacts/:id sets deleted_at and leaves the file on disk. Hard delete is gated behind an explicit /permanent route with a confirm query parameter, and only the owner (cookie auth) can call it.
severity: critical
checkable: true
---

## Why

The owner publishes hundreds of one-off artifacts. Accidental loss from a misclicked "delete" or a buggy agent script must be recoverable. Soft delete preserves both the row (with `deleted_at` set) and the underlying file at `~/.artifact-portal/files/<uuid>.html`. The Trash view in Settings (future) lists deleted rows; `POST /artifacts/:id/restore` clears `deleted_at`.

Hard delete is intentionally inconvenient:
- Different route (`DELETE /artifacts/:id/permanent`)
- Requires `?confirm=1` query parameter (so accidental curl/wget can't trigger it)
- Removes both the row and the file
- Only owner (cookie auth) — never available via X-API-Key

## How to check

```bash
# Agent route (X-API-Key) must NEVER call hard-delete logic
rg -n 'permanent|unlink|rm -' routes/api.js
# expect: zero references to file deletion / row removal

# Owner DELETE /artifacts/:id should only update deleted_at
rg -n 'fs.(unlink|rm)|DELETE FROM artifacts' routes/artifacts.js
# the only file-removal call should be inside the /permanent handler
```

## Remediation

If you find yourself writing `fs.unlink(...)` outside the `/permanent` handler, stop. Convert to soft delete and add a Trash entry.

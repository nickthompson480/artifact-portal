---
id: ws-export-decision
type: decision
date: 2026-05-11
choice: streaming ZIP via archiver, manifest.json + HTML files, owner-auth only
scope: ws-export
---

## Decision

`GET /export.zip` streams a ZIP archive using the `archiver` npm package. No buffering in memory — archiver pipes directly to the response stream.

**Contents:**
- `manifest.json` — array of all included artifact metadata (id, title, slug, description, tags, category, visibility, published_by, created_at, file_path_in_zip)
- `files/<id>.html` — each artifact's HTML file
- `thumbs/<id>.svg` — thumbnails if `ws-thumbnails` is shipped and the file exists (gracefully skipped if not)

**Filters:** `?include_deleted=1` (include soft-deleted artifacts), `?since=<iso>` (only artifacts created after this timestamp).

**Auth:** Owner cookie only (requireAuth). Not available via API key.

**No schema change needed** — reads from existing tables and file paths.

**Settings UI:** "Export archive" button in Settings → `a href="/export.zip"` download link (no custom fetch needed — direct link triggers browser download).

**How to apply:** No migration. Add `routes/export.js`, mount in `server.js`. Add `archiver` to `package.json`.

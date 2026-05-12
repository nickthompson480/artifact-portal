---
id: ws-export
title: Export — ZIP of all artifact HTML + manifest.json
state: pending
depends_on: [ws-owner-api]
summary: `GET /export.zip` (owner auth) streams a ZIP containing every active artifact's HTML plus a manifest.json with metadata. Useful for offline archive / migration.
phase: 5
---

## What done looks like

- New route `GET /export.zip` (cookie auth):
  - Streams a ZIP with structure:
    ```
    manifest.json            # array of all artifact rows (sans deleted_at) + version pointers if ws-version-history shipped
    files/<id>.html          # each artifact's HTML file
    thumbs/<id>.jpg          # thumbnails if ws-thumbnails shipped
    ```
  - Query `?include_deleted=1` includes soft-deleted artifacts.
  - Query `?since=<iso>` only includes artifacts created/updated since.
- Uses `archiver` (npm) for streaming ZIP creation — no full-buffer in memory.
- Settings UI adds an "Export" button under Portal section that triggers a download.

## Acceptance

1. Click Export → ZIP downloads.
2. Unzip → manifest.json valid JSON, lists 25 artifacts; files/ has 25 HTML files.
3. `?since=2026-04-01` filters correctly.
4. Export of 1000 artifacts streams without OOM.

## Out of scope

- Restore-from-ZIP route (defer — would need careful slug/UUID collision handling)
- Encrypted export

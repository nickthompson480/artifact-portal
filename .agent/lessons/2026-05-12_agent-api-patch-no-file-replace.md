---
id: "2026-05-12_agent-api-patch-no-file-replace"
type: lesson
date: 2026-05-12
tags: [agent-api, artifact-portal, file-replace]
workstream: "ws-agent-api"
session: "2026-05-12T02-32"
---

The agent API `PATCH /api/artifacts/:id` with a multipart `file=` field does NOT replace the artifact's HTML file. It silently ignores the file and only updates the JSON metadata fields. The response still returns a valid artifact object, giving a false impression of success.

File replacement is owner-only via the SPA. From an agent context, the only workaround is writing directly to `~/.artifact-portal/files/<id>.html` on the Mac. This is acceptable for localhost-only deployments but would be a blocker on a VPS.

When v2.0 (VPS migration) is designed, consider adding an agent-accessible file-replace endpoint (separate from PATCH metadata) so agents can fix their own artifacts without requiring owner intervention or filesystem access.

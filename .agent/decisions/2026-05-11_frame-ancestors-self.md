---
id: "2026-05-11_frame-ancestors-self"
type: decision
date: 2026-05-11
scope: "ws-owner-api"
choice: "GET /artifacts/:id/file serves frame-ancestors 'self', not 'none'"
---

## Choice

The `Content-Security-Policy` header on `GET /artifacts/:id/file` uses `frame-ancestors 'self'`, not `frame-ancestors 'none'` as the initial spec draft stated.

## Alternatives considered

- `frame-ancestors 'none'` — prevents any framing. Correct if the endpoint were fetch-only, but the Viewer loads it as `<iframe src="/artifacts/:id/file">`.
- `frame-ancestors 'self'` — allows same-origin framing only. No cross-origin embedding possible.

## Rationale

The Viewer component uses `src=` (not `srcDoc`) to load artifacts into the sandbox iframe. Setting `frame-ancestors 'none'` would silently block the iframe from rendering — the browser enforces it without any console error visible in the portal UI. `'self'` restricts framing to the portal's own origin while still allowing the intended Viewer usage.

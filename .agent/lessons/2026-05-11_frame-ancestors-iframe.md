---
id: "2026-05-11_frame-ancestors-iframe"
type: lesson
date: 2026-05-11
tags: [security, csp, iframe]
workstream: "ws-owner-api"
session: "2026-05-11T19-40"
routed_to: []
---

`Content-Security-Policy: frame-ancestors 'none'` on an endpoint that is loaded as an `<iframe src=...>` silently prevents the iframe from rendering — the browser enforces it with no visible error in the app. Spec said `'none'`; correct value is `'self'` when the endpoint is consumed both by fetch() and as iframe src within the same origin. Always verify frame-ancestors direction against actual consumer patterns before applying.

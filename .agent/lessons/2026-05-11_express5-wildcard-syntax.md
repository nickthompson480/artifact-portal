---
id: "2026-05-11_express5-wildcard-syntax"
type: lesson
date: 2026-05-11
tags: [express, routing, express5]
workstream: "ws-server-core"
session: "2026-05-11T19-40"
---

`app.get('*', handler)` throws `PathError: Missing parameter name` at boot in Express 5 (uses path-to-regexp v8). Bare `*` is no longer valid. Use `app.get(/.*/, handler)` or `app.get('/*splat', handler)` instead. This would have silently prevented the server from starting. Always use the regex form for SPA fallback routes.

---
id: "2026-05-12_sandboxed-iframe-postmessage-to-parent-works"
type: lesson
date: 2026-05-12
tags: [iframe, sandbox, postmessage, portal-theme]
workstream: ""
session: "2026-05-12T06-21"
---

`window.parent.postMessage()` works from a sandboxed iframe even without `allow-same-origin`. The sandbox restriction blocks DOM property access to the parent, not cross-origin postMessage communication. This enables the `portal:theme:request` pull-based handshake: the artifact's IIFE fires the request synchronously, the Viewer (which registered its message listener before loading the iframe) catches it and responds immediately. No timing retry burst required.

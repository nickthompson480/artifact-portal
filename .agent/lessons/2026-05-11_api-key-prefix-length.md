---
id: "2026-05-11_api-key-prefix-length"
type: lesson
date: 2026-05-11
tags: [auth, api-keys, sqlite]
workstream: "ws-owner-api"
session: "2026-05-11T19-40"
---

Key prefix stored as `key.slice(0, 8)` is `'pk_live_'` for every key — the constant prefix makes the short-circuit filter match all active keys on every request, defeating its purpose for both performance and UI display. Fixed to `slice(0, 12)` which includes 4 random chars after the prefix. Any project using prefixed API keys must ensure the stored prefix extends into the random portion.

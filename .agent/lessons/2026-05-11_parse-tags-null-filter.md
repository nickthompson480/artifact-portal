---
id: "2026-05-11_parse-tags-null-filter"
type: lesson
date: 2026-05-11
tags: [validation, json, sqlite]
workstream: "ws-agent-api"
session: "2026-05-11T19-40"
---

`JSON.parse('[null]')` yields `[null]`. Mapping that array with `String()` produces `["null"]` — a literal "null" tag stored in SQLite and returned to clients. Any tag-parsing function must filter `t != null && typeof t !== 'object'` before calling `String(t)`. Same issue applies to parsed numeric JSON arrays (e.g. `[1, 2]` → `["1", "2"]` tags, which may or may not be intended).

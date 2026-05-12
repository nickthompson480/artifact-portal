---
id: "2026-05-11_insert-before-write-atomicity"
type: lesson
date: 2026-05-11
tags: [sqlite, files, atomicity]
workstream: "ws-agent-api"
session: "2026-05-11T19-40"
---

When persisting a record that references a file on disk (artifact HTML + DB row), always insert the DB row first, then write the file. If the DB insert fails (constraint, disk-full), no orphan file is created. If the file write fails after a successful insert, roll back the DB row (`DELETE WHERE id = ?`). The reverse order (write file first) silently leaks orphan files on any DB failure and is hard to clean up later.

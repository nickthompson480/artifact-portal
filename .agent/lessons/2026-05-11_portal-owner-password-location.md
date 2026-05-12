---
id: "2026-05-11_portal-owner-password-location"
type: lesson
date: 2026-05-11
tags: [auth, portal, credentials]
workstream: ""
session: "2026-05-11T22-25"
routed_to: ["web.artifact-portal"]
---

Portal owner password is `hunter2` — set via `POST /setup` during smoke testing (`scripts/smoke-phase1.sh`). Not stored in Keychain or any env file. The smoke test script is the only place this is documented. If the password needs to be reset, update the `password_hash` row in `~/.artifact-portal/db.sqlite` directly with a new bcrypt hash.

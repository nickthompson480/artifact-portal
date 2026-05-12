---
id: "2026-05-11_agent-api-key"
type: decision
date: 2026-05-11
workstream: ""
session: "2026-05-11T22-25"
choice: "Created API key named 'claude-agent' and stored credentials in Keychain under 'claude-env/artifact-portal'"
alternatives: ["Store key in a dotfile", "Use owner session cookie"]
---

## Context

The `web.artifact-portal` skill was confirmed accurate against the live routes. To make the skill usable, an API key was needed. Created via `POST /settings/api-keys` after owner login. Credentials stored in Keychain so the skill's `security find-generic-password` retrieval pattern works without hardcoding.

## Why

Keychain storage matches the pattern documented in the skill — zero-config for future agent sessions.

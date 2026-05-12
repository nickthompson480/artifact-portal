---
id: 2026-05-11_curl-fail-flag-4xx
type: lesson
date: 2026-05-11
tags: [bash, curl, scripting, testing]
workstream: scripts
routed_to: null
---

## Lesson

`curl -sf URL -o /dev/null -w "%{http_code}"` aborts with exit code 22 when the server returns a 4xx response. The `-f`/`--fail` flag makes curl treat HTTP 4xx/5xx as errors, returning exit code 22 — which kills the script when `set -e` is active. The captured `$R` is never set.

This is especially wrong when a test *expects* a 4xx (e.g. checking that `POST /setup` returns 410 on repeat, or that `DELETE /permanent` returns 400 without `?confirm=1`).

**Fix:** Use `curl -s` (no `-f`) for any call that captures `%{http_code}` and validates a specific status. Reserve `-f` for calls where a non-2xx response is a genuine failure and you want curl to abort.

**Context:** Found in `scripts/smoke-phase1.sh` — replaced all `-sf ... -w "%{http_code}"` patterns with `-s ... -w "%{http_code}"`.

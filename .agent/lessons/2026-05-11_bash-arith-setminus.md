---
id: 2026-05-11_bash-arith-setminus
type: lesson
date: 2026-05-11
tags: [bash, scripting, set-e]
workstream: scripts
routed_to: null
---

## Lesson

`((N++))` returns exit code 1 when `N` is 0, because `(( 0 ))` evaluates to false in bash. With `set -e` active this silently aborts the script on the very first counter increment — the first successful check calls `ok()`, which calls `((PASS++))` from 0, which returns 1, which triggers `set -e` exit. The failure message is then emitted by the `||` fallback in the calling expression, making it look like the check failed when it actually passed.

**Fix:** Use `N=$((N + 1))` for counters in `set -e` scripts. Arithmetic expansion `$((...))` always returns 0 and never trips `set -e`.

**Context:** Found in `scripts/smoke-phase1.sh` — first two `ok()` calls appeared to fail, aborting the test suite before any real assertions ran.

---
id: "2026-05-12_portal-theme-handshake-sync-dispatch"
type: decision
date: 2026-05-12
scope: "project"
choice: "Artifacts dispatch portal:theme:request synchronously in the IIFE, not on DOMContentLoaded"
---

## Choice

The `portal:theme:request` postMessage is sent synchronously inside the IIFE in `<head>`, not deferred to a `DOMContentLoaded` listener.

## Alternatives considered

- **DOMContentLoaded callback:** fire the request after the DOM is fully parsed. Cleaner conceptually but adds unnecessary delay — the Viewer's listener is already registered before the iframe loads, so no synchronization benefit.
- **Retry burst (existing):** Viewer pushes theme at 0ms, 50ms, 250ms. Replaced entirely — the pull-based handshake is cleaner and eliminates timing guesswork.

## Rationale

The Viewer registers its `portal:theme:request` handler with `[]` deps (on mount), before `artifact?.id` effects fire. By the time the IIFE runs inside the artifact, the Viewer is guaranteed to be listening. Dispatching synchronously in the IIFE is the earliest possible moment — the theme is applied before any content renders, eliminating flash-of-wrong-theme entirely. Deferring to DOMContentLoaded would only add latency for no benefit.

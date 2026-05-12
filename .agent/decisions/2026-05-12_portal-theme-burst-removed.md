---
id: "2026-05-12_portal-theme-burst-removed"
type: decision
date: 2026-05-12
scope: "project"
choice: "Removed 50/250ms retry burst; kept immediate-send + load-event as backward-compat fallback"
---

## Choice

The 50ms and 250ms `setTimeout` retries from the Viewer's theme-send effect are removed. The immediate `send()` call and the `load` event listener are kept as a fallback for pre-handshake artifacts.

## Alternatives considered

- **Keep burst alongside handshake:** belt-and-suspenders. Rejected — it adds noise for new artifacts that already use the handshake, and the fallback path (immediate + load) is sufficient for old artifacts.
- **Remove all fallback paths:** clean, but breaks existing artifacts in the portal that don't implement `portal:theme:request`.

## Rationale

The burst was solving Race B (artifact's message listener not yet registered when the Viewer posts). The handshake solves this structurally — the artifact only requests the theme after registering its listener. The burst is now redundant for new artifacts. Old artifacts (pre-handshake) still get the theme via immediate send on artifact load and the `load` event, which covers both the cached and uncached paths.

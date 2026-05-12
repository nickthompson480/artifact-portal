---
id: "2026-05-12_portal-theme-load-event-race-with-cached-iframe"
type: lesson
date: 2026-05-12
tags: [react, iframe, theme, timing, race-condition, viewer]
workstream: ""
session: "2026-05-12T05-58"
---

The Viewer's `portal:theme` send was attached via `el.addEventListener('load', send)` only. React 18 schedules `useEffect` as a macrotask (via MessageChannel/scheduler). For cached artifact HTML, the iframe `load` event also fires as a macrotask — the ordering between them is non-deterministic. When `load` fires first, the listener isn't registered yet and the theme is never sent; the artifact falls back to OS preference.

Fix pattern (three layers):
1. **Immediate send** on effect run — covers the cached-load race
2. **`load` listener** — covers fresh/uncached loads
3. **50ms/250ms retry burst** — covers Race B where the artifact's inline `<script>` hasn't registered its `window.addEventListener('message', ...)` yet when the parent sends

Use a `themeRef` (updated in a separate `[theme]` effect) to always capture the latest theme in async callbacks without stale-closure issues.

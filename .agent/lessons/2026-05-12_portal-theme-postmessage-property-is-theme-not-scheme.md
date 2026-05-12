---
id: "2026-05-12_portal-theme-postmessage-property-is-theme-not-scheme"
type: lesson
date: 2026-05-12
tags: [artifact, portal, theme, postmessage, gotcha]
workstream: ""
session: "2026-05-12T05-58"
---

The portal's `portal:theme` postMessage payload uses `{ type: 'portal:theme', theme: 'light'|'dark' }`. The adaptive-color property is **`e.data.theme`**, not `e.data.scheme`. An artifact checking `e.data.scheme` always receives `undefined`, so the condition is never true and the artifact always renders its default (usually dark).

The design-contract template is correct (`e.data.theme`). The bug appeared in an artifact that was hand-authored without following the template exactly. When reviewing or debugging an artifact that ignores the portal's theme toggle, check the message listener property name first.

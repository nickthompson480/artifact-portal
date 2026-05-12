---
id: "2026-05-12_adaptive-color-hard-requirement"
type: lesson
date: 2026-05-12
tags: [design-contract, artifacts, color-scheme]
workstream: ""
session: "2026-05-12T00-36"
routed_to: ["web.artifact-portal"]
---

Adaptive light/dark mode is a hard requirement for all artifacts, not a strong recommendation that can be skipped. Artifacts may choose their own light and dark palettes freely — design freedom applies to the aesthetic, not to whether both modes exist.

Previously, artifacts could use `<!-- design-contract: skip adaptive-color reason=... -->` to opt out. This is no longer valid. The two existing fixed-scheme artifacts were retroactively updated with full adaptive palettes (Opus did the palette design). Future artifacts must implement the `[data-scheme]` + postMessage listener pattern from the start.

The `design-contract: skip adaptive-color` comment should not appear in any new artifact. If the aesthetic is intentionally "dark editorial" or "light parchment," the agent still designs both modes — they just share the same typeface and layout character.

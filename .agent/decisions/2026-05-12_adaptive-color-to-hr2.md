---
id: "2026-05-12_adaptive-color-to-hr2"
type: decision
date: 2026-05-12
scope: "ws-skill-artifact-portal"
choice: "Adaptive color scheme promoted from HR #12 to HR #2 in the Design Contract"
---

## Choice

Requirement #12 (Adaptive color scheme — postMessage portal:theme listener, [data-scheme] CSS) moved to position #2, immediately after the HTML5 document shell.

## Alternatives considered

- Leave at #12 (original position)
- Move to #3 (after color-scheme meta)

## Rationale

Adaptive color is the most portal-specific, most recently mandatory (upgraded from recommendation to hard requirement in the same session it was introduced), and most likely to be missed requirement. Agents skimming the checklist will read the first few requirements more carefully than the last. The SWOT and structural Opus review both independently identified its burial at #12 as a problem. Position #2 ensures it's seen before any code is written.

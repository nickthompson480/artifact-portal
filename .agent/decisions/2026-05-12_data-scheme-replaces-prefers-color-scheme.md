---
id: "2026-05-12_data-scheme-replaces-prefers-color-scheme"
type: decision
date: 2026-05-12
scope: "project"
choice: "Artifacts use [data-scheme] CSS selectors driven by postMessage, not @media (prefers-color-scheme)"
---

## Context

The design contract previously specified `@media (prefers-color-scheme: dark)` as the adaptive color mechanism. This was updated this session after discovering that media queries in sandboxed iframes cannot be overridden by the portal.

## Decision

Adaptive artifacts use `[data-scheme="dark"]` CSS attribute selectors. The `data-scheme` attribute is set on `<html>` by an inline init script that: (1) reads OS `matchMedia` as a standalone fallback, (2) listens for `portal:theme` postMessage to override when inside the viewer.

`:root` carries light defaults + `color-scheme: light`. `[data-scheme="dark"]` carries dark overrides + `color-scheme: dark`.

The `@media (prefers-color-scheme: dark)` pattern is explicitly retired from the design contract for artifacts that run inside the portal.

## Design contract impact

- Design contract updated in CLAUDE.md
- Compliance checklist item updated: "portal:theme postMessage listener + [data-scheme] CSS, OR skip comment"
- Minimal compliant template updated
- All three existing artifacts patched to conform

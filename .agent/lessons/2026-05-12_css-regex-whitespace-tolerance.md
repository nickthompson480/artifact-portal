---
id: "2026-05-12_css-regex-whitespace-tolerance"
type: lesson
date: 2026-05-12
tags: [css, regex, contract-linter, html-linting]
workstream: "ws-api-validate"
session: "2026-05-12T04-57"
routed_to: ["web.artifact-portal/design-contract.md"]
---

All CSS property checks in a regex-based linter must use whitespace-tolerant patterns: `/property-name\s*:\s*value/i`, never `html.includes('property-name: value')`. CSS minifiers (esbuild, lightning-css, clean-css) strip spaces around colons, producing `overflow-x:hidden` instead of `overflow-x: hidden`. Caught by Opus review before implementation — applies to every property check: `min-height`, `overflow-x`, `font-size`, `background`, `max-width`, `@media` rules, and all others.

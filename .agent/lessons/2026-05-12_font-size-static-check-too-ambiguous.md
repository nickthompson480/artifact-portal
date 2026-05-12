---
id: "2026-05-12_font-size-static-check-too-ambiguous"
type: lesson
date: 2026-05-12
tags: [css, regex, contract-linter, html-linting]
workstream: "ws-api-validate"
session: "2026-05-12T04-57"
routed_to: []
---

Static regex cannot reliably verify "body font-size ≥ 16px" as a hard error. Valid compliant patterns are too varied: `16px`, `1rem`, `100%`, `clamp(16px, ...)`, `1.125rem`, `calc(1rem + 2px)`. A naive px-number check would reject `1rem` and `100%`; a "at least one ≥16px value exists" check passes artifacts where 16px appears only in a `.caption` rule. Demote to `warning` severity with message "could not statically verify body font-size ≥ 16px — check manually."

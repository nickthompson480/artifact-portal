---
id: "2026-05-12_opaque-background-transparent-detection"
type: lesson
date: 2026-05-12
tags: [css, regex, contract-linter, html-linting]
workstream: "ws-api-validate"
session: "2026-05-12T04-57"
routed_to: ["web.artifact-portal/design-contract.md"]
---

A "background declaration present" check is insufficient for opaque-background verification. An artifact can include `background: transparent` or `background-color: rgba(0,0,0,0)` — both contain the word "background" but violate the contract (portal dark chrome bleeds through). Two-step check: (1) any background declaration present? (2) if yes, does it match `transparent` or `rgba(...,0)`? Both conditions should emit distinct error rules: `opaque-background` and `opaque-background-transparent`.

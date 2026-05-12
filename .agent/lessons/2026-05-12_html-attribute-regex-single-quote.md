---
id: "2026-05-12_html-attribute-regex-single-quote"
type: lesson
date: 2026-05-12
tags: [regex, html-linting, contract-linter]
workstream: "ws-api-validate"
session: "2026-05-12T04-57"
routed_to: ["web.artifact-portal/design-contract.md"]
---

HTML attribute regex must match both double and single quotes. Template engines (Jinja, Nunjucks, Handlebars) and some agent output use single-quoted attributes: `href='https://...'`, `target='_blank'`. A pattern that only matches `href="..."` silently misses single-quoted external links, producing false negatives on the `external-links` check. Use `["']` in all attribute value captures.

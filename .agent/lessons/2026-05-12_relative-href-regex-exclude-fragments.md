---
id: "2026-05-12_relative-href-regex-exclude-fragments"
type: lesson
date: 2026-05-12
tags: [regex, html-linting, contract-linter]
workstream: "ws-api-validate"
session: "2026-05-12T04-57"
---

Regex that detects relative `href`/`src` paths must explicitly exclude fragment anchors (`#`), `mailto:`, `tel:`, `blob:`, and `javascript:void(0)`. The naive pattern `href="(?!https?://|//|/)[^"]*"` fires on `href="#section-2"` (valid in-page links), causing false positives on any artifact with a table of contents. Also, SVG's `xlink:href="#gradient-1"` is affected — anchor the match to standalone attribute names (`\s(src|href)=`) to avoid matching `xlink:href`, `data-src`, etc.

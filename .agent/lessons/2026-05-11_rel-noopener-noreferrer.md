---
id: "2026-05-11_rel-noopener-noreferrer"
type: lesson
date: 2026-05-11
tags: [security, html-artifacts, links]
workstream: ""
session: "2026-05-11T23-57"
---

External links in HTML artifacts should use `rel="noopener noreferrer"`, not `rel="noopener"` alone. `noreferrer` prevents the Referer header from leaking the artifact's URL to the destination — relevant when artifacts are unlisted or contain sensitive internal URLs in the page path.

Article 2 had four external links all using only `rel="noopener"`. Fixed to `rel="noopener noreferrer"` during design contract compliance pass.

The Design Contract now specifies the full form — future artifacts will get this right.

---
id: 2026-05-12_iframe-sandbox-allow-popups-required
date: 2026-05-12
tags: [iframe, sandbox, links, ux]
workstream: ""
routed_to: "web.artifact-portal"
---

## Lesson

The viewer iframe used `sandbox="allow-scripts"` only. Without `allow-popups`, all `target="_blank"` link clicks are **silently blocked** by the browser — no error, no console message, no visual feedback. The design contract already required `target="_blank" rel="noopener noreferrer"` on external links, but that only works if the sandbox allows popups.

Fix: `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"`. The third token is also needed — without it, the new tab inherits the sandbox and most external sites break.

## Why non-obvious

The design contract's instruction to use `target="_blank"` implies it works. There is no indication in the artifact HTML that the portal's sandbox is the blocker. Clicking links in the viewer simply does nothing, with no hint about why.

## Routed

Appended to `web.artifact-portal` SKILL.md Gotchas.

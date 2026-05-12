---
id: "2026-05-12_prefers-color-scheme-sandboxed-iframes"
type: lesson
date: 2026-05-12
tags: [iframe, sandbox, color-scheme, css, postMessage]
workstream: ""
session: "2026-05-12T00-36"
routed_to: ["web.artifact-portal"]
---

`prefers-color-scheme` inside a sandboxed iframe (no `allow-same-origin`) reflects the OS preference, NOT the parent page's `color-scheme` CSS property or any `data-theme` attribute. Setting `color-scheme: light` on the portal's `:root` or on the `<iframe>` element does NOT propagate into sandboxed artifacts — Chromium, Safari, and Firefox all treat these as opaque-origin documents.

Even where propagation does occur (srcdoc, same-origin iframes), an embedded document that declares its own `color-scheme` (which the design contract requires) overrides any inherited value.

**The working solution:** use `postMessage`. The parent can call `iframe.contentWindow.postMessage(data, '*')` even without `allow-same-origin` — the restriction only goes the other direction (iframe can't read parent DOM). Artifacts listen for `{ type: 'portal:theme', theme: 'light' | 'dark' }` and apply the scheme via `data-scheme` attribute on `<html>`. CSS uses `[data-scheme="dark"]` selectors instead of `@media (prefers-color-scheme: dark)`, with OS `matchMedia` as a standalone fallback.

Opus confirmed: this analysis is correct. The initial assumption that `color-scheme` on `:root` would propagate was wrong.

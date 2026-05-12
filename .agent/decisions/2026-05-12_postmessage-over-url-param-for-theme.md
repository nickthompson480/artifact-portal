---
id: "2026-05-12_postmessage-over-url-param-for-theme"
type: decision
date: 2026-05-12
scope: "project"
choice: "Use postMessage for portal→artifact theme communication, not URL parameters"
---

## Context

The portal's theme (light/dark) was disconnected from artifact `prefers-color-scheme`. Two approaches were on the table: pass `?theme=light` in the iframe `src` URL, or send a `postMessage` after load.

## Decision

postMessage. The portal sends `{ type: 'portal:theme', theme: 'light' | 'dark' }` to `iframeRef.current.contentWindow` on iframe load and on every theme change.

## Why

URL parameter requires iframe reload when the user switches theme mid-view. postMessage delivers the update live without reloading the artifact. Both approaches require updating existing artifacts — that cost is equal either way, so the better UX wins.

## Alternatives rejected

- `color-scheme` CSS property on `:root` or `<iframe>` element: does not propagate `prefers-color-scheme` into sandboxed iframes (no `allow-same-origin`). Confirmed by Opus.
- URL parameter: works, but causes a full iframe reload on theme switch.
- Server-side HTML injection: modifies served files, breaks the static-file mental model.

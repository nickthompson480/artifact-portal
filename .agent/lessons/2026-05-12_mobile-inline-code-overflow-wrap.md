---
id: 2026-05-12_mobile-inline-code-overflow-wrap
date: 2026-05-12
tags: [mobile, css, design-contract, overflow]
workstream: ""
routed_to: "web.artifact-portal"
---

## Lesson

Inline `<code>` elements containing long identifiers or paths (e.g. `@modelcontextprotocol/sdk/server/streamableHttp.js` at 50 chars, `~/Library/Application Support/Claude/claude_desktop_config.json` at 63 chars) cause horizontal layout overflow on mobile without explicit word-break hints.

At ~8px/char monospace on a 360px viewport with typical card padding (~48px), anything over ~39 chars will overflow.

Required CSS on `:not(pre) > code`:
```css
overflow-wrap: anywhere;  /* break at any point if needed */
word-break: break-all;    /* WebKit fallback */
```

Also needed:
- `overflow-wrap: break-word` on `body` as a global fallback
- `min-width: 0` on `pre` inside grid/flex containers (otherwise pre expands the container past max-width)
- `overflow-wrap: break-word; word-break: break-word` on table cells

## Why non-obvious

`body { overflow-x: hidden }` clips overflow visually but doesn't prevent children from being wider than the viewport — the layout is still broken (scroll position, flex/grid sizing). The affected element is `inline` so it doesn't get its own scroll context. Only word-break or overflow-wrap fixes it.

## Routed

Appended to `web.artifact-portal` SKILL.md Gotchas (Design Contract section).

---
name: mobile-image-fixed-px-override
date: 2026-05-12
tags: [mobile, images, css, artifacts]
workstream: ""
---

# Fixed px max-width on img breaks mobile even with max-width:100%

Hero images embedded as base64 with `style="width:100%;max-width:860px;display:block;"` appear oversized on narrow viewports. The `max-width:860px` inline style takes precedence over any `max-width:100%` in the stylesheet, preventing the image from collapsing to viewport width on mobile.

This was observed at `10.0.5.10:3000/a/hermes-vision` (Mac LAN IP accessed from mobile).

**Fix:**
- Use a CSS class (`.artifact-img` or `.hero-image`) with `max-width: 100%` on the element
- Add `max-width: 100% !important` inside `@media (max-width: 768px)` as a safety net
- Never put a fixed px value on `max-width` of an `<img>` — let the container cap the display width instead

The `create.gemini-imagen` skill was updated to document this pattern.

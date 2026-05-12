---
id: "2026-05-12_iframe-flex-min-width"
type: lesson
date: 2026-05-12
tags: [flexbox, iframe, mobile, css]
workstream: ""
session: "2026-05-12T00-36"
---

`<iframe>` elements inside a flex container must have `min-width: 0` to shrink below their intrinsic 300px browser default. Without it, `flex: 1` alone doesn't prevent the iframe from overflowing its container on narrow viewports, causing horizontal scroll on mobile.

The same issue affects any `flex: 1` sibling that uses `overflow: hidden` + `text-overflow: ellipsis` — the text won't ellipsize unless `min-width: 0` is also set. In Viewer.jsx, both the iframe and the title `<span>` had this bug.

Fix: add `minWidth: 0` to the style. The `width: 100%` addition is redundant when `flex: 1` is already set.

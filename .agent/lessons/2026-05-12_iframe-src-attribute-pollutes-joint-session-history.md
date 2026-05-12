---
id: "2026-05-12_iframe-src-attribute-pollutes-joint-session-history"
type: lesson
date: 2026-05-12
tags: [react, iframe, history, back-button, viewer]
workstream: ""
session: "2026-05-12T05-58"
---

Setting an iframe's `src` attribute declaratively (or changing it) pushes a joint session history entry into the top-level browsing context. `navigate(-1)` / `history.go(-1)` steps through this invisible entry first — the URL doesn't visibly change but the user's Back button press is consumed. On a page with multiple artifact navigations this compounds: effectively one extra press is needed per viewer visited.

Fix: drive iframe navigation via `el.contentWindow.location.replace(url)` instead of setting `src`. `replace()` navigates the iframe without adding a history entry in any browsing context. Mount the iframe with no `src` attribute; use a `useEffect` on the artifact ID to call `replace()`.

Fallback pattern for robustness:
```javascript
try {
  el.contentWindow.location.replace(url);
} catch {
  el.src = url; // restores old behaviour; not ideal but not broken
}
```

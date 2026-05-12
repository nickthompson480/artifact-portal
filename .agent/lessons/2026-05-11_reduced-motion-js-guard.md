---
id: "2026-05-11_reduced-motion-js-guard"
type: lesson
date: 2026-05-11
tags: [accessibility, animation, javascript, html-artifacts]
workstream: ""
session: "2026-05-11T23-57"
---

The CSS `@media (prefers-reduced-motion: reduce)` block disables CSS animations and transitions but does NOT stop JS-driven animations. IntersectionObserver reveal callbacks, requestAnimationFrame loops, and mousemove parallax handlers all bypass it entirely.

JS animations need an explicit guard:

```js
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) { /* start animation */ }
```

Article 2 had both an IntersectionObserver reveal and a mouse-parallax handler that ran regardless of the OS reduced-motion setting. Both were gated after the CSS block was added. The CSS block alone was insufficient.

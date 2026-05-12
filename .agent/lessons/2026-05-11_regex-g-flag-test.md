---
id: 2026-05-11_regex-g-flag-test
type: lesson
date: 2026-05-11
tags: [javascript, react, regex, bug]
workstream: ws-search-overlay
---

## Lesson

After `text.split(regex)` with a capture group, odd-indexed parts are match captures and even-indexed parts are literals — always, by spec. Using `regex.test(part)` with the same `/g` regex to detect matches produces alternating wrong results: `.test()` with `/g` advances `lastIndex` on each call, so every other invocation flips between true and false regardless of the actual input.

**Fix:** Use `i % 2 === 1` to identify matched parts after a split with a capture group. Never use `regex.test()` with `/g` in a `.map()` callback.

**Context:** Found in `SearchOverlay.jsx`'s `Highlight` component during the Opus pre-Phase-4 audit. Titles with multiple matches would show alternating correct/incorrect highlighting.

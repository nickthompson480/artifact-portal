---
id: 2026-05-11_html-entity-decode-order
date: 2026-05-11
tags: [html, parsing, strip-html, fts]
workstream: ws-fts-content
routed_to: null
---

## Lesson

When decoding HTML entities in sequence, `&amp;` must be replaced **last**, not first.

If `&amp;` is decoded first:
- `&amp;lt;` → `&lt;` → `<`

The string `&amp;lt;` is the literal text "&lt;" in HTML (used in specs and code reviews). Decoding `&amp;` first silently corrupts it to `<`, polluting the FTS index with garbage tokens.

Correct order: decode all named and numeric entities first (`&lt;`, `&gt;`, `&#x27;`, `&#(\d+);`), then decode `&amp;` last.

Also: only `&#(\d+);` decimal entities were handled — `&#x([0-9a-f]+);` hex entities were missed and pass through as literal text into the index.

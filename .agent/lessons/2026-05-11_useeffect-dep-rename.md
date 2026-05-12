---
date: 2026-05-11
title: useEffect dep array not caught by Vite build when variable renamed
tags: [react, vite, debugging]
workstream: ws-frontend-shell
---

When renaming a `useParams()` destructured variable (e.g. `id` → `slug`), `replace_all` on the variable name missed the `useEffect` dependency arrays because they are written as `[id]` — same token, different semantic role. Vite/esbuild doesn't catch `ReferenceError` on undefined variables in array literals at build time. The app built successfully but crashed silently at runtime, showing a white screen.

**Lesson**: After any `useParams` variable rename, explicitly grep for `[oldName]` in the component file to catch dep arrays. TypeScript would catch this; plain JS does not.

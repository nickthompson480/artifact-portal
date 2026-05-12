---
id: ws-thumbnails
title: Thumbnail generation — Puppeteer screenshot with title-card fallback
state: pending
depends_on: [ws-agent-api, ws-owner-api]
summary: On publish, render the artifact HTML in headless Chromium, capture an 800×600 JPEG, store alongside the artifact. Browse and right pane show the thumbnail. Fallback to an SVG title card when Puppeteer fails or is disabled.
phase: 5
---

## Pre-decision required

Open question §13.1 — confirm with owner before implementing:
- Use Puppeteer? Or always fall back to title-card SVG?
- 800×600 JPEG at quality 70? Or PNG?
- Sync on publish (blocks request) or async via worker_thread (eventual consistency)?

Default recommendation: async via Node `worker_thread`, JPEG 800×600 q70, fallback SVG immediate so the UI never shows a blank tile.

## What done looks like

- `lib/thumbnail.js` exports `generate(artifactId, html) → Promise<filePath>` using Puppeteer.
- On `POST /artifacts` or `POST /api/artifacts`: enqueue a thumbnail generation job (worker_thread) immediately after writing the artifact file. Return artifact response without waiting.
- Thumbnail saved to `~/.artifact-portal/thumbs/<id>.jpg`.
- `GET /artifacts/:id/thumb` streams the thumbnail (or generates a synchronous fallback SVG title card if missing).
- BrowseCard adds an optional thumbnail strip above the metadata (60×40 tile, lazy-loaded `<img>`). When unavailable: category-tinted gradient + serif title.
- RightDetailPane uses the real thumbnail instead of the gradient placeholder.

## Acceptance

1. Publish a new spec artifact → within 2s a thumbnail appears in Browse.
2. Browse with 50 artifacts loads thumbnails lazily (not all at once).
3. Disabling thumbnails in settings (`THUMBNAILS=off` env) makes all routes serve SVG fallbacks.

## Out of scope

- Hover-to-zoom previews
- Video / GIF thumbnails for animated prototypes

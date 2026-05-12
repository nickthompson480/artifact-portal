---
id: ws-thumbnails-decision
type: decision
date: 2026-05-11
choice: SVG title-card only — no Puppeteer
scope: ws-thumbnails
---

## Decision

Generate an SVG title-card thumbnail (artifact title + category color) instead of a Puppeteer-rendered screenshot.

**Why:** `puppeteer-core` + system Chrome adds external dependencies and ~300MB of disk I/O even with `puppeteer-core`. On a personal MacBook portal the visual richness of a screenshot is not worth the overhead. The SVG card is instant, zero-dependency, and always succeeds.

**Async via `worker_thread`:** Thumbnail generation is triggered in a worker thread after the artifact write returns. The main thread does not block. If generation fails, the GET endpoint returns a graceful fallback (same SVG template).

**Storage:** `~/.artifact-portal/thumbs/<id>.svg`. Endpoint: `GET /artifacts/:id/thumb` streams SVG with `Content-Type: image/svg+xml`. No DB column needed — presence on disk is the signal.

**How to apply:** Implement `lib/thumb.js` with `generate(artifact)` → writes SVG to thumbs dir. Spawn from `routes/api.js` and `routes/artifacts.js` after successful artifact write.

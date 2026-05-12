---
date: 2026-05-11
slug: webhook-https-only-ui
tags: [webhooks, settings, testing]
workstream: ~
---

The webhook registration UI (`POST /settings/webhooks`) enforces `parsedUrl.protocol === 'https:'` (routes/settings.js:102). You cannot register an `http://localhost` receiver through the UI — only through direct DB insertion. This makes local end-to-end testing impossible via the normal UI flow. Use the sqlite3 CLI or a one-shot Node script to insert a test webhook row directly.

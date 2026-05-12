---
date: 2026-05-11
slug: webhook-success-not-logged
tags: [webhooks, logging, observability]
workstream: ~
routed_to: web.artifact-portal
---

Successful webhook deliveries are not written to `~/.artifact-portal/logs/webhook.log` — only failures and errors are logged there. Success is only recorded in the DB (`webhooks.last_status = '200'`, `last_triggered_at`). If you want a full success audit trail in the log, add an `else` branch after `if (!res.ok) logWebhook(...)` in `lib/webhooks.js:31`.

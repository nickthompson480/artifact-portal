---
id: ws-webhooks
title: Outbound webhooks on artifact publish events
state: pending
depends_on: [ws-agent-api, ws-owner-api]
summary: Configurable outbound POST to a user-defined URL whenever an artifact is published, updated, deleted, or its visibility changes. Useful for piping events into other tools (Slack, iMessage, custom dashboards).
phase: 5
---

## Pre-decision required

Open question §13.5:
- Multiple webhooks or just one URL?
- Per-event-type filtering (publish only, vs. publish+update)?
- Signed payloads (HMAC) — needed for localhost? Likely yes for tunnel/share use.
- Default: single global URL, optional HMAC secret, all events fire.

## What done looks like

- New settings keys: `webhook_url`, `webhook_secret`, `webhook_events` (CSV: `publish,update,delete,share`).
- Settings UI adds a Webhooks section: URL input, generate-secret button, event checkbox list, "Test" button.
- On artifact lifecycle events, the relevant route enqueues a POST job (worker_thread / `setImmediate`).
- POST body: `{ event, artifact: {id, title, slug, category, visibility, url}, timestamp }`.
- Header `X-Portal-Signature: sha256=<hex>` when secret is set (HMAC over body).
- Retries: 3 attempts with backoff (1s, 5s, 30s); failures logged to `~/.artifact-portal/logs/webhook.log`.

## Acceptance

1. Setting a webhook URL and publishing an artifact triggers a POST visible at the listener within 1s.
2. HMAC verifies on the receiver side.
3. Disabling webhooks (clear URL) stops all events.

## Out of scope

- Multiple webhook endpoints — defer.
- Inbound webhooks / OAuth — not in scope.

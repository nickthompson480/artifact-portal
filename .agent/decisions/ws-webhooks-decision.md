---
id: ws-webhooks-decision
type: decision
date: 2026-05-11
choice: up to 5 URLs, HMAC-SHA256 signature, 3 event types, setImmediate retry queue
scope: ws-webhooks
---

## Decision

**Max URLs:** 5 active webhook endpoints (soft limit enforced at creation).

**Events:** `artifact.created`, `artifact.updated`, `artifact.deleted` (soft delete). No events for owner-only actions (settings changes, key creation).

**Payload:** `{ event, artifact: { id, title, slug, category, visibility, published_by, created_at, updated_at }, timestamp }`.

**Signature:** `X-Portal-Signature: sha256=<hmac>` using the webhook's `secret` field (bcrypt NOT used here — HMAC-SHA256 with a stored plaintext secret, shown once at creation). The secret is stored plaintext in the DB since it's needed for every delivery.

**Retry:** 3 attempts with exponential backoff (1s, 5s, 30s) via `setImmediate`/`setTimeout` queue. Log failures to `~/.artifact-portal/logs/webhook.log`. No persistent retry queue (in-memory only — if process restarts, queued retries are lost, which is acceptable for a personal portal).

**Table:** `webhooks(id, url, secret, events TEXT (JSON array), created_at, last_triggered_at, last_status TEXT)`. No revoked_at — delete to remove.

**How to apply:** Migration `0005-webhooks.sql`. Implement `lib/webhooks.js` with `dispatch(event, artifact)`. Call from route handlers after successful write operations.

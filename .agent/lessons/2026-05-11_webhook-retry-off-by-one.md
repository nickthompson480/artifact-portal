---
id: 2026-05-11_webhook-retry-off-by-one
date: 2026-05-11
tags: [webhooks, retry, off-by-one]
workstream: ws-webhooks
routed_to: null
---

## Lesson

Webhook retry off-by-one: passing `attempt + 1` to `scheduleRetry` at the call site skips the first retry entirely.

**Buggy:**
```js
deliver(hook, payload, 1).then(ok => {
  if (!ok) scheduleRetry(hook, payload, 2);  // skips attempt 2, uses wrong delay
});

function scheduleRetry(webhook, payload, attempt) {
  // attempt=2 → delays[1]=5000ms → deliver(..., 3)   ← attempt 2 never runs
}
```

**Fixed:** pass `1` to `scheduleRetry` so it schedules attempt 2 with `delays[0]=1000ms`:
```js
if (!ok) scheduleRetry(hook, payload, 1);
```

Net effect of the bug: only 2 retries fire (not 3), the 1000ms first-retry delay is dead code, and the `attempt` number logged is wrong.

import { createHmac } from 'crypto';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { db } from './db.js';
import { LOGS_DIR } from './config.js';

function logWebhook(msg) {
  try {
    mkdirSync(LOGS_DIR, { recursive: true });
    appendFileSync(join(LOGS_DIR, 'webhook.log'), `[${new Date().toISOString()}] ${msg}\n`, 'utf8');
  } catch (_) {}
}

async function deliver(webhook, payload, attempt = 1) {
  const body = JSON.stringify(payload);
  const sig = createHmac('sha256', webhook.secret).update(body).digest('hex');
  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Portal-Signature': `sha256=${sig}`,
        'X-Portal-Event': payload.event,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
    const status = `${res.status}`;
    db.prepare('UPDATE webhooks SET last_triggered_at = ?, last_status = ? WHERE id = ?')
      .run(new Date().toISOString(), status, webhook.id);
    if (!res.ok) logWebhook(`FAIL ${webhook.url} → ${res.status} (attempt ${attempt})`);
    return res.ok;
  } catch (err) {
    db.prepare('UPDATE webhooks SET last_triggered_at = ?, last_status = ? WHERE id = ?')
      .run(new Date().toISOString(), `error: ${err.message}`, webhook.id);
    logWebhook(`ERROR ${webhook.url}: ${err.message} (attempt ${attempt})`);
    return false;
  }
}

function scheduleRetry(webhook, payload, attempt) {
  if (attempt > 3) return;
  const delays = [1000, 5000, 30000];
  setTimeout(() => deliver(webhook, payload, attempt + 1).then(ok => {
    if (!ok) scheduleRetry(webhook, payload, attempt + 1);
  }), delays[attempt - 1]);
}

export function dispatch(event, artifact) {
  // Fire-and-forget: don't block the HTTP response
  setImmediate(() => {
    const hooks = db.prepare('SELECT * FROM webhooks').all();
    for (const hook of hooks) {
      let events;
      try { events = JSON.parse(hook.events); } catch { events = []; }
      if (!events.includes(event)) continue;

      const payload = {
        event,
        artifact: {
          id: artifact.id, title: artifact.title, slug: artifact.slug,
          category: artifact.category, visibility: artifact.visibility,
          published_by: artifact.published_by,
          created_at: artifact.created_at, updated_at: artifact.updated_at,
        },
        timestamp: new Date().toISOString(),
      };

      deliver(hook, payload, 1).then(ok => {
        if (!ok) scheduleRetry(hook, payload, 1);
      });
    }
  });
}

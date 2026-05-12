#!/usr/bin/env node
// Minimal webhook receiver for end-to-end testing of lib/webhooks.js.
//
// Usage:
//   WEBHOOK_SECRET=<secret> node scripts/test-webhook-receiver.js [port]
//
// Listens on PORT (default 8765), accepts POST with a JSON body, verifies the
// X-Portal-Signature: sha256=<hex> header against WEBHOOK_SECRET, and prints
// the headers + body to stdout. Always responds 200 OK so deliver() records
// success in the webhooks table.

import { createServer } from 'http';
import { createHmac, timingSafeEqual } from 'crypto';

const PORT = parseInt(process.argv[2] || process.env.PORT || '8765', 10);
const SECRET = process.env.WEBHOOK_SECRET;

if (!SECRET) {
  console.error('[receiver] FATAL: set WEBHOOK_SECRET env var');
  process.exit(1);
}

function verify(secret, body, headerSig) {
  if (!headerSig || !headerSig.startsWith('sha256=')) return false;
  const provided = headerSig.slice('sha256='.length);
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
}

const server = createServer((req, res) => {
  let chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');
    const sig = req.headers['x-portal-signature'];
    const evt = req.headers['x-portal-event'];
    const ok = verify(SECRET, body, sig);

    console.log('---');
    console.log(`[receiver] ${req.method} ${req.url}`);
    console.log(`[receiver] X-Portal-Event:     ${evt}`);
    console.log(`[receiver] X-Portal-Signature: ${sig}`);
    console.log(`[receiver] Content-Type:       ${req.headers['content-type']}`);
    console.log(`[receiver] signature valid:    ${ok ? 'YES' : 'NO'}`);
    console.log('[receiver] body:');
    try { console.log(JSON.stringify(JSON.parse(body), null, 2)); }
    catch { console.log(body); }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, signature_valid: ok }));
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[receiver] listening on http://127.0.0.1:${PORT}`);
  console.log(`[receiver] using secret prefix: ${SECRET.slice(0, 6)}…`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));

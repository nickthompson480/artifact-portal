import { compare } from '../lib/passwords.js';
import { db } from '../lib/db.js';

export async function requireApiKey(req, res, next) {
  const incoming = req.headers['x-api-key'];
  if (!incoming) return res.status(401).json({ code: 'INVALID_API_KEY' });

  // Short-circuit via stored prefix — avoids O(N) bcrypt calls for non-matching keys.
  // 12 chars: 'pk_live_' (8) + 4 random chars — enough to distinguish keys. 8 was useless (all keys share 'pk_live_').
  const prefix = incoming.slice(0, 12);
  const keys = db.prepare(
    'SELECT * FROM api_keys WHERE revoked_at IS NULL AND key_prefix = ?'
  ).all(prefix);

  for (const row of keys) {
    const match = await compare(incoming, row.key_hash);
    if (match) {
      db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?')
        .run(new Date().toISOString(), row.id);
      req.apiKey = { id: row.id, name: row.name };
      return next();
    }
  }

  return res.status(401).json({ code: 'INVALID_API_KEY' });
}

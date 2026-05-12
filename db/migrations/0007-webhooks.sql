CREATE TABLE IF NOT EXISTS webhooks (
  id               TEXT PRIMARY KEY,
  url              TEXT NOT NULL,
  secret           TEXT NOT NULL,
  events           TEXT NOT NULL DEFAULT '["artifact.created","artifact.updated","artifact.deleted"]',
  created_at       TEXT NOT NULL,
  last_triggered_at TEXT,
  last_status      TEXT
);

-- ── artifacts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artifacts (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  tags          TEXT NOT NULL DEFAULT '[]',
  category      TEXT NOT NULL DEFAULT 'other'
                 CHECK (category IN ('spec','report','prototype','review','other')),
  visibility    TEXT NOT NULL DEFAULT 'private'
                 CHECK (visibility IN ('private','unlisted','public')),
  share_token   TEXT,
  share_expires_at TEXT,
  share_password_hash TEXT,
  pinned        INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0,1)),
  file_path     TEXT NOT NULL,
  file_size     INTEGER NOT NULL DEFAULT 0,
  published_by  TEXT NOT NULL DEFAULT 'manual',
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_artifacts_created ON artifacts(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_artifacts_share   ON artifacts(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artifacts_slug    ON artifacts(slug);
CREATE INDEX IF NOT EXISTS idx_artifacts_pinned  ON artifacts(pinned, created_at DESC) WHERE deleted_at IS NULL;

-- ── full-text search (title + description + tags) ───────────────────────
CREATE VIRTUAL TABLE IF NOT EXISTS artifacts_fts USING fts5(
  title, description, tags,
  content=artifacts,
  content_rowid=rowid
);

CREATE TRIGGER IF NOT EXISTS artifacts_ai AFTER INSERT ON artifacts BEGIN
  INSERT INTO artifacts_fts(rowid, title, description, tags)
  VALUES (new.rowid, new.title, new.description, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS artifacts_ad AFTER DELETE ON artifacts BEGIN
  INSERT INTO artifacts_fts(artifacts_fts, rowid, title, description, tags)
  VALUES('delete', old.rowid, old.title, old.description, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS artifacts_au AFTER UPDATE ON artifacts BEGIN
  INSERT INTO artifacts_fts(artifacts_fts, rowid, title, description, tags)
  VALUES('delete', old.rowid, old.title, old.description, old.tags);
  INSERT INTO artifacts_fts(rowid, title, description, tags)
  VALUES (new.rowid, new.title, new.description, new.tags);
END;

-- ── api_keys ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  key_hash      TEXT NOT NULL,
  key_prefix    TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  last_used_at  TEXT,
  revoked_at    TEXT
);

-- ── settings ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings VALUES ('portal_title', 'Artifact Portal');
INSERT OR IGNORE INTO settings VALUES ('public_index_enabled', 'false');
INSERT OR IGNORE INTO settings VALUES ('password_hash', '');

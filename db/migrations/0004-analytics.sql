CREATE TABLE IF NOT EXISTS artifact_views (
  id          TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'owner',
  viewed_at   TEXT NOT NULL,
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_views_artifact ON artifact_views(artifact_id);

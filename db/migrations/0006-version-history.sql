CREATE TABLE IF NOT EXISTS artifact_versions (
  id          TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL,
  version_num INTEGER NOT NULL,
  file_path   TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_versions_artifact ON artifact_versions(artifact_id, version_num DESC);

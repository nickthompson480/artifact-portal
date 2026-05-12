-- Add content_text column to artifacts
ALTER TABLE artifacts ADD COLUMN content_text TEXT;

-- Rebuild FTS5 to include content_text
-- Drop virtual table (data is in artifacts table, so no content loss)
DROP TABLE IF EXISTS artifacts_fts;
CREATE VIRTUAL TABLE artifacts_fts USING fts5(
  title, description, tags, content_text,
  content=artifacts,
  content_rowid=rowid
);

-- Replace triggers to include content_text
DROP TRIGGER IF EXISTS artifacts_ai;
DROP TRIGGER IF EXISTS artifacts_ad;
DROP TRIGGER IF EXISTS artifacts_au;

CREATE TRIGGER artifacts_ai AFTER INSERT ON artifacts BEGIN
  INSERT INTO artifacts_fts(rowid, title, description, tags, content_text)
  VALUES (new.rowid, new.title, new.description, new.tags, new.content_text);
END;

CREATE TRIGGER artifacts_ad AFTER DELETE ON artifacts BEGIN
  INSERT INTO artifacts_fts(artifacts_fts, rowid, title, description, tags, content_text)
  VALUES('delete', old.rowid, old.title, old.description, old.tags, old.content_text);
END;

CREATE TRIGGER artifacts_au AFTER UPDATE ON artifacts BEGIN
  INSERT INTO artifacts_fts(artifacts_fts, rowid, title, description, tags, content_text)
  VALUES('delete', old.rowid, old.title, old.description, old.tags, old.content_text);
  INSERT INTO artifacts_fts(rowid, title, description, tags, content_text)
  VALUES (new.rowid, new.title, new.description, new.tags, new.content_text);
END;

-- Rebuild the FTS index from existing rows (content_text will be NULL for old rows until reindexed)
INSERT INTO artifacts_fts(artifacts_fts) VALUES('rebuild');

import { Router } from 'express';
import { ZipArchive } from 'archiver';
import { existsSync } from 'fs';
import { join } from 'path';
import { db } from '../lib/db.js';
import { FILES_DIR, THUMBS_DIR } from '../lib/config.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/export.zip', requireAuth, (req, res) => {
  const { include_deleted, since } = req.query;

  let query = 'SELECT * FROM artifacts';
  const conditions = [];
  const params = [];

  if (!include_deleted) conditions.push('deleted_at IS NULL');
  if (since) { conditions.push('created_at > ?'); params.push(since); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at ASC';

  const artifacts = db.prepare(query).all(...params);

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="artifact-portal-export-${new Date().toISOString().slice(0, 10)}.zip"`
  );

  const archive = new ZipArchive({ zlib: { level: 6 } });
  archive.on('error', err => {
    console.error('[export]', err);
    if (!res.headersSent) {
      res.status(500).end();
    } else {
      // Headers already sent — abort the stream so the client gets a hard error
      // instead of silently receiving a truncated/corrupt zip.
      archive.abort();
      res.destroy();
    }
  });
  archive.pipe(res);

  // manifest.json — metadata for every included artifact
  const manifest = artifacts.map(a => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    description: a.description,
    tags: JSON.parse(a.tags || '[]'),
    category: a.category,
    visibility: a.visibility,
    published_by: a.published_by,
    created_at: a.created_at,
    updated_at: a.updated_at,
    deleted_at: a.deleted_at,
    file: `files/${a.id}.html`,
  }));
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

  for (const a of artifacts) {
    // HTML file
    const htmlPath = join(FILES_DIR, `${a.id}.html`);
    if (existsSync(htmlPath)) archive.file(htmlPath, { name: `files/${a.id}.html` });

    // Thumbnail — gracefully skipped if ws-thumbnails is not yet shipped
    const thumbPath = join(THUMBS_DIR, `${a.id}.svg`);
    if (existsSync(thumbPath)) archive.file(thumbPath, { name: `thumbs/${a.id}.svg` });
  }

  archive.finalize();
});

export default router;

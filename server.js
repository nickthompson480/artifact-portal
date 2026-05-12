import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cookieParser from 'cookie-parser';
import { ensureDirs, resolveJwtSecret, FILES_DIR, PORT } from './lib/config.js';
import { getDb } from './lib/db.js';
import authRouter from './routes/auth.js';
import apiRouter from './routes/api.js';
import artifactsRouter from './routes/artifacts.js';
import settingsRouter from './routes/settings.js';
import shareRouter from './routes/share.js';
import exportRouter from './routes/export.js';
import { errorHandler } from './middleware/error.js';

// Boot sequence: dirs first so DB path exists before SQLite opens it.
ensureDirs();
export const JWT_SECRET = resolveJwtSecret();
getDb();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(cookieParser());

// ── API routes ────────────────────────────────────────────────────────────
app.get('/healthz', (_req, res) => {
  res.json({ ok: true, db: 'connected', files_dir: FILES_DIR });
});

app.use('/', authRouter);
app.use('/api', apiRouter);
app.use('/', artifactsRouter);
app.use('/', settingsRouter);
app.use('/', shareRouter);
app.use('/', exportRouter);

// ── Static + SPA fallback (must come after all API routes) ────────────────
const PUBLIC_DIR = join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR));

// Express 5 requires a named wildcard or regex — bare '*' throws at boot.
app.get(/.*/, (_req, res, next) => {
  res.sendFile(join(PUBLIC_DIR, 'index.html'), (err) => {
    if (!err) return;
    if (err.code === 'ENOENT') {
      return res.status(404).type('text').send(
        'Frontend not built. Run: cd frontend && npm run build'
      );
    }
    next(err);
  });
});

// ── Error handler (must be last) ─────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[portal] listening on http://0.0.0.0:${PORT}`);
});

export { app };

import multer from 'multer';

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  // Filter on filename extension only — Content-Type is unreliable across curl, fetch, and agent toolchains.
  const name = (file.originalname || '').toLowerCase();
  if (name.endsWith('.html') || name.endsWith('.htm')) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Only .html files are accepted'), { code: 'INVALID_FILE_TYPE' }));
  }
}

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

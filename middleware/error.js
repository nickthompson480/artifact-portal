// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ code: 'VALIDATION_ERROR', detail: 'malformed_json' });
  }
  console.error('[portal] unhandled error:', err);
  res.status(500).json({ code: 'INTERNAL' });
}

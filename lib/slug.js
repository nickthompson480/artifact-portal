import { db } from './db.js';

export function slugify(title) {
  // Slice before trimming dashes — avoids trailing '-' when the 61st char is a separator.
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 60)
    .replace(/^-+|-+$/g, '') || 'artifact';
}

// Slug uniqueness spans soft-deleted rows — preserves restore without slug conflict.
export function uniqueSlug(title, excludeId = null) {
  const base = slugify(title);
  let candidate = base;
  let n = 2;
  while (true) {
    const row = db.prepare(
      'SELECT id FROM artifacts WHERE slug = ? AND (? IS NULL OR id != ?)',
    ).get(candidate, excludeId, excludeId);
    if (!row) return candidate;
    candidate = `${base}-${n++}`;
  }
}

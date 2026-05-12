export const VALID_CATEGORIES = ['spec', 'report', 'prototype', 'review', 'other'];
export const VALID_VISIBILITIES = ['private', 'unlisted', 'public'];

const COL_TAG_RE = /^col\/[a-z0-9-]{1,40}$/;

export function parseTags(raw) {
  if (raw == null) return [];
  let arr;
  if (typeof raw === 'string' && raw.trimStart().startsWith('[')) {
    try { arr = JSON.parse(raw); } catch { arr = raw.split(','); }
  } else if (typeof raw === 'string') {
    arr = raw.split(',');
  } else if (Array.isArray(raw)) {
    arr = raw;
  } else {
    arr = [];
  }
  if (!Array.isArray(arr)) arr = [];
  return [...new Set(
    arr
      .filter(t => t != null && typeof t !== 'object')
      .map(t => String(t).trim().toLowerCase())
      .filter(t => t && t.length <= 32),
  )].slice(0, 12);
}

/**
 * Validate that any col/ prefixed tags are well-formed.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateCollectionTags(tags) {
  for (const tag of tags) {
    if (tag.startsWith('col/') && !COL_TAG_RE.test(tag)) {
      return 'Invalid collection tag format. Use col/<name> where name is 1–40 lowercase letters, digits, or hyphens.';
    }
  }
  return null;
}

// Explicit allowlist — never leaks internal fields (file_path, share_password_hash).
export function formatArtifact(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    tags: JSON.parse(row.tags || '[]'),
    category: row.category,
    visibility: row.visibility,
    share_token: row.share_token,
    share_expires_at: row.share_expires_at,
    has_share_password: Boolean(row.share_password_hash),
    pinned: row.pinned === 1,
    file_url: `/artifacts/${row.id}/file`,
    file_size: row.file_size,
    published_by: row.published_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    view_count: row.view_count ?? 0,
  };
}

import { getCatColors, CATEGORY_META } from '../utils/category.js';

export function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.other;
  const c = getCatColors(category);
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      fontWeight: 500,
      padding: '2px 8px',
      borderRadius: 'var(--radius-pill)',
      color: c.color,
      background: c.bg,
      border: `1px solid ${c.border}`,
      letterSpacing: '.04em',
      lineHeight: 1.6,
      flexShrink: 0,
    }}>
      {meta.label}
    </span>
  );
}

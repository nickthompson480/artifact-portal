export const CATEGORY_META = {
  spec:      { label: 'Spec',   varName: 'amber'  },
  report:    { label: 'Report', varName: 'teal'   },
  prototype: { label: 'Proto',  varName: 'purple' },
  review:    { label: 'Review', varName: 'coral'  },
  other:     { label: 'Other',  varName: 'blue'   },
};

export const CAT_COLORS = {
  amber:  { color: 'var(--cat-amber)',  bg: 'var(--cat-amber-bg)',  border: 'var(--cat-amber-bd)'  },
  teal:   { color: 'var(--cat-teal)',   bg: 'var(--cat-teal-bg)',   border: 'var(--cat-teal-bd)'   },
  purple: { color: 'var(--cat-purple)', bg: 'var(--cat-purple-bg)', border: 'var(--cat-purple-bd)' },
  coral:  { color: 'var(--cat-coral)',  bg: 'var(--cat-coral-bg)',  border: 'var(--cat-coral-bd)'  },
  blue:   { color: 'var(--cat-blue)',   bg: 'var(--cat-blue-bg)',   border: 'var(--cat-blue-bd)'   },
};

export function getCatColors(category) {
  const meta = CATEGORY_META[category] || CATEGORY_META.other;
  return CAT_COLORS[meta.varName] || CAT_COLORS.blue;
}

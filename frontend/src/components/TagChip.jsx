export function TagChip({ tag, active, onClick }) {
  const base = {
    appearance: 'none',
    background: active ? 'var(--bg3)' : 'transparent',
    color: active ? 'var(--text2)' : 'var(--text3)',
    border: `1px solid ${active ? 'var(--border2)' : 'var(--border)'}`,
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    letterSpacing: '.04em',
    padding: '2px 8px',
    borderRadius: 12,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all var(--t-fast)',
    lineHeight: 1.6,
    whiteSpace: 'nowrap',
  };
  if (onClick) {
    return (
      <button
        style={base}
        onClick={onClick}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'var(--border2)'; } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border)'; } }}
      >
        {tag}
      </button>
    );
  }
  return <span style={base}>{tag}</span>;
}

export function IconBtn({ children, onClick, title, active, style }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        appearance: 'none',
        background: active ? 'var(--bg3)' : 'none',
        border: `1px solid ${active ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '4px 9px',
        color: active ? 'var(--text)' : 'var(--text3)',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        cursor: 'pointer',
        transition: 'all var(--t-fast)',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border2)'; }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border)'; } }}
    >
      {children}
    </button>
  );
}

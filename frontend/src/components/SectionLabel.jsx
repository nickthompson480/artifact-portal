export function SectionLabel({ label }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '9px',
      fontWeight: 500,
      letterSpacing: '.1em',
      color: 'var(--text3)',
      textTransform: 'uppercase',
      padding: '0 0 8px',
    }}>
      {label}
    </div>
  );
}

export function AgentBadge({ publishedBy }) {
  const isAI = publishedBy !== 'manual';
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: isAI ? 'var(--cat-teal)' : 'var(--text3)',
      letterSpacing: '.03em',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
    }}>
      <span style={{ opacity: .7 }}>{isAI ? '⟡' : '✎'}</span>
      {publishedBy}
    </span>
  );
}

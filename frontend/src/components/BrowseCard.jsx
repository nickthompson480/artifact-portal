import { CategoryBadge } from './CategoryBadge.jsx';
import { TagChip } from './TagChip.jsx';
import { VisibilityDot } from './VisibilityDot.jsx';
import { formatSize, timeLabel } from '../utils/format.js';

export function BrowseCard({ artifact, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? 'var(--bg3)' : 'var(--bg2)',
        border: `1px solid ${selected ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'border-color var(--t-fast), background var(--t-fast)',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg2h)'; } }}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg2)'; } }}
    >
      {artifact.pinned && (
        <span style={{ position: 'absolute', top: 10, right: 10, fontSize: '11px', opacity: .5 }}>📌</span>
      )}
      <div style={{ marginBottom: 8 }}>
        <CategoryBadge category={artifact.category} />
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {artifact.title}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {(artifact.tags || []).slice(0, 3).map(t => <TagChip key={t} tag={t} />)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <VisibilityDot visibility={artifact.visibility} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)', flex: 1 }}>{formatSize(artifact.file_size)}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>{timeLabel(artifact.created_at)}</span>
      </div>
    </div>
  );
}

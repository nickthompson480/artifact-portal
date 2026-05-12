import { useNavigate } from 'react-router-dom';
import { CategoryBadge } from './CategoryBadge.jsx';
import { TagChip } from './TagChip.jsx';
import { AgentBadge } from './AgentBadge.jsx';
import { VisibilityDot } from './VisibilityDot.jsx';
import { IconBtn } from './IconBtn.jsx';
import { getCatColors } from '../utils/category.js';
import { formatSize, timeLabel } from '../utils/format.js';
import { useStore } from '../state/store.js';

export function FeedCardRich({ artifact, onShare, hideTags }) {
  const navigate = useNavigate();
  const setTagFilter = useStore(s => s.setTagFilter);
  const c = getCatColors(artifact.category);

  return (
    <div
      onClick={() => navigate(`/a/${artifact.slug}`)}
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        borderLeft: `3px solid ${c.color}`,
        padding: '14px 16px 12px',
        cursor: 'pointer',
        transition: 'border-color var(--t-fast), background var(--t-fast)',
        marginBottom: 10,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg2h)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg2)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <CategoryBadge category={artifact.category} />
        <span style={{ flex: 1, fontFamily: 'var(--font-head)', fontSize: '19px', lineHeight: 1.25, color: 'var(--text)', letterSpacing: '-.01em' }}>
          {artifact.title}
        </span>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <IconBtn title="Share" onClick={() => onShare(artifact)}>Share</IconBtn>
        </div>
      </div>
      {artifact.description && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text2)', lineHeight: 1.65, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {artifact.description}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {!hideTags && (artifact.tags || []).slice(0, 4).map(t => (
          <TagChip key={t} tag={t} onClick={e => { e.stopPropagation(); setTagFilter(t); }} />
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <VisibilityDot visibility={artifact.visibility} />
          <AgentBadge publishedBy={artifact.published_by} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>{formatSize(artifact.file_size)}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>{timeLabel(artifact.created_at)}</span>
          {artifact.view_count > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>
              {artifact.view_count} view{artifact.view_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

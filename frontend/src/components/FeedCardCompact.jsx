import { useNavigate } from 'react-router-dom';
import { CategoryBadge } from './CategoryBadge.jsx';
import { TagChip } from './TagChip.jsx';
import { VisibilityDot } from './VisibilityDot.jsx';
import { timeLabel } from '../utils/format.js';
import { useStore } from '../state/store.js';

export function FeedCardCompact({ artifact, hideTags }) {
  const navigate = useNavigate();
  const setTagFilter = useStore(s => s.setTagFilter);

  return (
    <div
      onClick={() => navigate(`/a/${artifact.slug}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'background var(--t-fast)',
        borderRadius: 4,
        paddingLeft: 8,
        paddingRight: 8,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg2)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <CategoryBadge category={artifact.category} />
      <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {artifact.title}
      </span>
      {!hideTags && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {(artifact.tags || []).slice(0, 2).map(t => (
            <TagChip key={t} tag={t} onClick={e => { e.stopPropagation(); setTagFilter(t); }} />
          ))}
        </div>
      )}
      <VisibilityDot visibility={artifact.visibility} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)', flexShrink: 0 }}>
        {timeLabel(artifact.created_at)}
      </span>
    </div>
  );
}

import { CategoryBadge } from './CategoryBadge.jsx';
import { AgentBadge } from './AgentBadge.jsx';
import { TagChip } from './TagChip.jsx';
import { SectionLabel } from './SectionLabel.jsx';
import { IconBtn } from './IconBtn.jsx';
import { formatSize, timeLabel } from '../utils/format.js';
import { getCatColors, CATEGORY_META } from '../utils/category.js';

const LABEL = {
  display: 'block',
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  color: 'var(--text3)',
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  marginBottom: 4,
};

export function RightDetailPane({ artifact, onClose, onNavigate, onShare }) {
  const meta = artifact ? (CATEGORY_META[artifact.category] || CATEGORY_META.other) : null;
  const catColors = artifact ? getCatColors(artifact.category) : null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: 280,
        zIndex: 50,
        background: 'var(--bg2)',
        borderLeft: '1px solid var(--border)',
        transform: artifact ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform var(--t-drawer)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <SectionLabel label="SELECTED" />
          <IconBtn onClick={onClose} title="Close detail pane">×</IconBtn>
        </div>

        {!artifact ? (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: '13px',
            color: 'var(--text3)',
          }}>
            Select an artifact
          </p>
        ) : (
          <>
            {/* Title gradient area */}
            <div style={{
              height: 130,
              background: 'linear-gradient(135deg, var(--bg3), var(--bg2))',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              marginBottom: 14,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
            }}>
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: catColors.color,
                flexShrink: 0,
              }} />
              <p style={{
                fontFamily: 'var(--font-head)',
                fontStyle: 'italic',
                fontSize: '18px',
                color: 'var(--text)',
                marginTop: 8,
                marginBottom: 0,
                lineHeight: 1.35,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {artifact.title}
              </p>
            </div>

            {/* Meta rows */}
            <div style={{ marginBottom: 10 }}>
              <span style={LABEL}>Category</span>
              <CategoryBadge category={artifact.category} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <span style={LABEL}>Published by</span>
              <AgentBadge publishedBy={artifact.published_by} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <span style={LABEL}>Size</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text2)' }}>
                {formatSize(artifact.file_size)}
              </span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <span style={LABEL}>Published</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text2)' }}>
                {timeLabel(artifact.created_at)}
              </span>
            </div>

            {/* Tags */}
            {artifact.tags && artifact.tags.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <span style={LABEL}>Tags</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {artifact.tags.map(t => <TagChip key={t} tag={t} />)}
                </div>
              </div>
            )}

            {/* Description */}
            {artifact.description && (
              <div style={{ marginBottom: 16 }}>
                <span style={LABEL}>Description</span>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  color: 'var(--text2)',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {artifact.description}
                </p>
              </div>
            )}

            {/* Open artifact CTA */}
            <button
              onClick={() => onNavigate('/a/' + artifact.slug)}
              style={{
                width: '100%',
                background: 'var(--cat-teal-bg)',
                border: '1px solid var(--cat-teal-bd)',
                color: 'var(--cat-teal)',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 500,
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                appearance: 'none',
              }}
            >
              Open artifact
            </button>

            {/* Share secondary button */}
            <button
              onClick={() => onShare(artifact)}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text2)',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 500,
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                appearance: 'none',
                marginTop: 6,
              }}
            >
              Share…
            </button>
          </>
        )}
      </div>
    </div>
  );
}

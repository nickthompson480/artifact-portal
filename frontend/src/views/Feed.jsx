import { useState, useEffect } from 'react';
import { useStore } from '../state/store.js';
import { FeedCardRich } from '../components/FeedCardRich.jsx';
import { FeedCardCompact } from '../components/FeedCardCompact.jsx';
import { SectionLabel } from '../components/SectionLabel.jsx';
import { TagChip } from '../components/TagChip.jsx';
import { groupByDay } from '../utils/groupBy.js';
import { useIsMobile } from '../utils/useIsMobile.js';
import * as api from '../data/api.js';

function useIsVeryNarrow() {
  const [narrow, setNarrow] = useState(() => window.innerWidth <= 480);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 480px)');
    const handler = (e) => setNarrow(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return narrow;
}

export function Feed() {
  const { tagFilter, setTagFilter, collapsedDays, toggleDay, openShare, density } = useStore(s => ({
    tagFilter: s.tagFilter,
    setTagFilter: s.setTagFilter,
    collapsedDays: s.collapsedDays,
    toggleDay: s.toggleDay,
    openShare: s.openShare,
    density: s.density,
  }));
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const isMobile = useIsMobile();
  const isVeryNarrow = useIsVeryNarrow();

  useEffect(() => {
    setLoading(true);
    const params = { sort: 'newest', limit: 500 };
    if (tagFilter) params.tag = tagFilter;
    setFetchError(false);
    api.listArtifacts(params)
      .then(data => setArtifacts(data.artifacts || []))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [tagFilter]);

  const pinned = artifacts.filter(a => a.pinned);
  const unpinned = artifacts.filter(a => !a.pinned);
  const groups = groupByDay(unpinned);

  if (loading) {
    return <div style={{ padding: '40px 24px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text3)' }}>Loading…</div>;
  }
  if (fetchError) {
    return <div style={{ padding: '40px 24px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--cat-coral)' }}>Failed to load artifacts. Check that the server is running.</div>;
  }

  const containerPadding = isMobile ? '16px 16px 80px' : '24px 24px 80px';

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: containerPadding }}>
      {tagFilter && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text3)' }}>Filtering by</span>
          <TagChip tag={`#${tagFilter} ×`} active onClick={() => setTagFilter(null)} />
        </div>
      )}

      {pinned.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <SectionLabel label="Pinned" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {pinned.map(a => <FeedCardCompact key={a.id} artifact={a} hideTags={isVeryNarrow} />)}
          </div>
        </div>
      )}

      {groups.length === 0 && (
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '14px', color: 'var(--text3)' }}>
          {tagFilter ? `No results for tag «${tagFilter}»` : 'No artifacts yet.'}
        </p>
      )}

      {groups.map(({ key, items }) => {
        const isToday = key === 'Today';
        const isYesterday = key === 'Yesterday';
        const isCollapsed = collapsedDays[key];

        const headingFontSize = isMobile
          ? (isToday ? '24px' : isYesterday ? '18px' : '16px')
          : (isToday ? '28px' : isYesterday ? '22px' : '18px');

        return (
          <div key={key} style={{ marginBottom: isToday ? 36 : 28 }}>
            <button
              onClick={() => toggleDay(key)}
              style={{
                appearance: 'none', background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'baseline', gap: 10,
                padding: '0 0 12px', width: '100%', textAlign: 'left',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-head)',
                fontStyle: 'italic',
                fontSize: headingFontSize,
                color: isToday ? 'var(--cat-amber)' : 'var(--text2)',
                letterSpacing: '-.01em',
                lineHeight: 1,
              }}>
                {key}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)', letterSpacing: '.06em' }}>
                {items.length}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)',
                marginLeft: 'auto',
                display: 'inline-block',
                transform: isCollapsed ? 'rotate(-90deg)' : 'none',
                transition: 'transform var(--t-normal)',
              }}>▾</span>
            </button>

            {!isCollapsed && (
              isToday ? (
                <div>
                  {items.map(a => <FeedCardRich key={a.id} artifact={a} onShare={openShare} hideTags={isVeryNarrow} />)}
                </div>
              ) : (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  {items.map(a => <FeedCardCompact key={a.id} artifact={a} hideTags={isVeryNarrow} />)}
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

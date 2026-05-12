import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store.js';
import { BrowseCard } from '../components/BrowseCard.jsx';
import { SectionLabel } from '../components/SectionLabel.jsx';
import { RightDetailPane } from '../components/RightDetailPane.jsx';
import { getCatColors, CATEGORY_META } from '../utils/category.js';
import { useIsMobile } from '../utils/useIsMobile.js';
import * as api from '../data/api.js';

const SORTS = ['newest', 'oldest', 'alpha', 'size'];

const chipScrollStyle = {
  display: 'flex',
  gap: 6,
  overflowX: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  WebkitOverflowScrolling: 'touch',
  padding: '0 12px',
};

function MobileChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: 'none',
        cursor: 'pointer',
        flexShrink: 0,
        padding: '4px 10px',
        borderRadius: 16,
        border: '1px solid var(--border)',
        background: active ? 'var(--bg3)' : 'transparent',
        color: active ? 'var(--text)' : 'var(--text3)',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        whiteSpace: 'nowrap',
        transition: 'background var(--t-fast), color var(--t-fast)',
      }}
    >
      {label}
    </button>
  );
}

export function Browse() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { tagFilter, setTagFilter, rightPane, openShare } = useStore(s => ({
    tagFilter: s.tagFilter,
    setTagFilter: s.setTagFilter,
    rightPane: s.rightPane,
    openShare: s.openShare,
  }));
  const [all, setAll] = useState([]);
  const [catFilter, setCatFilter] = useState(null);
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState(null);
  const [isQUHD, setIsQUHD] = useState(() => window.matchMedia('(min-width: 1920px)').matches);

  useEffect(() => {
    api.listArtifacts({ limit: 500 }).then(data => setAll(data.artifacts || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1920px)');
    const handler = e => {
      setIsQUHD(e.matches);
      if (!e.matches) setSelected(null);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const tagCounts = {};
  const catCounts = {};
  for (const a of all) {
    catCounts[a.category] = (catCounts[a.category] || 0) + 1;
    for (const t of (a.tags || [])) tagCounts[t] = (tagCounts[t] || 0) + 1;
  }
  const collections = Object.entries(tagCounts)
    .filter(([t]) => t.startsWith('col/'))
    .sort((a, b) => b[1] - a[1]);
  const topTags = Object.entries(tagCounts)
    .filter(([t]) => !t.startsWith('col/'))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([t]) => t);

  let filtered = all.filter(a => (!catFilter || a.category === catFilter) && (!tagFilter || (a.tags || []).includes(tagFilter)));
  const sortFns = {
    newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    oldest: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    alpha: (a, b) => a.slug.localeCompare(b.slug),
    size: (a, b) => b.file_size - a.file_size,
  };
  const pinned = filtered.filter(a => a.pinned).sort(sortFns[sort]);
  const unpinned = filtered.filter(a => !a.pinned).sort(sortFns[sort]);
  filtered = [...pinned, ...unpinned];

  const rowStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', background: active ? 'var(--bg3)' : 'transparent',
    fontFamily: 'var(--font-body)', fontSize: '12px', color: active ? 'var(--text)' : 'var(--text2)',
    fontWeight: active ? 500 : 400,
    border: 'none', appearance: 'none', width: '100%', textAlign: 'left',
    transition: 'background var(--t-fast)',
  });

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Category chip row */}
        <div style={{ ...chipScrollStyle, paddingTop: 10, paddingBottom: 6 }}>
          <MobileChip label="All" active={!catFilter} onClick={() => setCatFilter(null)} />
          {Object.entries(CATEGORY_META).map(([cat, meta]) => (
            <MobileChip
              key={cat}
              label={meta.label}
              active={catFilter === cat}
              onClick={() => setCatFilter(catFilter === cat ? null : cat)}
            />
          ))}
        </div>

        {/* Collections chip row */}
        {collections.length > 0 && (
          <div style={{ ...chipScrollStyle, paddingBottom: 6 }}>
            <span style={{
              flexShrink: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              alignSelf: 'center',
              paddingRight: 4,
            }}>
              Collections
            </span>
            {collections.map(([tag]) => {
              const name = tag.slice(4); // strip "col/"
              return (
                <MobileChip
                  key={tag}
                  label={name}
                  active={tagFilter === tag}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                />
              );
            })}
          </div>
        )}

        {/* Tag chip row */}
        <div style={{ ...chipScrollStyle, paddingBottom: 10 }}>
          <MobileChip label="All tags" active={!tagFilter} onClick={() => setTagFilter(null)} />
          {topTags.map(t => (
            <MobileChip
              key={t}
              label={`#${t}`}
              active={tagFilter === t}
              onClick={() => setTagFilter(tagFilter === t ? null : t)}
            />
          ))}
        </div>

        {/* Sort + count bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px 8px',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>Sort:</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '4px 8px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {SORTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>
            {filtered.length} artifact{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '14px', color: 'var(--text3)' }}>
            No results
            {(catFilter || tagFilter) && (
              <span style={{ fontFamily: 'var(--font-mono)', display: 'block', fontSize: '11px', marginTop: 4 }}>
                {catFilter && `category: ${catFilter}`}{catFilter && tagFilter && ' · '}{tagFilter && `tag: ${tagFilter}`}
              </span>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, padding: '12px 12px 80px' }}>
            {filtered.map(a => (
              <BrowseCard key={a.id} artifact={a} onClick={() => navigate(`/a/${a.slug}`)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 0px)', overflow: 'hidden' }}>
      <aside style={{ width: 180, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '20px 12px' }}>
        <SectionLabel label="Category" />
        <button style={rowStyle(!catFilter)} onClick={() => setCatFilter(null)}>
          All <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>{all.length}</span>
        </button>
        {Object.entries(CATEGORY_META).map(([cat, meta]) => {
          const c = getCatColors(cat);
          return (
            <button key={cat} style={rowStyle(catFilter === cat)} onClick={() => setCatFilter(catFilter === cat ? null : cat)}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
              {meta.label}
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>{catCounts[cat] || 0}</span>
            </button>
          );
        })}

        {collections.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <SectionLabel label="Collections" />
            {collections.map(([tag, count]) => {
              const name = tag.slice(4); // strip "col/"
              return (
                <button key={tag} style={rowStyle(tagFilter === tag)} onClick={() => setTagFilter(tagFilter === tag ? null : tag)}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{name}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <SectionLabel label="Tags" />
          <button style={rowStyle(!tagFilter)} onClick={() => setTagFilter(null)}>All</button>
          {topTags.map(t => (
            <button key={t} style={rowStyle(tagFilter === t)} onClick={() => setTagFilter(tagFilter === t ? null : t)}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>#{t}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>{tagCounts[t]}</span>
            </button>
          ))}
        </div>
      </aside>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 44, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)', marginRight: 4 }}>Sort:</span>
          {SORTS.map(s => (
            <button key={s} onClick={() => setSort(s)} style={{
              appearance: 'none', background: sort === s ? 'var(--bg3)' : 'none',
              border: `1px solid ${sort === s ? 'var(--border2)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '3px 8px',
              fontFamily: 'var(--font-mono)', fontSize: '10px',
              color: sort === s ? 'var(--text)' : 'var(--text3)', cursor: 'pointer',
              transition: 'all var(--t-fast)',
            }}>
              {s}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>
            {filtered.length} artifact{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '14px', color: 'var(--text3)' }}>
            No results
            {(catFilter || tagFilter) && <span style={{ fontFamily: 'var(--font-mono)', display: 'block', fontSize: '11px', marginTop: 4 }}>
              {catFilter && `category: ${catFilter}`}{catFilter && tagFilter && ' · '}{tagFilter && `tag: ${tagFilter}`}
            </span>}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
            padding: '16px 20px 80px',
            paddingRight: isQUHD && rightPane && selected ? 316 : 20,
          }}>
            {filtered.map(a => (
              <BrowseCard
                key={a.id}
                artifact={a}
                onClick={isQUHD && rightPane
                  ? () => setSelected(a)
                  : () => navigate(`/a/${a.slug}`)
                }
              />
            ))}
          </div>
        )}
      </div>

      <RightDetailPane
        artifact={isQUHD && rightPane ? selected : null}
        onClose={() => setSelected(null)}
        onNavigate={navigate}
        onShare={openShare}
      />
    </div>
  );
}

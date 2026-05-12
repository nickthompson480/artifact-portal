import { NavLink, Link } from 'react-router-dom';
import { useStore } from '../state/store.js';
import { TagChip } from './TagChip.jsx';
import { SectionLabel } from './SectionLabel.jsx';

const NAV_STYLE = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '7px 10px',
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  fontWeight: 500,
  color: isActive ? 'var(--text)' : 'var(--text2)',
  background: isActive ? 'var(--bg3)' : 'transparent',
  textDecoration: 'none',
  transition: 'all var(--t-fast)',
  cursor: 'pointer',
});

export function Sidebar({ allTags }) {
  const { openSearch, tagFilter, setTagFilter } = useStore(s => ({
    openSearch: s.openSearch,
    tagFilter: s.tagFilter,
    setTagFilter: s.setTagFilter,
  }));

  return (
    <aside style={{
      width: 'var(--nav-w)',
      flexShrink: 0,
      borderRight: '1px solid var(--border)',
      background: 'var(--bg2)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
    }}>
      <div style={{ padding: '20px 14px 0' }}>
        <Link to="/" style={{ fontFamily: 'var(--font-head)', fontStyle: 'italic', fontSize: '18px', color: 'var(--text)', marginBottom: 20, paddingLeft: 4, display: 'block', textDecoration: 'none' }}>
          Artifact Portal
        </Link>

        <button
          onClick={openSearch}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 10px',
            marginBottom: 4,
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text3)',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span>⌕</span>
          <span style={{ flex: 1 }}>Search…</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', opacity: .6 }}>⌘K</span>
        </button>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 20 }}>
          <NavLink to="/" end style={({ isActive }) => NAV_STYLE(isActive)}>◈ Feed</NavLink>
          <NavLink to="/browse" style={({ isActive }) => NAV_STYLE(isActive)}>⊞ Browse</NavLink>
        </nav>

        {allTags.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionLabel label="Tags" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {allTags.slice(0, 20).map(t => (
                <TagChip key={t} tag={t} active={tagFilter === t} onClick={() => setTagFilter(tagFilter === t ? null : t)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', padding: '0 14px 16px', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <NavLink to="/settings" style={({ isActive }) => NAV_STYLE(isActive)}>⚙ Settings</NavLink>
      </div>
    </aside>
  );
}

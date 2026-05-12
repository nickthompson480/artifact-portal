import { NavLink } from 'react-router-dom';
import { useStore } from '../state/store.js';

const TAB = (isActive) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 3,
  flex: 1,
  padding: '8px 0',
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  color: isActive ? 'var(--text)' : 'var(--text3)',
  textDecoration: 'none',
  position: 'relative',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  transition: 'color var(--t-fast)',
});

const ICON = { fontSize: '18px' };
const DOT = { width: 4, height: 4, borderRadius: '50%', background: 'var(--cat-amber)', position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)' };

export function MobileTabBar() {
  const openSearch = useStore(s => s.openSearch);
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'var(--mobile-nav-h)',
      background: 'var(--bg2)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <NavLink to="/" end style={({ isActive }) => TAB(isActive)}>
        {({ isActive }) => (<>{isActive && <span style={DOT} />}<span style={ICON}>◈</span><span>Feed</span></>)}
      </NavLink>
      <NavLink to="/browse" style={({ isActive }) => TAB(isActive)}>
        {({ isActive }) => (<>{isActive && <span style={DOT} />}<span style={ICON}>⊞</span><span>Browse</span></>)}
      </NavLink>
      <button style={TAB(false)} onClick={openSearch}>
        <span style={ICON}>⌕</span><span>Search</span>
      </button>
      <NavLink to="/settings" style={({ isActive }) => TAB(isActive)}>
        {({ isActive }) => (<>{isActive && <span style={DOT} />}<span style={ICON}>⚙</span><span>Settings</span></>)}
      </NavLink>
    </nav>
  );
}

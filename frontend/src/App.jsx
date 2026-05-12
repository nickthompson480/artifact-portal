import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from './state/store.js';
import { Shell } from './components/Shell.jsx';
import { Login } from './views/Login.jsx';
import { Feed } from './views/Feed.jsx';
import { Browse } from './views/Browse.jsx';
import { Viewer } from './views/Viewer.jsx';
import { Settings } from './views/Settings.jsx';
import { ShareModal } from './views/ShareModal.jsx';
import { SearchOverlay } from './views/SearchOverlay.jsx';
import * as api from './data/api.js';

function RequireAuth({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState(null); // null=loading, 'ok', 'needs_login', 'needs_setup'
  const { authed, setAuthed } = useStore(s => ({ authed: s.authed, setAuthed: s.setAuthed }));

  useEffect(() => {
    // Skip the round-trip if this session already confirmed auth
    if (authed) { setStatus('ok'); return; }
    api.me().then(data => {
      if (data.ok) { setAuthed(true); setStatus('ok'); }
      else if (data.setup) setStatus('needs_setup');
      else setStatus('needs_login');
    }).catch(() => setStatus('needs_login'));
  }, [authed]);

  if (!status) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
  }
  if (status === 'ok') return children;
  if (status === 'needs_setup') return <Login setupMode />;
  return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
}

export default function App() {
  const { openSearch, searchOpen } = useStore(s => ({ openSearch: s.openSearch, searchOpen: s.searchOpen }));
  const location = useLocation();

  // Global ⌘K handler — suppressed in Viewer
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        if (location.pathname.startsWith('/a/')) return;
        e.preventDefault();
        openSearch();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSearch, location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/a/:slug" element={<RequireAuth><Viewer /></RequireAuth>} />
        <Route element={<RequireAuth><Shell /></RequireAuth>}>
          <Route index element={<Feed />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={
          <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-body)', color: 'var(--text3)' }}>Page not found.</span>
          </div>
        } />
      </Routes>
      <ShareModal />
      <SearchOverlay />
    </>
  );
}

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { MobileTabBar } from './MobileTabBar.jsx';
import { useIsMobile } from '../utils/useIsMobile.js';
import * as api from '../data/api.js';

export function Shell() {
  const isMobile = useIsMobile();
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    api.listArtifacts({ limit: 500 }).then(data => {
      const counts = {};
      for (const a of (data.artifacts || [])) {
        for (const t of (a.tags || [])) counts[t] = (counts[t] || 0) + 1;
      }
      setAllTags(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t]) => t));
    }).catch(() => {});
  }, []);

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          height: 'var(--mobile-topbar)',
          background: 'var(--bg2)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
        }}>
          <span style={{ fontFamily: 'var(--font-head)', fontStyle: 'italic', fontSize: '17px', color: 'var(--text)' }}>
            Artifact Portal
          </span>
        </header>
        <div style={{ paddingBottom: 'calc(var(--mobile-nav-h) + env(safe-area-inset-bottom))' }}>
          <Outlet />
        </div>
        <MobileTabBar />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar allTags={allTags} />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

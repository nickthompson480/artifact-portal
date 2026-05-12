import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CategoryBadge } from '../components/CategoryBadge.jsx';
import { TagChip } from '../components/TagChip.jsx';
import { AgentBadge } from '../components/AgentBadge.jsx';
import { VisibilityDot } from '../components/VisibilityDot.jsx';
import { IconBtn } from '../components/IconBtn.jsx';
import { SectionLabel } from '../components/SectionLabel.jsx';
import { formatSize, timeLabel } from '../utils/format.js';
import { useStore } from '../state/store.js';
import { useIsMobile } from '../utils/useIsMobile.js';
import * as api from '../data/api.js';

export function Viewer() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const openShare = useStore(s => s.openShare);
  const theme = useStore(s => s.theme);
  const iframeRef = useRef(null);
  const [artifact, setArtifact] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    api.getArtifact(slug)
      .then(setArtifact)
      .catch(err => { if (err.status === 404) setNotFound(true); });
  }, [slug]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') {
        api.getArtifact(slug)
          .then(setArtifact)
          .catch(err => { if (err.status === 404) setNotFound(true); });
      }
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [slug]);

  // Keep latest theme accessible to async callbacks without stale closure.
  const themeRef = useRef(theme);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  // Drive iframe navigation with location.replace() — never navigate declaratively via
  // the src attribute. Setting src pushes a joint session history entry into the top-level
  // browsing context; the user's Back button then steps through that invisible entry and
  // appears to do nothing. location.replace() navigates the iframe without adding an entry.
  useEffect(() => {
    const el = iframeRef.current;
    if (!el || !artifact?.id) return;
    try {
      el.contentWindow.location.replace(`/artifacts/${artifact.id}/file`);
    } catch {
      el.src = `/artifacts/${artifact.id}/file`; // fallback: restores prior behaviour, not ideal
    }
  }, [artifact?.id]);

  // Handshake: respond to portal:theme:request from the artifact.
  // Artifacts post this request in their IIFE (before DOMContentLoaded) once their message
  // listener is registered. We respond immediately with the current theme, eliminating the
  // need for a timed retry burst. Source check ensures we only respond to our own iframe.
  useEffect(() => {
    function onMessage(e) {
      if (e.data?.type !== 'portal:theme:request') return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      try { iframeRef.current?.contentWindow?.postMessage({ type: 'portal:theme', theme: themeRef.current }, '*'); } catch {}
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Send theme to artifact iframe on mount, artifact change, and iframe load.
  // postMessage to '*' is required — sandboxed iframes without allow-same-origin have null origin.
  // Fallback for artifacts that predate the portal:theme:request handshake.
  useEffect(() => {
    const el = iframeRef.current;
    if (!el || !artifact?.id) return;

    const send = () => {
      try { el.contentWindow?.postMessage({ type: 'portal:theme', theme: themeRef.current }, '*'); } catch {}
    };

    // Immediate send covers cached-load race: if the artifact HTML was served from
    // browser cache, the iframe `load` event fires before React's effect runs.
    send();
    el.addEventListener('load', send); // covers uncached / reload path

    return () => {
      el.removeEventListener('load', send);
    };
  }, [artifact?.id]);

  // Live theme changes — push immediately to the currently-mounted iframe.
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'portal:theme', theme }, '*');
  }, [theme]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (drawerOpen) { setDrawerOpen(false); return; }
        navigate(-1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, navigate]);

  function goBack() { navigate(-1); }

  if (notFound) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', zIndex: 200 }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text2)', marginBottom: 16 }}>Artifact not found.</p>
        <IconBtn onClick={goBack}>← Back</IconBtn>
      </div>
    );
  }

  if (!artifact) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text3)' }}>Loading…</span>
      </div>
    );
  }

  const drawerContent = (
    <>
      <SectionLabel label="Metadata" />
      <Row label="Title" value={artifact.title} />
      <div style={{ marginBottom: 10 }}><span style={LABEL}>Category</span><CategoryBadge category={artifact.category} /></div>
      <div style={{ marginBottom: 10 }}><span style={LABEL}>Published by</span><AgentBadge publishedBy={artifact.published_by} /></div>
      <Row label="Size" value={formatSize(artifact.file_size)} />
      <Row label="Published" value={timeLabel(artifact.created_at)} />
      {artifact.view_count > 0 && <Row label="Views" value={`${artifact.view_count} view${artifact.view_count !== 1 ? 's' : ''}`} />}
      <div style={{ marginBottom: 10 }}>
        <span style={LABEL}>Visibility</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <VisibilityDot visibility={artifact.visibility} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text2)', textTransform: 'capitalize' }}>{artifact.visibility}</span>
        </div>
      </div>
      {(artifact.tags || []).length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <span style={LABEL}>Tags</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {artifact.tags.map(t => <TagChip key={t} tag={t} />)}
          </div>
        </div>
      )}
      {artifact.description && (
        <div style={{ marginBottom: 16 }}>
          <span style={LABEL}>Description</span>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6 }}>{artifact.description}</p>
        </div>
      )}
      <button
        onClick={() => openShare(artifact)}
        style={{
          width: '100%',
          background: 'var(--cat-teal-bg)',
          border: '1px solid var(--cat-teal-bd)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--cat-teal)',
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          fontWeight: 500,
          padding: '7px',
          cursor: 'pointer',
        }}
      >
        Share this artifact…
      </button>
    </>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{
        height: 'var(--topbar-h)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)',
        flexShrink: 0,
      }}>
        <IconBtn onClick={goBack}>← Back</IconBtn>
        <VisibilityDot visibility={artifact.visibility} />
        <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-body)', fontSize: '13.5px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {artifact.title}
        </span>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
          {!isMobile && (artifact.tags || []).slice(0, 3).map(t => <TagChip key={t} tag={t} />)}
          <IconBtn onClick={() => setDrawerOpen(o => !o)} active={drawerOpen}>[i]</IconBtn>
          <IconBtn onClick={() => openShare(artifact)}>[Share]</IconBtn>
          <IconBtn onClick={() => window.open(`/artifacts/${artifact?.id}/file`, '_blank', 'noopener,noreferrer')}>[↗]</IconBtn>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* iframe */}
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          title={artifact.title}
          style={{ flex: 1, minWidth: 0, border: 'none', background: 'var(--bg)' }}
        />

        {isMobile ? (
          <>
            {/* Backdrop */}
            {drawerOpen && (
              <div
                onClick={() => setDrawerOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,.4)',
                  zIndex: 249,
                }}
              />
            )}
            {/* Bottom sheet */}
            <div style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60vh',
              background: 'var(--bg2)',
              borderTop: '1px solid var(--border)',
              borderRadius: '14px 14px 0 0',
              zIndex: 250,
              transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform var(--t-drawer)',
              overflowY: 'auto',
              padding: '20px 18px',
            }}>
              {drawerContent}
            </div>
          </>
        ) : (
          /* Desktop side drawer */
          <div style={{
            width: drawerOpen ? 280 : 0,
            transition: 'width var(--t-drawer)',
            overflow: 'hidden',
            borderLeft: drawerOpen ? '1px solid var(--border)' : 'none',
            background: 'var(--bg2)',
            flexShrink: 0,
          }}>
            <div style={{ width: 280, padding: '20px 18px', overflowY: 'auto', height: '100%' }}>
              {drawerContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const LABEL = { display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 };
function Row({ label, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={LABEL}>{label}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text2)' }}>{value}</span>
    </div>
  );
}

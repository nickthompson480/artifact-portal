import { useState, useEffect, useRef } from 'react';
import { useStore } from '../state/store.js';
import { IconBtn } from '../components/IconBtn.jsx';
import * as api from '../data/api.js';

const VIS = ['private', 'unlisted', 'public'];

export function ShareModal() {
  const { shareOpen, shareTarget, closeShare } = useStore(s => ({
    shareOpen: s.shareOpen, shareTarget: s.shareTarget, closeShare: s.closeShare,
  }));
  const [artifact, setArtifact] = useState(null);
  const [visibility, setVisibility] = useState('private');
  const [token, setToken] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shareTarget) {
      setArtifact(shareTarget);
      setVisibility(shareTarget.visibility);
      setToken(shareTarget.share_token || null);
      setCopied(false);
    }
  }, [shareTarget]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') closeShare(); }
    if (shareOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shareOpen, closeShare]);

  if (!shareOpen || !artifact) return null;

  async function changeVisibility(v) {
    const prev = visibility;
    setVisibility(v);
    setLoading(true);
    try {
      await api.patchArtifact(artifact.id, { visibility: v });
      if (v === 'unlisted' && !token) {
        const r = await api.createShareToken(artifact.id);
        setToken(r.token);
      } else if (v !== 'unlisted' && token) {
        await api.revokeShareToken(artifact.id).catch(() => {});
        setToken(null);
      }
    } catch {
      setVisibility(prev);
    }
    setLoading(false);
  }

  function shareUrl() {
    if (visibility === 'unlisted' && token) return `${window.location.origin}/share/${token}`;
    if (visibility === 'public') return `${window.location.origin}/p/${artifact.slug}`;
    return null;
  }

  function copy() {
    const url = shareUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const url = shareUrl();

  return (
    <>
      <div onClick={closeShare} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', zIndex: 300 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 460, maxWidth: 'calc(100vw - 32px)', zIndex: 400,
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-modal)',
        padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--text)', flex: 1 }}>Share</span>
          <IconBtn onClick={closeShare}>×</IconBtn>
        </div>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text3)', marginBottom: 12 }}>Visibility</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {VIS.map(v => (
            <button key={v} onClick={() => changeVisibility(v)} disabled={loading} style={{
              flex: 1, appearance: 'none', cursor: 'pointer',
              background: visibility === v ? 'var(--bg3)' : 'transparent',
              border: `1px solid ${visibility === v ? 'var(--border2)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '6px 4px',
              fontFamily: 'var(--font-body)', fontSize: '12px',
              color: visibility === v ? 'var(--text)' : 'var(--text2)',
              fontWeight: visibility === v ? 500 : 400,
              textTransform: 'capitalize',
              transition: 'all var(--t-fast)',
            }}>
              {v}
            </button>
          ))}
        </div>

        <div style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '11px', color: url ? 'var(--text2)' : 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {url || 'Not accessible via URL'}
          </span>
          {url && (
            <button onClick={copy} style={{
              appearance: 'none', flexShrink: 0,
              background: 'var(--cat-teal-bg)', border: '1px solid var(--cat-teal-bd)',
              borderRadius: 'var(--radius-sm)', padding: '3px 10px',
              fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--cat-teal)', cursor: 'pointer',
            }}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          )}
        </div>

        <button onClick={closeShare} style={{
          width: '100%', appearance: 'none',
          background: 'transparent', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '8px',
          fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text2)', cursor: 'pointer',
          transition: 'border-color var(--t-fast)',
        }}>
          Done
        </button>
      </div>
    </>
  );
}

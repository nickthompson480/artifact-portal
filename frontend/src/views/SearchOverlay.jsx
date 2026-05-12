import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store.js';
import { useDebounce } from '../utils/useDebounce.js';
import { CategoryBadge } from '../components/CategoryBadge.jsx';
import { timeLabel } from '../utils/format.js';
import * as api from '../data/api.js';

// Highlight query terms without dangerouslySetInnerHTML — avoids XSS via agent-supplied titles.
function Highlight({ text, query }) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  // split() with a capture group places matches at odd indices — use index parity, not regex.test()
  // (regex.test() with /g advances lastIndex, causing every other call to return the wrong result)
  return text.split(regex).map((part, i) =>
    i % 2 === 1
      ? <mark key={i} style={{ background: 'rgba(232,160,66,.25)', color: 'var(--cat-amber)', padding: 0 }}>{part}</mark>
      : part
  );
}

export function SearchOverlay() {
  const navigate = useNavigate();
  const { searchOpen, closeSearch } = useStore(s => ({ searchOpen: s.searchOpen, closeSearch: s.closeSearch }));
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(0);
  const inputRef = useRef(null);
  const debounced = useDebounce(query, 200);

  useEffect(() => {
    if (searchOpen) { setQuery(''); setFocused(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    if (!debounced) {
      // Empty state: pinned + recent
      Promise.all([
        api.listArtifacts({ pinned: 1, limit: 4 }),
        api.listArtifacts({ sort: 'newest', limit: 4 }),
      ]).then(([p, r]) => {
        const seen = new Set();
        const merged = [...(p.artifacts || []), ...(r.artifacts || [])].filter(a => seen.has(a.id) ? false : seen.add(a.id));
        setResults(merged);
        setFocused(0);
      }).catch(() => {});
    } else {
      api.listArtifacts({ q: debounced, limit: 8 })
        .then(data => { setResults(data.artifacts || []); setFocused(0); })
        .catch(() => {});
    }
  }, [debounced, searchOpen]);

  useEffect(() => {
    function onKey(e) {
      if (!searchOpen) return;
      if (e.key === 'Escape') { closeSearch(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
      if (e.key === 'Enter' && results[focused]) {
        navigate(`/a/${results[focused].slug}`);
        closeSearch();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, results, focused, navigate, closeSearch]);

  if (!searchOpen) return null;

  return (
    <>
      <div onClick={closeSearch} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', zIndex: 300 }} />
      <div style={{
        position: 'fixed', top: '18%', left: '50%', transform: 'translateX(-50%)',
        width: 560, maxWidth: 'calc(100vw - 32px)', zIndex: 400,
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-overlay)',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text3)' }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search artifacts…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text)',
              caretColor: 'var(--cat-amber)',
            }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px' }}>esc</span>
        </div>

        {!query && results.length > 0 && (
          <div style={{ padding: '6px 16px 4px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Pinned · Recent</span>
          </div>
        )}

        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {results.map((a, i) => (
            <div
              key={a.id}
              onClick={() => { navigate(`/a/${a.slug}`); closeSearch(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', cursor: 'pointer',
                background: i === focused ? 'var(--bg3)' : 'transparent',
                borderBottom: '1px solid var(--border)',
                transition: 'background var(--t-fast)',
              }}
              onMouseEnter={() => setFocused(i)}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--cat-${['amber','teal','purple','coral','blue'][['spec','report','prototype','review','other'].indexOf(a.category)] || 'blue'})`, flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Highlight text={a.title} query={query} />
              </span>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {(a.tags || []).slice(0, 2).map(t => (
                  <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>#{t}</span>
                ))}
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)', flexShrink: 0 }}>{timeLabel(a.created_at)}</span>
            </div>
          ))}
          {results.length === 0 && query && (
            <div style={{ padding: '20px 16px', fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '13px', color: 'var(--text3)' }}>
              No results for "{query}"
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          {[['↵', 'open'], ['↑↓', 'navigate'], ['esc', 'close']].map(([k, label]) => (
            <span key={k} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>
              <span style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 4px', marginRight: 4 }}>{k}</span>
              {label}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>{results.length} result{results.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as api from '../data/api.js';
import { useStore } from '../state/store.js';

export function Login({ setupMode = false }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setAuthed = useStore(s => s.setAuthed);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (setupMode) {
        await api.setup(password);
        await api.login(password);
      } else {
        await api.login(password);
      }
      setAuthed(true);
      navigate(params.get('from') || '/');
    } catch (err) {
      setError(setupMode ? (err?.message || 'Setup failed.') : 'Incorrect password.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}`}</style>
      <div
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          width: '100%',
          maxWidth: 360,
          animation: shake ? 'shake .4s ease' : 'none',
        }}
      >
        <div style={{ fontFamily: 'var(--font-head)', fontStyle: 'italic', fontSize: '22px', color: 'var(--text)', marginBottom: 8 }}>
          Artifact Portal
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text3)', marginBottom: 24 }}>
          {setupMode ? 'Create a password to get started.' : 'Enter your password to continue.'}
        </p>
        <form onSubmit={submit}>
          <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)', marginBottom: 6, letterSpacing: '.05em', textTransform: 'uppercase' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            required
            style={{
              width: '100%',
              background: 'var(--bg3)',
              border: `1px solid ${error ? 'var(--cat-coral)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              padding: '8px 12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--cat-coral)', marginTop: 6 }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              marginTop: 16,
              width: '100%',
              background: 'var(--cat-amber-bg)',
              border: '1px solid var(--cat-amber-bd)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--cat-amber)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 500,
              padding: '9px',
              cursor: loading || !password ? 'default' : 'pointer',
              opacity: loading || !password ? .5 : 1,
              transition: 'opacity var(--t-fast)',
            }}
          >
            {setupMode ? 'Create Portal' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

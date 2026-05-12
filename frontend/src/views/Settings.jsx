import { useState, useEffect, useRef } from 'react';
import { useStore } from '../state/store.js';
import { SectionLabel } from '../components/SectionLabel.jsx';
import { IconBtn } from '../components/IconBtn.jsx';
import { useIsMobile } from '../utils/useIsMobile.js';
import * as api from '../data/api.js';

function Segmented({ options, value, onChange, isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 4 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          appearance: 'none', cursor: 'pointer',
          background: value === o.value ? 'var(--bg3)' : 'transparent',
          border: `1px solid ${value === o.value ? 'var(--border2)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', padding: '5px 12px',
          fontFamily: 'var(--font-body)', fontSize: '12px',
          color: value === o.value ? 'var(--text)' : 'var(--text2)',
          fontWeight: value === o.value ? 500 : 400,
          transition: 'all var(--t-fast)',
          ...(isMobile ? { width: '100%', justifyContent: 'center' } : {}),
        }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SettingRow({ label, children, caption }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{label}</div>
        {caption && <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text3)', marginTop: 2 }}>{caption}</div>}
      </div>
      <div style={{ flexShrink: 0, marginLeft: 16 }}>{children}</div>
    </div>
  );
}

export function Settings() {
  const isMobile = useIsMobile();
  const { theme, setTheme, density, setDensity, rightPane, setRightPane } = useStore(s => ({
    theme: s.theme, setTheme: s.setTheme,
    density: s.density, setDensity: s.setDensity,
    rightPane: s.rightPane, setRightPane: s.setRightPane,
  }));

  const [portalTitle, setPortalTitle] = useState('');
  const [publicIndex, setPublicIndex] = useState(false);
  const [keys, setKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPlain, setNewKeyPlain] = useState(null);
  const [newKeyCopied, setNewKeyCopied] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);
  const [isWide, setIsWide] = useState(() => window.matchMedia('(min-width: 1920px)').matches);
  const dismissTimer = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1920px)');
    const handler = e => setIsWide(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => () => clearTimeout(dismissTimer.current), []);

  useEffect(() => {
    api.getSettings().then(s => {
      setPortalTitle(s.portal_title || '');
      setPublicIndex(s.public_index_enabled === 'true');
    }).catch(() => {});
    loadKeys();
  }, []);

  function loadKeys() {
    api.listApiKeys().then(setKeys).catch(() => {});
  }

  function onTitleBlur() {
    if (!portalTitle.trim()) return;
    api.patchSetting('portal_title', portalTitle).catch(() => {});
  }

  async function togglePublicIndex(v) {
    setPublicIndex(v);
    api.patchSetting('public_index_enabled', String(v)).catch(() => setPublicIndex(!v));
  }

  async function createKey(e) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setKeyLoading(true);
    try {
      const r = await api.createApiKey(newKeyName.trim());
      setNewKeyPlain(r.key);
      setNewKeyName('');
      loadKeys();
      clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(() => setNewKeyPlain(null), 20000);
    } catch (err) {
      alert(err.message || 'Failed to create key');
    } finally {
      setKeyLoading(false);
    }
  }

  async function revokeKey(id) {
    setKeys(ks => ks.map(k => k.id === id ? { ...k, _revoking: true } : k));
    try {
      await api.revokeApiKey(id);
      loadKeys();
    } catch {
      setKeys(ks => ks.map(k => k.id === id ? { ...k, _revoking: false } : k));
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(newKeyPlain).then(() => {
      setNewKeyCopied(true);
      setTimeout(() => { setNewKeyCopied(false); setNewKeyPlain(null); }, 2000);
    });
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 24px 80px' }}>
      <h1 style={{ fontFamily: 'var(--font-head)', fontStyle: 'italic', fontSize: '28px', color: 'var(--text)', marginBottom: 32 }}>Settings</h1>

      {/* Portal */}
      <section style={{ marginBottom: 40 }}>
        <SectionLabel label="Portal" />
        <SettingRow label="Portal title">
          <input
            value={portalTitle}
            onChange={e => setPortalTitle(e.target.value)}
            onBlur={onTitleBlur}
            style={{
              background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '13px', padding: '5px 10px', outline: 'none',
            }}
          />
        </SettingRow>
        <SettingRow label="Public index" caption="Expose /public JSON endpoint">
          <Segmented
            options={[{ label: 'On', value: true }, { label: 'Off', value: false }]}
            value={publicIndex}
            onChange={togglePublicIndex}
            isMobile={isMobile}
          />
        </SettingRow>
      </section>

      {/* API Keys */}
      <section style={{ marginBottom: 40 }}>
        <SectionLabel label="API Keys" />

        {newKeyPlain && (
          <div style={{ background: 'var(--cat-amber-bg)', border: '1px solid var(--cat-amber-bd)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 16 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--cat-amber)', marginBottom: 8, fontWeight: 500 }}>
              New API key — copy now, shown only once
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text)', wordBreak: 'break-all' }}>{newKeyPlain}</code>
              <button onClick={copyKey} style={{
                flexShrink: 0, appearance: 'none', cursor: 'pointer',
                background: 'var(--cat-amber-bg)', border: '1px solid var(--cat-amber-bd)',
                borderRadius: 'var(--radius-sm)', padding: '4px 10px',
                fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--cat-amber)',
              }}>
                {newKeyCopied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {keys.filter(k => !k.revoked_at).map(k => (
          <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', opacity: k._revoking ? .4 : 1 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text)', fontWeight: 500, flex: 1 }}>{k.name}</span>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text3)' }}>{k.key_prefix}••••••••</code>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>
              {k.last_used_at ? `used ${new Date(k.last_used_at).toLocaleDateString()}` : 'never used'}
            </span>
            <IconBtn onClick={() => revokeKey(k.id)} style={{ color: 'var(--cat-coral)' }}>Revoke</IconBtn>
          </div>
        ))}

        <form onSubmit={createKey} style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g. claude-agent)"
            style={{
              flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text)',
              fontFamily: 'var(--font-body)', fontSize: '13px', padding: '7px 10px', outline: 'none',
            }}
          />
          <button type="submit" disabled={keyLoading || !newKeyName.trim()} style={{
            appearance: 'none', cursor: keyLoading ? 'default' : 'pointer',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '7px 14px',
            fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text)',
            opacity: keyLoading || !newKeyName.trim() ? .5 : 1,
            transition: 'opacity var(--t-fast)',
          }}>
            Create key
          </button>
        </form>
      </section>

      {/* Appearance */}
      <section style={{ marginBottom: 40 }}>
        <SectionLabel label="Appearance" />
        <SettingRow label="Theme">
          <Segmented
            options={[{ label: 'Dark', value: 'dark' }, { label: 'Light', value: 'light' }]}
            value={theme}
            onChange={setTheme}
            isMobile={isMobile}
          />
        </SettingRow>
        <SettingRow label="Density">
          <Segmented
            options={[{ label: 'Comfortable', value: 'comfortable' }, { label: 'Compact', value: 'compact' }]}
            value={density}
            onChange={setDensity}
            isMobile={isMobile}
          />
        </SettingRow>
        <SettingRow label="Right detail pane" caption={isWide ? 'Browse: show artifact detail in side pane' : 'Requires display width ≥ 1920px'}>
          <Segmented
            options={[{ label: 'On', value: true }, { label: 'Off', value: false }]}
            value={rightPane}
            onChange={isWide ? setRightPane : () => {}}
            isMobile={isMobile}
          />
        </SettingRow>
      </section>

      {/* Export */}
      <section style={{ marginTop: 40 }}>
        <SectionLabel label="Export" />
        <SettingRow label="Export archive" caption="Download all artifacts as a ZIP file">
          <a
            href="/export.zip"
            download
            style={{
              display: 'inline-block',
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 14px',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: 'var(--text2)',
              textDecoration: 'none',
              transition: 'all var(--t-fast)',
            }}
          >
            Export .zip
          </a>
        </SettingRow>
      </section>
    </div>
  );
}

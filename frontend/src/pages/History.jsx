import { useEffect, useMemo, useRef, useState } from 'react';
import BriefCard, { DOMAIN_COLORS, DOMAIN_LABELS } from '../components/BriefCard.jsx';
import RegisterModal from '../components/RegisterModal.jsx';
import RegistryMap from '../components/RegistryMap.jsx';
import IdeasTab from './IdeasTab.jsx';

const DOMAIN_ORDER = ['finance', 'healthcare', 'energy', 'concepts'];
const UPLOAD_DOMAINS = ['energy', 'finance', 'healthcare'];
const TYPE_FILTERS = ['all', 'project-brief', 'concept', 'findings', 'synthesis'];

const TAB_STYLE_BASE = {
  fontFamily: 'IBM Plex Mono',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  borderBottom: '2px solid transparent',
  paddingBottom: 6,
  paddingLeft: 0,
  paddingRight: 0,
  marginRight: 24,
};

export default function History() {
  const [activeTab, setActiveTab] = useState('artefacts');
  const [state, setState] = useState({ status: 'loading' });
  const [registeredPaths, setRegisteredPaths] = useState(new Set());
  const [typeFilter, setTypeFilter] = useState('all');
  const [registerTarget, setRegisterTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    document.title = 'History — Research Scout';
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [outRes, regRes] = await Promise.all([
          fetch('/api/outputs'),
          fetch('/api/registry'),
        ]);
        const [outBody, regBody] = await Promise.all([outRes.json(), regRes.json()]);
        if (cancelled) return;
        if (!outRes.ok) {
          setState({ status: 'error', error: outBody.detail ?? `HTTP ${outRes.status}` });
          return;
        }
        setState({ status: 'ok', data: outBody });
        if (regRes.ok) {
          setRegisteredPaths(new Set((regBody.ideas ?? []).map((i) => i.path)));
        }
      } catch (err) {
        if (!cancelled) setState({ status: 'error', error: err.message });
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const grouped = useMemo(() => {
    if (state.status !== 'ok') return {};
    const filtered =
      typeFilter === 'all'
        ? state.data
        : state.data.filter((it) => it.type === typeFilter);
    const groups = {};
    for (const d of DOMAIN_ORDER) groups[d] = [];
    for (const item of filtered) {
      if (groups[item.domain]) groups[item.domain].push(item);
    }
    for (const d of DOMAIN_ORDER) {
      groups[d].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    }
    return groups;
  }, [state, typeFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {registerTarget && (
        <RegisterModal
          file={registerTarget}
          onClose={() => setRegisterTarget(null)}
          onRegistered={() => {
            setRegisterTarget(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      <header>
        <h1
          style={{
            fontFamily: 'IBM Plex Sans',
            fontSize: 32,
            fontWeight: 300,
            color: '#f0f0f0',
            margin: 0,
            letterSpacing: '-0.02em'
          }}
        >
          History
        </h1>
        <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b', marginTop: 8, marginBottom: 0 }}>
          Every artefact produced by the agents, grouped by domain.
        </p>
      </header>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e1e1e', paddingBottom: 0, marginBottom: -16 }}>
        {['artefacts', 'ideas', 'sources'].map((tab) => {
          const active = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                ...TAB_STYLE_BASE,
                color: active ? '#f0f0f0' : '#6b6b6b',
                borderBottom: active ? '2px solid #f0f0f0' : '2px solid transparent',
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {activeTab === 'artefacts' && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'IBM Plex Mono',
                fontSize: 11,
                color: '#6b6b6b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginRight: 4
              }}
            >
              type:
            </span>
            {TYPE_FILTERS.map((t) => {
              const active = t === typeFilter;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 3,
                    fontFamily: 'IBM Plex Mono',
                    fontSize: 12,
                    cursor: 'pointer',
                    backgroundColor: active ? '#f0f0f0' : 'transparent',
                    color: active ? '#0a0a0a' : '#6b6b6b',
                    border: active ? '1px solid #f0f0f0' : '1px solid #2e2e2e',
                    fontWeight: active ? 500 : 400
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {state.status === 'loading' && (
            <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b' }}>
              Loading history…
            </div>
          )}

          {state.status === 'error' && (
            <div
              style={{
                borderRadius: 4,
                border: '1px solid rgba(239,68,68,0.3)',
                backgroundColor: 'rgba(239,68,68,0.08)',
                color: '#fca5a5',
                padding: '10px 14px',
                fontFamily: 'IBM Plex Mono',
                fontSize: 12
              }}
            >
              {state.error}
            </div>
          )}

          {state.status === 'ok' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {DOMAIN_ORDER.map((d) => (
                <DomainSection
                  key={d}
                  domain={d}
                  items={grouped[d] ?? []}
                  registeredPaths={registeredPaths}
                  onRegister={setRegisterTarget}
                />
              ))}
            </div>
          )}

          <RegistryMap />
        </>
      )}

      {activeTab === 'ideas' && <IdeasTab />}
      {activeTab === 'sources' && <SourcesTab />}
    </div>
  );
}

function DomainSection({ domain, items, registeredPaths, onRegister }) {
  const color = DOMAIN_COLORS[domain];
  const count = items.length;
  const label = `${DOMAIN_LABELS[domain].toUpperCase()} — ${count} artefact${count !== 1 ? 's' : ''}`;

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0
          }}
        />
        <h2
          style={{
            fontFamily: 'IBM Plex Mono',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#9b9b9b',
            margin: 0
          }}
        >
          {label}
        </h2>
      </div>
      {items.length === 0 ? (
        <div
          style={{
            borderRadius: 4,
            border: '1px solid #1e1e1e',
            backgroundColor: 'rgba(17,17,17,0.4)',
            padding: '14px 16px',
            fontFamily: 'IBM Plex Mono',
            fontSize: 12,
            color: '#3b3b3b'
          }}
        >
          0 briefs · 0 concepts · 0 findings
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16
          }}
        >
          {items.map((it) => {
            const isRegistered = registeredPaths?.has(it.path);
            return (
              <div key={`${it.domain}/${it.filename}`} style={{ position: 'relative' }}>
                <BriefCard item={it} />
                {!isRegistered && domain !== 'concepts' && (
                  <button
                    type="button"
                    onClick={() => onRegister?.(it)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      padding: '2px 8px',
                      borderRadius: 3,
                      fontFamily: 'IBM Plex Mono',
                      fontSize: 10,
                      cursor: 'pointer',
                      backgroundColor: '#0a0a0a',
                      color: '#6b6b6b',
                      border: '1px solid #2e2e2e',
                    }}
                  >
                    Register
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}


function SourcesTab() {
  const [sources, setSources] = useState({ status: 'loading', items: [] });
  const [settings, setSettings] = useState({ energy: false, finance: false, healthcare: false });
  const [uploadState, setUploadState] = useState({});
  const fileRefs = useRef({});

  function load() {
    setSources({ status: 'loading', items: [] });
    Promise.all([
      fetch('/api/inputs').then((r) => r.json()),
      fetch('/api/inputs/settings').then((r) => r.json()),
    ])
      .then(([inputsBody, settingsBody]) => {
        setSources({ status: 'ok', items: Array.isArray(inputsBody) ? inputsBody : [] });
        setSettings(settingsBody);
      })
      .catch((err) => setSources({ status: 'error', items: [], error: err.message }));
  }

  useEffect(() => { load(); }, []);

  async function toggleDomain(domain) {
    const next = !settings[domain];
    try {
      const res = await fetch('/api/inputs/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, active: next }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? `HTTP ${res.status}`);
      setSettings(body);
    } catch {
      // state unchanged on error
    }
  }

  async function handleUpload(domain, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState((s) => ({ ...s, [domain]: { uploading: true, error: null } }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/inputs/${domain}`, { method: 'POST', body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? `HTTP ${res.status}`);
      load();
      setUploadState((s) => ({ ...s, [domain]: { uploading: false, error: null } }));
    } catch (err) {
      setUploadState((s) => ({ ...s, [domain]: { uploading: false, error: err.message } }));
    } finally {
      e.target.value = '';
    }
  }

  async function handleDelete(domain, filename) {
    try {
      const res = await fetch(`/api/inputs/${domain}/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.detail ?? `HTTP ${res.status}`);
      }
      load();
    } catch {
      // silently ignore — list will be stale but a reload fixes it
    }
  }

  const grouped = UPLOAD_DOMAINS.reduce((acc, d) => {
    acc[d] = sources.items.filter((s) => s.domain === d);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {sources.status === 'loading' && (
        <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b' }}>Loading sources…</div>
      )}

      {sources.status === 'ok' && UPLOAD_DOMAINS.map((d) => {
        const color = DOMAIN_COLORS[d];
        const items = grouped[d];
        const armed = settings[d];
        const us = uploadState[d] ?? { uploading: false, error: null };

        return (
          <section
            key={d}
            style={{
              borderRadius: 5,
              border: `1px solid ${armed ? 'rgba(45,212,191,0.25)' : '#1e1e1e'}`,
              borderLeft: `3px solid ${armed ? '#2dd4bf' : '#1e1e1e'}`,
              backgroundColor: armed ? 'rgba(45,212,191,0.03)' : 'transparent',
              padding: '16px 18px',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
          >
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: armed ? 6 : 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9b9b9b' }}>
                  {DOMAIN_LABELS[d]} — {items.length} file{items.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => fileRefs.current[d]?.click()}
                  disabled={us.uploading}
                  style={{
                    padding: '3px 10px', borderRadius: 3, cursor: us.uploading ? 'not-allowed' : 'pointer',
                    fontFamily: 'IBM Plex Mono', fontSize: 10,
                    backgroundColor: 'transparent',
                    color: us.uploading ? '#3b3b3b' : '#6b6b6b',
                    border: '1px solid #2e2e2e',
                  }}
                >
                  {us.uploading ? 'Uploading…' : '+ Add file'}
                </button>
                <input
                  ref={(el) => { fileRefs.current[d] = el; }}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => handleUpload(d, e)}
                />
                <button
                  type="button"
                  onClick={() => toggleDomain(d)}
                  style={{
                    padding: '3px 12px', borderRadius: 3, cursor: 'pointer',
                    fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: armed ? 600 : 400,
                    backgroundColor: armed ? 'rgba(45,212,191,0.15)' : 'transparent',
                    color: armed ? '#2dd4bf' : '#4b4b4b',
                    border: `1px solid ${armed ? '#2dd4bf' : '#2e2e2e'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  {armed ? 'Armed ✓ — click to disarm' : 'Arm for next run'}
                </button>
              </div>
            </div>

            {/* Armed explainer */}
            {armed && (
              <div style={{
                fontFamily: 'IBM Plex Sans', fontSize: 12, color: '#2dd4bf',
                opacity: 0.7, marginBottom: 14, paddingLeft: 16,
              }}>
                The {DOMAIN_LABELS[d].toLowerCase()} agent will read these files on its next run, then disarm automatically.
              </div>
            )}

            {/* Upload error */}
            {us.error && (
              <div style={{
                borderRadius: 3, border: '1px solid rgba(239,68,68,0.3)',
                backgroundColor: 'rgba(239,68,68,0.08)', color: '#fca5a5',
                fontFamily: 'IBM Plex Mono', fontSize: 11, padding: '6px 10px', marginBottom: 10,
              }}>
                {us.error}
              </div>
            )}

            {/* File list */}
            {items.length === 0 ? (
              <div style={{
                fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#3b3b3b',
                padding: '10px 14px', border: '1px solid #1e1e1e', borderRadius: 4,
              }}>
                No source files uploaded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {items.map((src) => (
                  <div
                    key={src.path}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '7px 12px', backgroundColor: '#0d0d0d',
                      border: '1px solid #1e1e1e', borderRadius: 4,
                    }}
                  >
                    <a
                      href={`/api/inputs/${src.domain}/${encodeURIComponent(src.filename)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#c0c0c0',
                        flex: 1, textDecoration: 'none', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#f0f0f0'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#c0c0c0'; }}
                    >
                      {src.filename}
                    </a>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#4b4b4b', flexShrink: 0 }}>
                      {(src.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(src.domain, src.filename)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#3b3b3b', fontFamily: 'IBM Plex Mono', fontSize: 14,
                        lineHeight: 1, padding: '0 2px', flexShrink: 0,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#fca5a5'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#3b3b3b'; }}
                      title="Remove file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { DOMAIN_COLORS, DOMAIN_LABELS } from './BriefCard.jsx';
import LinksModal from './LinksModal.jsx';

const UPLOAD_DOMAINS = ['energy', 'finance', 'healthcare'];

export default function SourcesPanel() {
  const [sources, setSources] = useState({ status: 'loading', items: [] });
  const [settings, setSettings] = useState({ energy: false, finance: false, healthcare: false });
  const [uploadState, setUploadState] = useState({});
  const [linksModal, setLinksModal] = useState(null);
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
      // silently ignore
    }
  }

  const grouped = UPLOAD_DOMAINS.reduce((acc, d) => {
    acc[d] = sources.items.filter((s) => s.domain === d);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {linksModal && (
        <LinksModal
          domain={linksModal}
          onClose={() => setLinksModal(null)}
          onSaved={load}
        />
      )}

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
              padding: '14px 16px',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: armed ? 6 : 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9b9b9b' }}>
                  {DOMAIN_LABELS[d]} — {items.length} file{items.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => fileRefs.current[d]?.click()}
                  disabled={us.uploading}
                  style={{ padding: '2px 8px', borderRadius: 3, cursor: us.uploading ? 'not-allowed' : 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 10, backgroundColor: 'transparent', color: us.uploading ? '#3b3b3b' : '#6b6b6b', border: '1px solid #2e2e2e' }}
                >
                  {us.uploading ? 'Uploading…' : '+ PDF'}
                </button>
                <input ref={(el) => { fileRefs.current[d] = el; }} type="file" accept=".pdf,.md,.txt" style={{ display: 'none' }} onChange={(e) => handleUpload(d, e)} />
                <button
                  type="button"
                  onClick={() => setLinksModal(d)}
                  style={{ padding: '2px 8px', borderRadius: 3, cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 10, backgroundColor: 'transparent', color: '#6b6b6b', border: '1px solid #2e2e2e' }}
                >
                  + Links
                </button>
                <button
                  type="button"
                  onClick={() => toggleDomain(d)}
                  style={{ padding: '2px 10px', borderRadius: 3, cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: armed ? 600 : 400, backgroundColor: armed ? 'rgba(45,212,191,0.15)' : 'transparent', color: armed ? '#2dd4bf' : '#4b4b4b', border: `1px solid ${armed ? '#2dd4bf' : '#2e2e2e'}`, transition: 'all 0.15s' }}
                >
                  {armed ? 'Armed ✓' : 'Arm'}
                </button>
              </div>
            </div>

            {armed && (
              <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 11, color: '#2dd4bf', opacity: 0.7, marginBottom: 10, paddingLeft: 14 }}>
                These files will be the primary research material on the next run.
              </div>
            )}

            {us.error && (
              <div style={{ borderRadius: 3, border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontFamily: 'IBM Plex Mono', fontSize: 11, padding: '5px 8px', marginBottom: 8 }}>
                {us.error}
              </div>
            )}

            {items.length === 0 ? (
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#3b3b3b', padding: '8px 12px', border: '1px solid #1e1e1e', borderRadius: 4 }}>
                No files uploaded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map((src) => (
                  <div key={src.path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', backgroundColor: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 4 }}>
                    <a
                      href={`/api/inputs/${src.domain}/${encodeURIComponent(src.filename)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: 'IBM Plex Sans', fontSize: 12, color: '#c0c0c0', flex: 1, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
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
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b3b3b', fontFamily: 'IBM Plex Mono', fontSize: 14, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
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

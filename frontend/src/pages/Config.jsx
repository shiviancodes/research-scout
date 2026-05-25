import { useEffect, useState } from 'react';

const TABS = [
  { key: 'standards', label: 'Standards', getUrl: '/api/standards', postUrl: '/api/standards', restoreUrl: null },
  { key: 'finance', label: 'Finance Agent', getUrl: '/api/agents/finance', postUrl: '/api/agents/finance', restoreUrl: '/api/agents/finance/restore' },
  { key: 'healthcare', label: 'Healthcare Agent', getUrl: '/api/agents/healthcare', postUrl: '/api/agents/healthcare', restoreUrl: '/api/agents/healthcare/restore' },
  { key: 'energy', label: 'Energy Agent', getUrl: '/api/agents/energy', postUrl: '/api/agents/energy', restoreUrl: '/api/agents/energy/restore' },
  { key: 'synthesis', label: 'Synthesis Agent', getUrl: '/api/agents/synthesis', postUrl: '/api/agents/synthesis', restoreUrl: '/api/agents/synthesis/restore' },
  { key: 'orchestrator', label: 'Orchestrator Agent', getUrl: '/api/agents/orchestrator', postUrl: '/api/agents/orchestrator', restoreUrl: '/api/agents/orchestrator/restore' },
];

const TAB_STYLE_BASE = {
  fontFamily: 'IBM Plex Mono', fontSize: 11, textTransform: 'uppercase',
  letterSpacing: '0.12em', cursor: 'pointer', background: 'none', border: 'none',
  borderBottom: '2px solid transparent', paddingBottom: 6, paddingLeft: 0, paddingRight: 0, marginRight: 20,
};

const LINE_COUNT = 120;
const LINE_NUMBERS = Array.from({ length: LINE_COUNT }, (_, i) => i + 1);

export default function Config() {
  const [activeTab, setActiveTab] = useState('standards');
  const [editorState, setEditorState] = useState({});
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { document.title = 'Config — Research Scout'; }, []);

  const tab = TABS.find((t) => t.key === activeTab);

  useEffect(() => {
    if (editorState[activeTab]) return;
    fetch(tab.getUrl)
      .then((r) => r.json())
      .then((body) => {
        setEditorState((s) => ({ ...s, [activeTab]: { status: 'ok', draft: body.content } }));
      })
      .catch((err) => {
        setEditorState((s) => ({ ...s, [activeTab]: { status: 'error', error: err.message } }));
      });
  }, [activeTab, tab]);

  function showToast(kind, text) {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSave() {
    const current = editorState[activeTab];
    if (!current || current.status !== 'ok') return;
    setSaving(true);
    try {
      const res = await fetch(tab.postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: current.draft }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? `HTTP ${res.status}`);
      showToast('success', `Saved`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore() {
    if (!tab.restoreUrl) return;
    setRestoring(true);
    try {
      const res = await fetch(tab.restoreUrl, { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? `HTTP ${res.status}`);
      setEditorState((s) => ({ ...s, [activeTab]: { status: 'ok', draft: body.content } }));
      showToast('success', 'Restored to default');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setRestoring(false);
    }
  }

  const current = editorState[activeTab];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header>
        <h1 style={{ fontFamily: 'IBM Plex Sans', fontSize: 32, fontWeight: 300, color: '#f0f0f0', margin: 0, letterSpacing: '-0.02em' }}>
          Configuration
        </h1>
        <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b', marginTop: 8, marginBottom: 0 }}>
          Edit agent instructions and the quality bar. Changes take effect on the next run.
        </p>
      </header>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e1e1e', flexWrap: 'wrap', gap: 0 }}>
        {TABS.map((t) => {
          const active = t.key === activeTab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              style={{ ...TAB_STYLE_BASE, color: active ? '#f0f0f0' : '#6b6b6b', borderBottom: active ? '2px solid #f0f0f0' : '2px solid transparent', marginRight: 20 }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Warning banner */}
      <div style={{ borderRadius: 4, border: '1px solid rgba(251,191,36,0.2)', backgroundColor: 'rgba(251,191,36,0.05)', color: '#fcd34d', fontSize: 13, fontFamily: 'IBM Plex Sans', padding: '10px 14px' }}>
        {activeTab === 'standards'
          ? 'STANDARDS.md is read by all agents before every research run.'
          : `${tab.label} is dispatched by the orchestrator during a research run.`}
        {' '}Changes take effect on the next run.
      </div>

      {/* Editor */}
      {!current && (
        <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b' }}>Loading…</div>
      )}
      {current?.status === 'error' && (
        <div style={{ borderRadius: 4, border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#fca5a5', padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
          {current.error}
        </div>
      )}
      {current?.status === 'ok' && (
        <>
          <div style={{ position: 'relative', display: 'flex', height: 560, border: '1px solid #1e1e1e', borderRadius: 4, overflow: 'hidden', backgroundColor: '#111111' }}>
            <div aria-hidden="true" style={{ width: '2.8rem', flexShrink: 0, backgroundColor: '#0d0d0d', borderRight: '1px solid #1e1e1e', padding: '16px 0', userSelect: 'none', pointerEvents: 'none', overflowY: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              {LINE_NUMBERS.map((n) => (
                <div key={n} style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#2e2e2e', lineHeight: '1.6', paddingRight: 8, height: '20.8px' }}>{n}</div>
              ))}
            </div>
            <textarea
              value={current.draft}
              onChange={(e) => setEditorState((s) => ({ ...s, [activeTab]: { ...s[activeTab], draft: e.target.value } }))}
              spellCheck={false}
              style={{ flex: 1, height: '100%', backgroundColor: '#111111', border: 'none', outline: 'none', padding: '16px', fontFamily: 'IBM Plex Mono', fontSize: 13, color: '#f0f0f0', lineHeight: 1.6, resize: 'none', overflowY: 'auto' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button" onClick={handleSave} disabled={saving || restoring}
              style={{ padding: '7px 18px', borderRadius: 3, fontFamily: 'IBM Plex Mono', fontSize: 13, backgroundColor: '#f0f0f0', color: '#0a0a0a', border: 'none', cursor: (saving || restoring) ? 'not-allowed' : 'pointer', opacity: (saving || restoring) ? 0.5 : 1, fontWeight: 500 }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {tab.restoreUrl && (
              <button
                type="button" onClick={handleRestore} disabled={saving || restoring}
                style={{ padding: '7px 18px', borderRadius: 3, fontFamily: 'IBM Plex Mono', fontSize: 13, backgroundColor: 'transparent', color: '#6b6b6b', border: '1px solid #2e2e2e', cursor: (saving || restoring) ? 'not-allowed' : 'pointer', opacity: (saving || restoring) ? 0.5 : 1 }}
              >
                {restoring ? 'Restoring…' : 'Restore to default'}
              </button>
            )}
            {toast && (
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: toast.kind === 'success' ? '#4ade80' : '#f87171' }}>
                {toast.text}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

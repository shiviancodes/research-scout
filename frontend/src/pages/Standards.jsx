import { useEffect, useRef, useState } from 'react';

function parseSectionCount(content, headingKeyword) {
  const lines = content.split('\n');
  let inSection = false;
  let count = 0;
  for (const line of lines) {
    if (/^#{1,3}\s/.test(line)) {
      inSection = line.toLowerCase().includes(headingKeyword.toLowerCase());
      continue;
    }
    if (inSection && /^\d+\.\s/.test(line.trim())) {
      count++;
    }
  }
  return count;
}

const LINE_COUNT = 100;
const LINE_NUMBERS = Array.from({ length: LINE_COUNT }, (_, i) => i + 1);

export default function Standards() {
  const [state, setState] = useState({ status: 'loading' });
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const gutterRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    document.title = 'Standards — Research Scout';
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/standards');
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setState({ status: 'error', error: body.detail ?? `HTTP ${res.status}` });
          return;
        }
        setDraft(body.content);
        setState({ status: 'ok' });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', error: err.message });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function save() {
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch('/api/standards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft })
      });
      const body = await res.json();
      if (!res.ok) {
        setToast({ kind: 'error', text: body.detail ?? `HTTP ${res.status}` });
      } else {
        setToast({ kind: 'success', text: `Saved to ${body.path}` });
      }
    } catch (err) {
      setToast({ kind: 'error', text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  const nonNegCount = state.status === 'ok' ? parseSectionCount(draft, 'non-negotiable') : 0;
  const disqualCount = state.status === 'ok' ? parseSectionCount(draft, 'disqualif') : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
          Standards
        </h1>
        <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b', marginTop: 8, marginBottom: 0 }}>
          Edit the quality bar served from{' '}
          <span style={{ fontFamily: 'IBM Plex Mono' }}>prompts/STANDARDS.md</span>.
        </p>
      </header>

      {state.status === 'ok' && (nonNegCount > 0 || disqualCount > 0) && (
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#6b6b6b', display: 'flex', gap: 16 }}>
          {nonNegCount > 0 && <span>{nonNegCount} non-negotiables</span>}
          {nonNegCount > 0 && disqualCount > 0 && <span style={{ color: '#3b3b3b' }}>·</span>}
          {disqualCount > 0 && <span>{disqualCount} disqualifiers</span>}
        </div>
      )}

      <div
        style={{
          borderRadius: 4,
          border: '1px solid rgba(251,191,36,0.2)',
          backgroundColor: 'rgba(251,191,36,0.05)',
          color: '#fcd34d',
          fontSize: 13,
          fontFamily: 'IBM Plex Sans',
          padding: '10px 14px'
        }}
      >
        This file is read by Claude Code agents before every research run. Changes take effect on the next run.
      </div>

      {state.status === 'loading' && (
        <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b' }}>
          Loading standards…
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
        <>
          <div style={{ position: 'relative', display: 'flex', height: 600, border: '1px solid #1e1e1e', borderRadius: 4, overflow: 'hidden', backgroundColor: '#111111' }}>
            {/* Decorative line-number gutter */}
            <div
              ref={gutterRef}
              aria-hidden="true"
              style={{
                width: '2.8rem',
                flexShrink: 0,
                backgroundColor: '#0d0d0d',
                borderRight: '1px solid #1e1e1e',
                padding: '16px 0',
                userSelect: 'none',
                pointerEvents: 'none',
                overflowY: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end'
              }}
            >
              {LINE_NUMBERS.map((n) => (
                <div
                  key={n}
                  style={{
                    fontFamily: 'IBM Plex Mono',
                    fontSize: 11,
                    color: '#2e2e2e',
                    lineHeight: '1.6',
                    paddingRight: 8,
                    height: '20.8px'
                  }}
                >
                  {n}
                </div>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1,
                height: '100%',
                backgroundColor: '#111111',
                border: 'none',
                outline: 'none',
                padding: '16px',
                fontFamily: 'IBM Plex Mono',
                fontSize: 13,
                color: '#f0f0f0',
                lineHeight: 1.6,
                resize: 'none',
                overflowY: 'auto'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              style={{
                padding: '7px 18px',
                borderRadius: 3,
                fontFamily: 'IBM Plex Mono',
                fontSize: 13,
                backgroundColor: '#f0f0f0',
                color: '#0a0a0a',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1,
                fontWeight: 500
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {toast && (
              <span
                style={{
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 12,
                  color: toast.kind === 'success' ? '#4ade80' : '#f87171'
                }}
              >
                {toast.text}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

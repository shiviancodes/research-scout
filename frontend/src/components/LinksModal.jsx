import { useState } from 'react';
import { DOMAIN_LABELS } from './BriefCard.jsx';

const OVERLAY = {
  position: 'fixed', inset: 0, zIndex: 1000,
  backgroundColor: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const MODAL = {
  backgroundColor: '#111111',
  border: '1px solid #2e2e2e',
  borderRadius: 6,
  padding: '28px 32px',
  width: 480,
  maxWidth: '90vw',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const LABEL = {
  fontFamily: 'IBM Plex Mono', fontSize: 11,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  color: '#6b6b6b', marginBottom: 6, display: 'block',
};

const INPUT_BASE = {
  width: '100%', boxSizing: 'border-box',
  backgroundColor: '#0a0a0a',
  border: '1px solid #2e2e2e',
  borderRadius: 3,
  color: '#f0f0f0',
  fontFamily: 'IBM Plex Sans', fontSize: 13,
  padding: '8px 10px',
  outline: 'none',
  resize: 'vertical',
  lineHeight: 1.5,
};

export default function LinksModal({ domain, onClose, onSaved }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const domainLabel = DOMAIN_LABELS[domain] ?? domain;

  async function handleSubmit() {
    const urls = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (urls.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/inputs/${domain}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? `HTTP ${res.status}`);
      setResults(body.results ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    const failedUrls = (results ?? [])
      .filter((r) => r.status === 'error')
      .map((r) => r.url)
      .join('\n');
    setText(failedUrls);
    setResults(null);
    setError(null);
  }

  const hasFailures = results && results.some((r) => r.status === 'error');

  return (
    <div style={OVERLAY} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={MODAL}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'IBM Plex Sans', fontSize: 15, fontWeight: 500, color: '#f0f0f0' }}>
            Add Links — {domainLabel}
          </span>
          <button
            type="button" onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b6b', fontFamily: 'IBM Plex Mono', fontSize: 16, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {results ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={LABEL}>Results</span>
              {results.map((r) => (
                <div
                  key={r.url}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '7px 10px',
                    backgroundColor: '#0d0d0d',
                    border: `1px solid ${r.status === 'ok' ? 'rgba(45,212,191,0.15)' : 'rgba(239,68,68,0.2)'}`,
                    borderRadius: 4,
                  }}
                >
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: r.status === 'ok' ? '#2dd4bf' : '#fca5a5', flexShrink: 0, marginTop: 1 }}>
                    {r.status === 'ok' ? '✓' : '✗'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{
                      fontFamily: 'IBM Plex Sans', fontSize: 12, color: '#c0c0c0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {r.url}
                    </span>
                    {r.status === 'ok' && r.saved_as && (
                      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#4b4b4b' }}>
                        saved as {r.saved_as}
                      </span>
                    )}
                    {r.status === 'error' && r.detail && (
                      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#fca5a5' }}>
                        {r.detail}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {hasFailures && (
                <button
                  type="button" onClick={handleRetry}
                  style={{
                    padding: '7px 16px', borderRadius: 3, cursor: 'pointer',
                    fontFamily: 'IBM Plex Mono', fontSize: 12,
                    backgroundColor: 'transparent', color: '#6b6b6b',
                    border: '1px solid #2e2e2e',
                  }}
                >
                  Retry
                </button>
              )}
              <button
                type="button"
                onClick={() => { if (results.some((r) => r.status === 'ok')) onSaved(); onClose(); }}
                style={{
                  padding: '7px 16px', borderRadius: 3, cursor: 'pointer',
                  fontFamily: 'IBM Plex Mono', fontSize: 12,
                  backgroundColor: '#f0f0f0', color: '#0a0a0a',
                  border: 'none', fontWeight: 500,
                }}
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <span style={LABEL}>URLs</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="One URL per line — paste YouTube links or any web URL"
                rows={6}
                style={INPUT_BASE}
              />
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#3b3b3b', marginTop: 5 }}>
                YouTube links: transcript will be fetched and saved automatically.
              </div>
            </div>

            {error && (
              <div style={{
                borderRadius: 3,
                border: '1px solid rgba(239,68,68,0.3)',
                backgroundColor: 'rgba(239,68,68,0.08)',
                color: '#fca5a5',
                fontFamily: 'IBM Plex Mono', fontSize: 12,
                padding: '8px 12px',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button" onClick={onClose} disabled={submitting}
                style={{
                  padding: '7px 16px', borderRadius: 3,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'IBM Plex Mono', fontSize: 12,
                  backgroundColor: 'transparent',
                  color: submitting ? '#3b3b3b' : '#6b6b6b',
                  border: '1px solid #2e2e2e',
                }}
              >
                Cancel
              </button>
              <button
                type="button" onClick={handleSubmit}
                disabled={submitting || !text.trim()}
                style={{
                  padding: '7px 16px', borderRadius: 3,
                  cursor: (submitting || !text.trim()) ? 'not-allowed' : 'pointer',
                  fontFamily: 'IBM Plex Mono', fontSize: 12,
                  backgroundColor: (submitting || !text.trim()) ? '#2e2e2e' : '#f0f0f0',
                  color: (submitting || !text.trim()) ? '#6b6b6b' : '#0a0a0a',
                  border: 'none', fontWeight: 500,
                }}
              >
                {submitting ? 'Saving…' : 'Save links'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { DOMAIN_COLORS, DOMAIN_LABELS } from './BriefCard.jsx';

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
  width: 460,
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
};

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

function inferTitle(filename) {
  const base = filename.replace(/\.md$/i, '');
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RegisterModal({ file, onClose, onRegistered }) {
  const [title, setTitle] = useState(() => inferTitle(file.filename));
  const [summary, setSummary] = useState('');
  const [tier, setTier] = useState('brief');
  const [slug, setSlug] = useState(() => slugify(inferTitle(file.filename)));
  const [slugEdited, setSlugEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const color = DOMAIN_COLORS[file.domain] ?? '#52525b';

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(title));
  }, [title, slugEdited]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!summary.trim()) { setError('Summary is required.'); return; }
    if (!slug.trim()) { setError('Slug is required.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/registry/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug.trim(),
          title: title.trim(),
          summary: summary.trim(),
          domain: file.domain,
          tier,
          path: file.path,
          sources: [],
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? `HTTP ${res.status}`);
      onRegistered(body);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div style={OVERLAY} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form style={MODAL} onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'IBM Plex Sans', fontSize: 15, fontWeight: 500, color: '#f0f0f0' }}>
            Register as Idea
          </span>
          <button
            type="button" onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b6b', fontFamily: 'IBM Plex Mono', fontSize: 16, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* File info */}
        <div style={{
          backgroundColor: '#0a0a0a', border: '1px solid #1e1e1e',
          borderRadius: 3, padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11, padding: '2px 7px',
            borderRadius: 3, border: `1px solid ${color}`, color, flexShrink: 0,
          }}>
            {DOMAIN_LABELS[file.domain] ?? file.domain}
          </span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#4b4b4b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.filename}
          </span>
        </div>

        {/* Title */}
        <div>
          <span style={LABEL}>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. CurtailmentIQ — Grid Curtailment Tracker"
            style={INPUT_BASE}
          />
        </div>

        {/* Slug */}
        <div>
          <span style={LABEL}>Slug</span>
          <input
            value={slug}
            onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSlugEdited(true); }}
            placeholder="auto-generated from title"
            style={{ ...INPUT_BASE, color: slugEdited ? '#f0f0f0' : '#6b6b6b' }}
          />
          {!slugEdited && (
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#3b3b3b', marginTop: 4 }}>
              auto-derived from title — edit to override
            </div>
          )}
        </div>

        {/* Summary */}
        <div>
          <span style={LABEL}>Summary</span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="One-sentence description of what this idea is…"
            rows={3}
            style={{ ...INPUT_BASE, resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        {/* Tier */}
        <div>
          <span style={LABEL}>Tier</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {['brief', 'concept'].map((t) => {
              const active = t === tier;
              return (
                <button
                  key={t} type="button" onClick={() => setTier(t)}
                  style={{
                    padding: '4px 12px', borderRadius: 3, cursor: 'pointer',
                    fontFamily: 'IBM Plex Mono', fontSize: 11,
                    backgroundColor: active ? '#f0f0f0' : 'transparent',
                    color: active ? '#0a0a0a' : '#6b6b6b',
                    border: active ? '1px solid #f0f0f0' : '1px solid #2e2e2e',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {t}
                </button>
              );
            })}
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

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            type="button" onClick={onClose} disabled={submitting}
            style={{
              padding: '7px 16px', borderRadius: 3, cursor: 'pointer',
              fontFamily: 'IBM Plex Mono', fontSize: 12,
              backgroundColor: 'transparent', color: '#6b6b6b',
              border: '1px solid #2e2e2e',
            }}
          >
            Cancel
          </button>
          <button
            type="submit" disabled={submitting}
            style={{
              padding: '7px 16px', borderRadius: 3, cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'IBM Plex Mono', fontSize: 12,
              backgroundColor: submitting ? '#2e2e2e' : '#f0f0f0',
              color: submitting ? '#6b6b6b' : '#0a0a0a',
              border: 'none', fontWeight: 500,
            }}
          >
            {submitting ? 'Registering…' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  );
}

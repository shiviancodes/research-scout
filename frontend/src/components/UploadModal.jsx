import { useRef, useState } from 'react';
import { DOMAIN_COLORS, DOMAIN_LABELS } from './BriefCard.jsx';

const UPLOAD_DOMAINS = ['energy', 'finance', 'healthcare'];

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
  width: 420,
  maxWidth: '90vw',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const LABEL = {
  fontFamily: 'IBM Plex Mono', fontSize: 11,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  color: '#6b6b6b', marginBottom: 8, display: 'block',
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

export default function UploadModal({ onClose, onUploaded }) {
  const [domain, setDomain] = useState('energy');
  const [tier, setTier] = useState('brief');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { setError('Select a markdown file first.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('domain', domain);
      fd.append('tier', tier);
      fd.append('file', file);
      const res = await fetch('/api/outputs/upload', { method: 'POST', body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? `HTTP ${res.status}`);
      onUploaded(body);
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
            Upload Brief
          </span>
          <button
            type="button" onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b6b', fontFamily: 'IBM Plex Mono', fontSize: 16, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Domain */}
        <div>
          <span style={LABEL}>Domain</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {UPLOAD_DOMAINS.map((d) => {
              const active = d === domain;
              const color = DOMAIN_COLORS[d];
              return (
                <button
                  key={d} type="button" onClick={() => setDomain(d)}
                  style={{
                    padding: '4px 12px', borderRadius: 3, cursor: 'pointer',
                    fontFamily: 'IBM Plex Mono', fontSize: 11,
                    backgroundColor: active ? color : 'transparent',
                    color: active ? '#0a0a0a' : color,
                    border: `1px solid ${color}`,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {DOMAIN_LABELS[d]}
                </button>
              );
            })}
          </div>
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

        {/* File */}
        <div>
          <span style={LABEL}>Markdown file</span>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              ...INPUT_BASE,
              cursor: 'pointer',
              color: file ? '#f0f0f0' : '#3b3b3b',
              display: 'flex', alignItems: 'center',
            }}
          >
            {file ? file.name : 'Click to select .md file…'}
          </div>
          <input
            ref={fileRef} type="file" accept=".md"
            style={{ display: 'none' }}
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); }}
          />
          {file && (
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#4b4b4b', marginTop: 4 }}>
              slug preview: {slugify(file.name.replace(/\.md$/i, ''))}
            </div>
          )}
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
            {submitting ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </form>
    </div>
  );
}

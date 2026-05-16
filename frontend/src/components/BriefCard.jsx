import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const DOMAIN_COLORS = {
  finance: '#2dd4bf',
  healthcare: '#f87171',
  energy: '#fbbf24',
  concepts: '#a78bfa'
};

export const DOMAIN_LABELS = {
  finance: 'Finance',
  healthcare: 'Healthcare',
  energy: 'Energy',
  concepts: 'Concepts'
};

export const TYPE_LABELS = {
  'project-brief': 'project-brief',
  concept: 'concept',
  findings: 'findings',
  synthesis: 'synthesis',
  unknown: 'unknown'
};

export function titleFromFilename(filename) {
  if (!filename) return '';
  return filename.replace(/\.md$/i, '');
}

function parseH1(content) {
  if (!content) return null;
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function parsePreview(content) {
  if (!content) return null;
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !/^#+\s/.test(trimmed)) {
      return trimmed.slice(0, 120);
    }
  }
  return null;
}

export default function BriefCard({ item, preview }) {
  const color = DOMAIN_COLORS[item.domain] ?? '#52525b';
  const [resolvedTitle, setResolvedTitle] = useState(titleFromFilename(item.filename));
  const [resolvedPreview, setResolvedPreview] = useState(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (preview !== undefined) {
      const h1 = parseH1(preview) ?? titleFromFilename(item.filename);
      setResolvedTitle(h1);
      setResolvedPreview(parsePreview(preview));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/outputs/${encodeURIComponent(item.domain)}/${encodeURIComponent(item.filename)}`
        );
        if (!res.ok || cancelled) return;
        const body = await res.json();
        if (cancelled) return;
        const content = body.content ?? '';
        setResolvedTitle(parseH1(content) ?? titleFromFilename(item.filename));
        setResolvedPreview(parsePreview(content));
      } catch {
        // fallback to filename already set
      }
    })();
    return () => { cancelled = true; };
  }, [item.domain, item.filename, preview]);

  const isFilledType = item.type === 'project-brief' || item.type === 'findings' || item.type === 'synthesis';

  return (
    <Link
      to={`/brief/${item.domain}/${encodeURIComponent(item.filename)}`}
      className="block rounded-md"
      style={{
        backgroundColor: hovered ? '#161616' : '#111111',
        border: '1px solid #1e1e1e',
        borderLeftWidth: 4,
        borderLeftColor: color,
        textDecoration: 'none',
        transition: 'background-color 150ms ease'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="p-4 flex flex-col gap-2" style={{ minHeight: 0 }}>
        <div
          className="truncate"
          title={resolvedTitle}
          style={{
            fontFamily: 'IBM Plex Sans',
            fontSize: 14,
            fontWeight: 500,
            color: '#f0f0f0'
          }}
        >
          {resolvedTitle}
        </div>

        {resolvedPreview && (
          <div
            className="truncate"
            style={{ fontSize: 12, color: '#6b6b6b', fontFamily: 'IBM Plex Sans' }}
          >
            {resolvedPreview}
          </div>
        )}

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span
            style={{
              fontFamily: 'IBM Plex Mono',
              fontSize: 11,
              padding: '2px 7px',
              borderRadius: 3,
              border: `1px solid ${color}`,
              color
            }}
          >
            {DOMAIN_LABELS[item.domain] ?? item.domain}
          </span>

          <span
            style={{
              fontFamily: 'IBM Plex Mono',
              fontSize: 11,
              padding: '2px 7px',
              borderRadius: 3,
              backgroundColor: isFilledType ? '#1e1e1e' : 'transparent',
              border: isFilledType ? 'none' : '1px solid #2e2e2e',
              color: '#9b9b9b'
            }}
          >
            {TYPE_LABELS[item.type] ?? item.type}
          </span>

          {item.date && (
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#6b6b6b' }}>
              {item.date}
            </span>
          )}

          <span style={{ marginLeft: 'auto', fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#6b6b6b' }}>
            open{' '}
            <span style={{ display: 'inline-block', transition: 'transform 150ms ease', transform: hovered ? 'translateX(3px)' : 'translateX(0)' }}>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

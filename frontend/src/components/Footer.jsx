import { useState, useEffect } from 'react';
import LogoMark from './LogoMark.jsx';

function GitHubLink() {
  const [hovered, setHovered] = useState(false);
  const color = hovered ? '#f0f0f0' : '#6b6b6b';
  return (
    <a
      href="https://github.com/ShivianNaidoo/research-scout"
      target="_blank"
      rel="noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color,
        textDecoration: 'none',
        transition: 'color 150ms ease'
      }}
    >
      <svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor" aria-label="GitHub">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
      research-scout
    </a>
  );
}

export default function Footer() {
  const [lastRun, setLastRun] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/outputs');
        if (!res.ok) return;
        const items = await res.json();
        const dates = items.map((it) => it.date).filter(Boolean).sort().reverse();
        if (dates.length > 0) setLastRun(dates[0]);
      } catch {
        // ignore — footer is decorative
      }
    })();
  }, []);

  return (
    <footer
      style={{
        backgroundColor: '#0a0a0a',
        borderTop: '1px solid #1e1e1e',
        padding: '16px 24px'
      }}
    >
      <div
        style={{
          maxWidth: '72rem',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'IBM Plex Mono',
          fontSize: 11,
          color: '#6b6b6b'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoMark size={14} color="#3b3b3b" />
          <span style={{ letterSpacing: '0.12em' }}>RESEARCH SCOUT</span>
        </div>

        <div>Built by Shivian Naidoo</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GitHubLink />
          <span style={{ color: '#2e2e2e' }}>·</span>
          <span>
            {lastRun != null ? `Last run: ${lastRun}` : 'No runs yet'}
          </span>
        </div>
      </div>
    </footer>
  );
}

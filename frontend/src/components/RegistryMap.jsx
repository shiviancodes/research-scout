import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function ArrowLink({ to }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={to}
      style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: hovered ? '#f0f0f0' : '#9b9b9b', textDecoration: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      open{' '}
      <span style={{ display: 'inline-block', transition: 'transform 150ms ease', transform: hovered ? 'translateX(3px)' : 'translateX(0)' }}>→</span>
    </Link>
  );
}
import { DOMAIN_COLORS, DOMAIN_LABELS } from './BriefCard.jsx';

export default function RegistryMap() {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/registry');
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setState({ status: 'error', error: body.detail ?? `HTTP ${res.status}` });
          return;
        }
        setState({ status: 'ok', data: body });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', error: err.message });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const ideas = state.status === 'ok' ? (state.data.ideas ?? []) : [];
  const title = `IDEA REGISTRY${state.status === 'ok' ? ` — ${ideas.length} idea${ideas.length !== 1 ? 's' : ''} tracked` : ''}`;

  return (
    <section style={{ marginTop: 48 }}>
      <h2
        style={{
          fontFamily: 'IBM Plex Mono',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#6b6b6b',
          marginBottom: 16
        }}
      >
        {title}
      </h2>

      {state.status === 'loading' && (
        <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b' }}>
          Loading registry…
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

      {state.status === 'ok' && <RegistryTable ideas={ideas} />}
    </section>
  );
}

function RegistryTable({ ideas }) {
  if (ideas.length === 0) {
    return (
      <div
        style={{
          borderRadius: 4,
          border: '1px solid #1e1e1e',
          backgroundColor: 'rgba(17,17,17,0.5)',
          padding: '20px 24px',
          fontFamily: 'IBM Plex Sans',
          fontSize: 13,
          color: '#6b6b6b'
        }}
      >
        No ideas have been registered yet. The synthesis agent will append entries here as it produces briefs and concept notes.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 4, border: '1px solid #1e1e1e' }}>
      <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#111111' }}>
            {['Slug', 'Title', 'Domain', 'Tier', 'Created', ''].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#6b6b6b',
                  borderBottom: '1px solid #1e1e1e',
                  fontWeight: 500
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ideas.map((idea, index) => {
            const color = DOMAIN_COLORS[idea.domain] ?? '#52525b';
            const filename = idea.path ? idea.path.split('/').pop() : null;
            const rowBg = index % 2 === 0 ? '#111111' : '#0d0d0d';
            const isBrief = idea.tier === 'brief' || idea.tier === 'project-brief';

            return (
              <tr key={idea.slug} style={{ backgroundColor: rowBg }}>
                <td style={{ padding: '8px 12px', fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#9b9b9b' }}>
                  {idea.slug}
                </td>
                <td style={{ padding: '8px 12px', fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#f0f0f0' }}>
                  {idea.title}
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: color,
                        display: 'inline-block',
                        flexShrink: 0
                      }}
                    />
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color }}>
                      {DOMAIN_LABELS[idea.domain] ?? idea.domain}
                    </span>
                  </span>
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span
                    style={{
                      fontFamily: 'IBM Plex Mono',
                      fontSize: 10,
                      padding: '2px 7px',
                      borderRadius: 3,
                      backgroundColor: isBrief ? color : 'transparent',
                      color: isBrief ? '#0a0a0a' : color,
                      border: isBrief ? 'none' : `1px solid ${color}`,
                      fontWeight: isBrief ? 500 : 400
                    }}
                  >
                    {idea.tier}
                  </span>
                </td>
                <td style={{ padding: '8px 12px', fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#6b6b6b' }}>
                  {idea.created}
                </td>
                <td style={{ padding: '8px 12px', fontSize: 12 }}>
                  {idea.domain && filename ? (
                    <ArrowLink to={`/brief/${idea.domain}/${encodeURIComponent(filename)}`} />
                  ) : (
                    <span style={{ color: '#3b3b3b' }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

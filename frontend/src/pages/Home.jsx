import { useEffect, useState } from 'react';
import IndustrySelector from '../components/IndustrySelector.jsx';
import RunInstructions from '../components/RunInstructions.jsx';
import BriefCard, { DOMAIN_LABELS } from '../components/BriefCard.jsx';
import LogoMark from '../components/LogoMark.jsx';

export default function Home() {
  const [selected, setSelected] = useState([]);
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    document.title = 'Research Scout';
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/outputs');
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

  const latestPerDomain = pickLatestBriefs(state.data ?? [], selected);
  const briefCounts = computeBriefCounts(state.data ?? []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
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
          Research Intelligence
        </h1>
        <p
          style={{
            fontFamily: 'IBM Plex Sans',
            fontSize: 13,
            color: '#6b6b6b',
            marginTop: 8,
            marginBottom: 0
          }}
        >
          Select an industry. Run the agent. Review what it finds.
        </p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <IndustrySelector selected={selected} onChange={setSelected} counts={briefCounts} />
        <RunInstructions selected={selected} />
      </section>

      <section>
        <h2
          style={{
            fontFamily: 'IBM Plex Mono',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#6b6b6b',
            marginBottom: 16,
            marginTop: 0
          }}
        >
          Latest briefs
        </h2>

        {state.status === 'loading' && (
          <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b' }}>
            Loading briefs…
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

        {state.status === 'ok' && selected.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              padding: '60px 24px'
            }}
          >
            <LogoMark size={48} color="#3b3b3b" />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 11,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#4b4b4b'
                }}
              >
                Research Scout v1.0
              </span>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#3b3b3b' }}>
                Select an industry to begin.
              </span>
            </div>
          </div>
        )}

        {state.status === 'ok' && selected.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16
            }}
          >
            {selected.map((d) =>
              latestPerDomain[d] ? (
                <BriefCard key={d} item={latestPerDomain[d]} />
              ) : (
                <div
                  key={d}
                  style={{
                    borderRadius: 4,
                    border: '1px solid #1e1e1e',
                    backgroundColor: 'rgba(17,17,17,0.5)',
                    padding: '16px',
                    fontFamily: 'IBM Plex Sans',
                    fontSize: 13,
                    color: '#6b6b6b'
                  }}
                >
                  No briefs for{' '}
                  <span style={{ fontFamily: 'IBM Plex Mono', color: '#9b9b9b' }}>
                    {DOMAIN_LABELS[d]}
                  </span>{' '}
                  yet.
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function computeBriefCounts(items) {
  const counts = {};
  for (const item of items) {
    if (item.type === 'project-brief') {
      counts[item.domain] = (counts[item.domain] ?? 0) + 1;
    }
  }
  return counts;
}

function pickLatestBriefs(items, domains) {
  const result = {};
  for (const d of domains) {
    const briefs = items
      .filter((it) => it.domain === d && it.type === 'project-brief')
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    if (briefs.length > 0) result[d] = briefs[0];
  }
  return result;
}

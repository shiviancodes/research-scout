import { useEffect, useMemo, useState } from 'react';
import IndustrySelector from '../components/IndustrySelector.jsx';
import RunInstructions from '../components/RunInstructions.jsx';
import SourcesPanel from '../components/SourcesPanel.jsx';
import BriefCard, { DOMAIN_COLORS, DOMAIN_LABELS } from '../components/BriefCard.jsx';
import LogoMark from '../components/LogoMark.jsx';

const DOMAIN_ORDER = ['finance', 'healthcare', 'energy'];

export default function Home() {
  const [selected, setSelected] = useState([]);
  const [state, setState] = useState({ status: 'loading' });
  const [sourcesOpen, setSourcesOpen] = useState(false);

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

  const latestFindings = useMemo(() => {
    if (state.status !== 'ok') return {};
    const result = {};
    for (const d of DOMAIN_ORDER) {
      const findings = state.data
        .filter((it) => it.domain === d && it.type === 'findings')
        .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
      if (findings.length > 0) result[d] = findings[0];
    }
    return result;
  }, [state]);

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 40 }}>
        <header>
          <h1 style={{ fontFamily: 'IBM Plex Sans', fontSize: 32, fontWeight: 300, color: '#f0f0f0', margin: 0, letterSpacing: '-0.02em' }}>
            Research Intelligence
          </h1>
          <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b', marginTop: 8, marginBottom: 0 }}>
            Select an industry. Run the agent. Review what it finds.
          </p>
        </header>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <IndustrySelector selected={selected} onChange={setSelected} />
          <RunInstructions selected={selected} />
        </section>

        {/* Latest findings */}
        <section>
          <h2 style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6b6b6b', marginBottom: 16, marginTop: 0 }}>
            Latest findings
          </h2>

          {state.status === 'loading' && (
            <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b' }}>Loading…</div>
          )}
          {state.status === 'error' && (
            <div style={{ borderRadius: 4, border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#fca5a5', padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
              {state.error}
            </div>
          )}
          {state.status === 'ok' && selected.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '60px 24px' }}>
              <LogoMark size={48} color="#3b3b3b" />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4b4b4b' }}>
                  Research Scout
                </span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#3b3b3b' }}>
                  Select an industry to begin.
                </span>
              </div>
            </div>
          )}
          {state.status === 'ok' && selected.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {selected.map((d) =>
                latestFindings[d] ? (
                  <BriefCard key={d} item={latestFindings[d]} />
                ) : (
                  <div key={d} style={{ borderRadius: 4, border: '1px solid #1e1e1e', backgroundColor: 'rgba(17,17,17,0.5)', padding: '16px', fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b' }}>
                    No findings for{' '}
                    <span style={{ fontFamily: 'IBM Plex Mono', color: '#9b9b9b' }}>{DOMAIN_LABELS[d]}</span> yet.
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {/* Sources right panel */}
      <div style={{ width: 300, flexShrink: 0 }}>
        <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            type="button"
            onClick={() => setSourcesOpen((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%' }}
          >
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6b6b6b' }}>
              Sources
            </span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#3b3b3b' }}>
              {sourcesOpen ? '▲' : '▼'}
            </span>
          </button>
          {sourcesOpen && <SourcesPanel />}
        </div>
      </div>
    </div>
  );
}

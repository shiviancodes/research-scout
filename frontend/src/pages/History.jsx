import { useEffect, useMemo, useState } from 'react';
import BriefCard, { DOMAIN_COLORS, DOMAIN_LABELS } from '../components/BriefCard.jsx';
import RegistryMap from '../components/RegistryMap.jsx';
import IdeasTab from './IdeasTab.jsx';

const DOMAIN_ORDER = ['finance', 'healthcare', 'energy', 'concepts'];
const TYPE_FILTERS = ['all', 'project-brief', 'concept', 'findings', 'synthesis'];

const TAB_STYLE_BASE = {
  fontFamily: 'IBM Plex Mono',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  borderBottom: '2px solid transparent',
  paddingBottom: 6,
  paddingLeft: 0,
  paddingRight: 0,
  marginRight: 24,
};

export default function History() {
  const [activeTab, setActiveTab] = useState('artefacts');
  const [state, setState] = useState({ status: 'loading' });
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    document.title = 'History — Research Scout';
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

  const grouped = useMemo(() => {
    if (state.status !== 'ok') return {};
    const filtered =
      typeFilter === 'all'
        ? state.data
        : state.data.filter((it) => it.type === typeFilter);
    const groups = {};
    for (const d of DOMAIN_ORDER) groups[d] = [];
    for (const item of filtered) {
      if (groups[item.domain]) groups[item.domain].push(item);
    }
    for (const d of DOMAIN_ORDER) {
      groups[d].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    }
    return groups;
  }, [state, typeFilter]);

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
          History
        </h1>
        <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b', marginTop: 8, marginBottom: 0 }}>
          Every artefact produced by the agents, grouped by domain.
        </p>
      </header>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e1e1e', paddingBottom: 0, marginBottom: -16 }}>
        {['artefacts', 'ideas'].map((tab) => {
          const active = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                ...TAB_STYLE_BASE,
                color: active ? '#f0f0f0' : '#6b6b6b',
                borderBottom: active ? '2px solid #f0f0f0' : '2px solid transparent',
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {activeTab === 'artefacts' && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'IBM Plex Mono',
                fontSize: 11,
                color: '#6b6b6b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginRight: 4
              }}
            >
              type:
            </span>
            {TYPE_FILTERS.map((t) => {
              const active = t === typeFilter;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 3,
                    fontFamily: 'IBM Plex Mono',
                    fontSize: 12,
                    cursor: 'pointer',
                    backgroundColor: active ? '#f0f0f0' : 'transparent',
                    color: active ? '#0a0a0a' : '#6b6b6b',
                    border: active ? '1px solid #f0f0f0' : '1px solid #2e2e2e',
                    fontWeight: active ? 500 : 400
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {state.status === 'loading' && (
            <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b' }}>
              Loading history…
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {DOMAIN_ORDER.map((d) => (
                <DomainSection key={d} domain={d} items={grouped[d] ?? []} />
              ))}
            </div>
          )}

          <RegistryMap />
        </>
      )}

      {activeTab === 'ideas' && <IdeasTab />}
    </div>
  );
}

function DomainSection({ domain, items }) {
  const color = DOMAIN_COLORS[domain];
  const count = items.length;
  const label = `${DOMAIN_LABELS[domain].toUpperCase()} — ${count} artefact${count !== 1 ? 's' : ''}`;

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0
          }}
        />
        <h2
          style={{
            fontFamily: 'IBM Plex Mono',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#9b9b9b',
            margin: 0
          }}
        >
          {label}
        </h2>
      </div>
      {items.length === 0 ? (
        <div
          style={{
            borderRadius: 4,
            border: '1px solid #1e1e1e',
            backgroundColor: 'rgba(17,17,17,0.4)',
            padding: '14px 16px',
            fontFamily: 'IBM Plex Mono',
            fontSize: 12,
            color: '#3b3b3b'
          }}
        >
          0 briefs · 0 concepts · 0 findings
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16
          }}
        >
          {items.map((it) => (
            <BriefCard key={`${it.domain}/${it.filename}`} item={it} />
          ))}
        </div>
      )}
    </section>
  );
}

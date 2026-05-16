import { useState } from 'react';
import { DOMAIN_COLORS, DOMAIN_LABELS } from './BriefCard.jsx';

const INDUSTRIES = ['finance', 'healthcare', 'energy'];

export default function IndustrySelector({ selected, onChange, counts = {} }) {
  const allSelected = INDUSTRIES.every((d) => selected.includes(d));

  function toggle(domain) {
    if (selected.includes(domain)) {
      onChange(selected.filter((d) => d !== domain));
    } else {
      onChange([...selected, domain]);
    }
  }

  function toggleAll() {
    onChange(allSelected ? [] : [...INDUSTRIES]);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        style={{
          fontFamily: 'IBM Plex Mono',
          fontSize: 11,
          color: '#6b6b6b',
          marginRight: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}
      >
        industries:
      </span>
      {INDUSTRIES.map((d) => (
        <DomainChip
          key={d}
          domain={d}
          active={selected.includes(d)}
          color={DOMAIN_COLORS[d]}
          label={DOMAIN_LABELS[d]}
          count={counts[d] ?? 0}
          onClick={() => toggle(d)}
        />
      ))}
      <AllChip allSelected={allSelected} onClick={toggleAll} />
    </div>
  );
}

function DomainChip({ domain: _domain, active, color, label, count, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const transform = pressed
    ? 'scale(0.96)'
    : !active && hovered
    ? 'translateY(-1px)'
    : 'none';

  const bgColor = active
    ? color
    : hovered
    ? `color-mix(in srgb, ${color} 12%, transparent)`
    : 'transparent';

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => { e.preventDefault(); setPressed(true); }}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      style={{
        padding: '6px 10px 6px 16px',
        borderRadius: 4,
        fontFamily: 'IBM Plex Mono',
        fontSize: 13,
        border: `1px solid ${color}`,
        backgroundColor: bgColor,
        color: active ? '#0a0a0a' : color,
        cursor: 'pointer',
        fontWeight: active ? 500 : 400,
        outline: 'none',
        transform,
        transition: 'all 150ms ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8
      }}
    >
      {label}
      <span
        style={{
          fontFamily: 'IBM Plex Mono',
          fontSize: 10,
          padding: '1px 5px',
          borderRadius: 3,
          backgroundColor: active ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.07)',
          color: active ? '#0a0a0a' : color,
          lineHeight: 1.5,
          minWidth: 16,
          textAlign: 'center'
        }}
      >
        {count}
      </span>
    </button>
  );
}

function AllChip({ allSelected, onClick }) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => { e.preventDefault(); setPressed(true); }}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        padding: '6px 16px',
        borderRadius: 4,
        fontFamily: 'IBM Plex Mono',
        fontSize: 13,
        cursor: 'pointer',
        backgroundColor: allSelected ? '#f0f0f0' : 'transparent',
        color: allSelected ? '#0a0a0a' : '#6b6b6b',
        border: allSelected ? '1px solid #f0f0f0' : '1px solid #2e2e2e',
        fontWeight: allSelected ? 500 : 400,
        outline: 'none',
        transform: pressed ? 'scale(0.97)' : 'none',
        transition: 'all 150ms ease'
      }}
    >
      All
    </button>
  );
}

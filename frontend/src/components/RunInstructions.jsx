import { useState } from 'react';

function getISOWeek(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function buildCommand(domain, focus) {
  const cleaned = (focus ?? '').replaceAll('"', '').trim();
  return cleaned ? `/research ${domain} "${cleaned}"` : `/research ${domain}`;
}

const monoMuted = {
  fontFamily: 'IBM Plex Mono',
  fontSize: 11,
  color: '#6b6b6b',
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

export default function RunInstructions({ selected, focus }) {
  if (!selected || selected.length === 0) {
    return (
      <div style={{ padding: '4px 0' }}>
        <span style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#4b4b4b' }}>
          Pick an industry above to see the Claude Code command to run.
        </span>
      </div>
    );
  }

  const week = getISOWeek(new Date());
  const weekLabel = `W${String(week).padStart(2, '0')}`;
  const command = buildCommand(selected[0], focus);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={monoMuted}>
        Claude Code Command — Week {weekLabel}
      </div>
      <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#9b9b9b', margin: 0 }}>
        Open a terminal in the{' '}
        <span style={{ fontFamily: 'IBM Plex Mono', color: '#f0f0f0' }}>research-scout</span>{' '}
        directory and run:
      </p>
      <CopyBlock label="terminal" text={'cd research-scout\nclaude'} />
      <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#9b9b9b', margin: 0 }}>
        Then run this slash command in Claude Code:
      </p>
      <CopyBlock label="slash command" text={command} />
    </div>
  );
}

function CopyBlock({ label, text }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div style={{ borderRadius: 4, border: '1px solid #1e1e1e', backgroundColor: '#111111', overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          backgroundColor: '#111111',
          borderBottom: '1px solid #1e1e1e'
        }}
      >
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#6b6b6b' }}>{label}</span>
        <button
          type="button"
          onClick={copy}
          style={{
            fontFamily: 'IBM Plex Mono',
            fontSize: 11,
            color: copied ? '#4ade80' : '#6b6b6b',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0
          }}
        >
          {copied ? 'copied' : 'click to copy'}
        </button>
      </div>
      <pre
        onClick={copy}
        style={{
          padding: '12px',
          fontSize: 13,
          color: '#f0f0f0',
          fontFamily: 'IBM Plex Mono',
          whiteSpace: 'pre-wrap',
          cursor: 'pointer',
          lineHeight: 1.6,
          margin: 0
        }}
      >
        {text}
      </pre>
    </div>
  );
}

import { useState } from 'react';
import { DOMAIN_LABELS } from './BriefCard.jsx';

function getISOWeek(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function buildPrompt(domains) {
  const list = domains.map((d) => DOMAIN_LABELS[d] ?? d).join(', ');
  return [
    `Run the orchestrator agent for the following industries: ${list}.`,
    '',
    'Workflow:',
    '1. Read .claude/agents/orchestrator.md for routing rules.',
    '2. Read prompts/STANDARDS.md before scoring any finding.',
    '3. Read outputs/registry.json to avoid duplicating existing ideas.',
    `4. Dispatch each domain agent (${domains.join(', ')}); collect their findings files.`,
    '5. Dispatch the synthesis agent over those findings.',
    '6. Apply the three-tier output system (full brief / concept note / discard).',
    '7. Append new entries to outputs/registry.json.',
    '8. Report the run summary: domain, findings paths, briefs produced, registry updates.'
  ].join('\n');
}

const monoMuted = {
  fontFamily: 'IBM Plex Mono',
  fontSize: 11,
  color: '#6b6b6b',
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

export default function RunInstructions({ selected }) {
  if (!selected || selected.length === 0) {
    return (
      <div style={{ padding: '4px 0' }}>
        <span style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#4b4b4b' }}>
          Pick one or more industries above to see the Claude Code commands to run.
        </span>
      </div>
    );
  }

  const week = getISOWeek(new Date());
  const weekLabel = `W${String(week).padStart(2, '0')}`;
  const prompt = buildPrompt(selected);

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
        Then paste this prompt into Claude Code:
      </p>
      <CopyBlock label="prompt" text={prompt} />
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

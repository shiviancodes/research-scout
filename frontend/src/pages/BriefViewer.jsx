import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  TYPE_LABELS
} from '../components/BriefCard.jsx';

export default function BriefViewer() {
  const { domain, filename } = useParams();
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    (async () => {
      try {
        const res = await fetch(
          `/api/outputs/${encodeURIComponent(domain)}/${encodeURIComponent(filename)}`
        );
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
  }, [domain, filename]);

  useEffect(() => {
    if (state.status === 'ok') {
      const m = state.data.content.match(/^#\s+(.+)$/m);
      const name = m ? m[1].trim() : filename.replace(/\.md$/i, '');
      document.title = `${name} — Research Scout`;
    } else {
      document.title = 'Research Scout';
    }
  }, [state.status, filename]);

  const color = DOMAIN_COLORS[domain] ?? '#52525b';

  const wordCount =
    state.status === 'ok'
      ? state.data.content.trim().split(/\s+/).filter(Boolean).length
      : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Thin domain color bar */}
      <div style={{ height: 3, backgroundColor: color, width: '100%', borderRadius: '2px 2px 0 0' }} />

      {/* Breadcrumb */}
      <div
        style={{
          border: '1px solid #1e1e1e',
          borderTop: 'none',
          backgroundColor: '#111111',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          flexWrap: 'wrap',
          marginBottom: 24,
          borderRadius: '0 0 4px 4px'
        }}
      >
        <Link
          to="/history"
          style={{
            fontFamily: 'IBM Plex Mono',
            fontSize: 12,
            color: '#6b6b6b',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f0f0f0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6b6b'; }}
        >
          ← History
        </Link>
        <Separator />
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color }}>{DOMAIN_LABELS[domain] ?? domain}</span>
        {state.status === 'ok' && (
          <>
            <Separator />
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#6b6b6b' }}>
              {TYPE_LABELS[state.data.metadata.type] ?? state.data.metadata.type}
            </span>
            {state.data.metadata.date && (
              <>
                <Separator />
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#6b6b6b' }}>
                  {state.data.metadata.date}
                </span>
              </>
            )}
          </>
        )}
        {state.status === 'ok' && (
          <span
            style={{
              fontFamily: 'IBM Plex Mono',
              fontSize: 11,
              color: '#6b6b6b',
              marginLeft: 'auto'
            }}
          >
            {wordCount.toLocaleString()} words · {readTime} min read
          </span>
        )}
      </div>

      {state.status === 'loading' && (
        <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b' }}>
          Loading brief…
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
        <article
          style={{
            backgroundColor: 'rgba(17,17,17,0.3)',
            border: '1px solid #1e1e1e',
            borderRadius: 4,
            padding: '40px 48px'
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {state.data.content}
          </ReactMarkdown>
        </article>
      )}
    </div>
  );
}

function Separator() {
  return (
    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#2e2e2e', margin: '0 8px' }}>
      /
    </span>
  );
}

const markdownComponents = {
  h1: (props) => (
    <h1
      style={{
        fontFamily: 'IBM Plex Sans',
        fontSize: 28,
        fontWeight: 400,
        color: '#f0f0f0',
        marginTop: 8,
        marginBottom: 24,
        paddingBottom: 12,
        borderBottom: '1px solid #1e1e1e',
        letterSpacing: '-0.01em'
      }}
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      style={{
        fontFamily: 'IBM Plex Sans',
        fontSize: 20,
        fontWeight: 500,
        color: '#f0f0f0',
        marginTop: 40,
        marginBottom: 12
      }}
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      style={{
        fontFamily: 'IBM Plex Sans',
        fontSize: 17,
        fontWeight: 500,
        color: '#e0e0e0',
        marginTop: 28,
        marginBottom: 8
      }}
      {...props}
    />
  ),
  h4: (props) => (
    <h4
      style={{
        fontFamily: 'IBM Plex Sans',
        fontSize: 15,
        fontWeight: 500,
        color: '#d0d0d0',
        marginTop: 20,
        marginBottom: 6
      }}
      {...props}
    />
  ),
  p: (props) => (
    <p
      style={{
        fontFamily: 'IBM Plex Sans',
        fontSize: 16,
        lineHeight: 1.7,
        color: '#c0c0c0',
        marginBottom: 16
      }}
      {...props}
    />
  ),
  ul: (props) => (
    <ul
      style={{
        listStyleType: 'disc',
        listStylePosition: 'outside',
        marginLeft: 20,
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      style={{
        listStyleType: 'decimal',
        listStylePosition: 'outside',
        marginLeft: 20,
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}
      {...props}
    />
  ),
  li: (props) => (
    <li
      style={{
        fontFamily: 'IBM Plex Sans',
        fontSize: 16,
        lineHeight: 1.7,
        color: '#c0c0c0'
      }}
      {...props}
    />
  ),
  a: (props) => (
    <a
      style={{ color: '#2dd4bf', textDecoration: 'underline', textDecorationColor: '#1e4a46' }}
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  strong: (props) => <strong style={{ color: '#f0f0f0' }} {...props} />,
  em: (props) => <em style={{ color: '#d0d0d0' }} {...props} />,
  blockquote: (props) => (
    <blockquote
      style={{
        borderLeft: '3px solid #2e2e2e',
        paddingLeft: 16,
        fontStyle: 'italic',
        color: '#6b6b6b',
        margin: '16px 0'
      }}
      {...props}
    />
  ),
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid #1e1e1e', margin: '32px 0' }} />,
  code: ({ inline, children, ...props }) =>
    inline ? (
      <code
        style={{
          padding: '2px 6px',
          borderRadius: 3,
          backgroundColor: '#1a1a1a',
          color: '#e0e0e0',
          fontFamily: 'IBM Plex Mono',
          fontSize: 13
        }}
        {...props}
      >
        {children}
      </code>
    ) : (
      <code
        style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: '#e0e0e0' }}
        {...props}
      >
        {children}
      </code>
    ),
  pre: (props) => (
    <pre
      style={{
        backgroundColor: '#111111',
        border: '1px solid #1e1e1e',
        borderRadius: 4,
        padding: 16,
        overflowX: 'auto',
        fontSize: 13,
        lineHeight: 1.6,
        marginBottom: 16,
        fontFamily: 'IBM Plex Mono'
      }}
      {...props}
    />
  ),
  table: (props) => (
    <div style={{ overflowX: 'auto', marginBottom: 16 }}>
      <table style={{ minWidth: '100%', borderCollapse: 'collapse', border: '1px solid #1e1e1e' }} {...props} />
    </div>
  ),
  thead: (props) => <thead style={{ backgroundColor: '#111111' }} {...props} />,
  th: (props) => (
    <th
      style={{
        textAlign: 'left',
        padding: '8px 12px',
        fontFamily: 'IBM Plex Mono',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#6b6b6b',
        borderBottom: '1px solid #1e1e1e',
        fontWeight: 500
      }}
      {...props}
    />
  ),
  tr: ({ children, ...props }) => (
    <tr
      className="even:bg-[#111111]"
      {...props}
    >
      {children}
    </tr>
  ),
  td: (props) => (
    <td
      style={{
        padding: '8px 12px',
        fontFamily: 'IBM Plex Sans',
        fontSize: 15,
        color: '#c0c0c0',
        borderBottom: '1px solid #1a1a1a'
      }}
      {...props}
    />
  )
};

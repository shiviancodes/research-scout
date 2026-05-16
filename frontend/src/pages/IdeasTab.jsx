import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DOMAIN_COLORS, DOMAIN_LABELS } from '../components/BriefCard.jsx';

const IDEA_DOMAINS = ['finance', 'healthcare', 'energy'];
const STATUS_CYCLE = ['backlog', 'in-progress', 'done'];

const STATUS_STYLE = {
  backlog: { backgroundColor: 'transparent', color: '#6b6b6b', border: '1px solid #2e2e2e' },
  'in-progress': { backgroundColor: '#b45309', color: '#fef3c7', border: 'none' },
  done: { backgroundColor: '#0d9488', color: '#ccfbf1', border: 'none' },
};

const STATUS_LABEL = { backlog: 'Backlog', 'in-progress': 'In Progress', done: 'Done' };

function defaultEntry() {
  return { status: 'backlog', todos: [], archived: false, archived_at: null };
}

function briefLink(path) {
  const parts = path.split('/');
  const domain = parts[1];
  const filename = parts[2];
  return `/brief/${encodeURIComponent(domain)}/${encodeURIComponent(filename)}`;
}

export default function IdeasTab() {
  const [ideas, setIdeas] = useState([]);
  const [workspace, setWorkspace] = useState({});
  const [loadStatus, setLoadStatus] = useState('loading');
  const [loadError, setLoadError] = useState(null);
  const [domainFilter, setDomainFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [regRes, wsRes] = await Promise.all([
          fetch('/api/registry'),
          fetch('/api/workspace'),
        ]);
        const [regBody, wsBody] = await Promise.all([regRes.json(), wsRes.json()]);
        if (cancelled) return;
        if (!regRes.ok) throw new Error(regBody.detail ?? `Registry HTTP ${regRes.status}`);
        if (!wsRes.ok) throw new Error(wsBody.detail ?? `Workspace HTTP ${wsRes.status}`);
        setIdeas(regBody.ideas ?? []);
        setWorkspace(wsBody.ideas ?? {});
        setLoadStatus('ok');
      } catch (err) {
        if (!cancelled) { setLoadError(err.message); setLoadStatus('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function showToast(msg) {
    setToast({ msg, key: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  const postWorkspace = useCallback(async (slug, patch) => {
    const prev = workspace;
    const prevEntry = workspace[slug] ?? defaultEntry();
    if (patch.remove_entry) {
      setWorkspace((w) => { const next = { ...w }; delete next[slug]; return next; });
    } else {
      setWorkspace((w) => ({ ...w, [slug]: { ...prevEntry, ...patch } }));
    }
    try {
      const res = await fetch(`/api/workspace/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `HTTP ${res.status}`);
      }
    } catch (err) {
      setWorkspace(prev);
      showToast(`Save failed: ${err.message}`);
    }
  }, [workspace]);

  const entry = (slug) => workspace[slug] ?? defaultEntry();

  const activeIdeas = ideas.filter((idea) => {
    const e = entry(idea.slug);
    if (e.archived) return false;
    if (domainFilter !== 'all' && idea.domain !== domainFilter) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    return true;
  });

  const archivedIdeas = ideas.filter((idea) => entry(idea.slug).archived);

  if (loadStatus === 'loading') {
    return (
      <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b' }}>
        Loading ideas…
      </div>
    );
  }

  if (loadStatus === 'error') {
    return (
      <div style={{ borderRadius: 4, border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#fca5a5', padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
        {loadError}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
      {toast && (
        <div
          key={toast.key}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 999,
            backgroundColor: '#1e1e1e',
            border: '1px solid rgba(239,68,68,0.4)',
            color: '#fca5a5',
            fontFamily: 'IBM Plex Mono',
            fontSize: 12,
            padding: '10px 16px',
            borderRadius: 4,
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {['all', ...IDEA_DOMAINS].map((d) => {
            const active = d === domainFilter;
            const color = d === 'all' ? '#6b6b6b' : DOMAIN_COLORS[d];
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDomainFilter(d)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 3,
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 11,
                  cursor: 'pointer',
                  backgroundColor: active ? (d === 'all' ? '#f0f0f0' : color) : 'transparent',
                  color: active ? (d === 'all' ? '#0a0a0a' : '#0a0a0a') : (d === 'all' ? '#6b6b6b' : color),
                  border: d === 'all'
                    ? (active ? '1px solid #f0f0f0' : '1px solid #2e2e2e')
                    : `1px solid ${color}`,
                  fontWeight: active ? 500 : 400,
                }}
              >
                {d === 'all' ? 'All' : DOMAIN_LABELS[d]}
              </button>
            );
          })}
        </div>

        <div style={{ width: 1, height: 16, backgroundColor: '#2e2e2e' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {['all', ...STATUS_CYCLE].map((s) => {
            const active = s === statusFilter;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 3,
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 11,
                  cursor: 'pointer',
                  backgroundColor: active ? '#f0f0f0' : 'transparent',
                  color: active ? '#0a0a0a' : '#6b6b6b',
                  border: active ? '1px solid #f0f0f0' : '1px solid #2e2e2e',
                  fontWeight: active ? 500 : 400,
                }}
              >
                {s === 'all' ? 'All' : STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active idea cards */}
      {activeIdeas.length === 0 ? (
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#3b3b3b', padding: '14px 0' }}>
          No ideas match the current filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeIdeas.map((idea) => (
            <IdeaCard
              key={idea.slug}
              idea={idea}
              entry={entry(idea.slug)}
              postWorkspace={postWorkspace}
            />
          ))}
        </div>
      )}

      {/* Recently Archived */}
      {archivedIdeas.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            onClick={() => setArchivedOpen((o) => !o)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'IBM Plex Mono',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#4b4b4b',
            }}
          >
            <span style={{ display: 'inline-block', transition: 'transform 150ms', transform: archivedOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
            RECENTLY ARCHIVED — {archivedIdeas.length} idea{archivedIdeas.length !== 1 ? 's' : ''}
          </button>

          {archivedOpen && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {archivedIdeas.map((idea) => (
                <ArchivedRow
                  key={idea.slug}
                  idea={idea}
                  entry={entry(idea.slug)}
                  postWorkspace={postWorkspace}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea, entry, postWorkspace }) {
  const [checkedTodos, setCheckedTodos] = useState(new Set());
  const [addingTodo, setAddingTodo] = useState(false);
  const [todoInput, setTodoInput] = useState('');
  const inputRef = useRef(null);
  const color = DOMAIN_COLORS[idea.domain] ?? '#52525b';
  const status = entry.status ?? 'backlog';
  const todos = entry.todos ?? [];

  useEffect(() => {
    if (addingTodo && inputRef.current) inputRef.current.focus();
  }, [addingTodo]);

  function cycleStatus() {
    const idx = STATUS_CYCLE.indexOf(status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    postWorkspace(idea.slug, { status: next });
  }

  function toggleCheck(i) {
    setCheckedTodos((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function deleteTodo(i) {
    const updated = todos.filter((_, idx) => idx !== i);
    postWorkspace(idea.slug, { todos: updated });
    setCheckedTodos((prev) => {
      const next = new Set();
      for (const c of prev) { if (c < i) next.add(c); else if (c > i) next.add(c - 1); }
      return next;
    });
  }

  function commitTodo() {
    const text = todoInput.trim();
    if (!text || todos.length >= 10) { setAddingTodo(false); setTodoInput(''); return; }
    postWorkspace(idea.slug, { todos: [...todos, text] });
    setAddingTodo(false);
    setTodoInput('');
  }

  function archive() {
    postWorkspace(idea.slug, {
      archived: true,
      archived_at: new Date().toISOString().slice(0, 10),
    });
  }

  const summaryText = (idea.summary ?? '').slice(0, 120);

  return (
    <div
      style={{
        backgroundColor: '#111111',
        border: '1px solid #1e1e1e',
        borderRadius: 4,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, padding: '2px 7px', borderRadius: 3, border: `1px solid ${color}`, color }}>
          {DOMAIN_LABELS[idea.domain] ?? idea.domain}
        </span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, padding: '2px 7px', borderRadius: 3, backgroundColor: '#1e1e1e', color: '#9b9b9b' }}>
          {idea.tier}
        </span>
        <button
          type="button"
          onClick={cycleStatus}
          style={{
            marginLeft: 'auto',
            fontFamily: 'IBM Plex Mono',
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 3,
            cursor: 'pointer',
            ...STATUS_STYLE[status],
          }}
        >
          {STATUS_LABEL[status]}
        </button>
      </div>

      {/* Title */}
      <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 14, fontWeight: 500, color: '#f0f0f0', lineHeight: 1.4 }}>
        {idea.title}
      </div>

      {/* Summary */}
      {summaryText && (
        <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 12, color: '#6b6b6b', lineHeight: 1.5 }}>
          {summaryText}{idea.summary?.length > 120 ? '…' : ''}
        </div>
      )}

      {/* Todo section */}
      <div style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: '#1e1e1e' }} />
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#3b3b3b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            to-do
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#1e1e1e' }} />
        </div>

        {todos.map((todo, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
            <button
              type="button"
              onClick={() => toggleCheck(i)}
              style={{
                background: 'none',
                border: '1px solid #3b3b3b',
                borderRadius: 2,
                width: 14,
                height: 14,
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b6b6b',
                fontSize: 9,
              }}
            >
              {checkedTodos.has(i) ? '✓' : ''}
            </button>
            <span
              style={{
                fontFamily: 'IBM Plex Sans',
                fontSize: 13,
                color: checkedTodos.has(i) ? '#3b3b3b' : '#c0c0c0',
                textDecoration: checkedTodos.has(i) ? 'line-through' : 'none',
                flex: 1,
              }}
            >
              {todo}
            </span>
            <button
              type="button"
              onClick={() => deleteTodo(i)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#3b3b3b',
                fontFamily: 'IBM Plex Mono',
                fontSize: 11,
                padding: '0 2px',
              }}
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}

        {todos.length < 10 && (
          addingTodo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
              <div style={{ width: 14, height: 14, flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTodo();
                  if (e.key === 'Escape') { setAddingTodo(false); setTodoInput(''); }
                }}
                onBlur={commitTodo}
                placeholder="Add todo…"
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid #3b3b3b',
                  color: '#f0f0f0',
                  fontFamily: 'IBM Plex Sans',
                  fontSize: 13,
                  outline: 'none',
                  padding: '2px 0',
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingTodo(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#3b3b3b',
                fontFamily: 'IBM Plex Sans',
                fontSize: 12,
                padding: '4px 0',
                display: 'block',
              }}
            >
              + Add todo…
            </button>
          )
        )}
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
        <Link
          to={briefLink(idea.path)}
          style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#9b9b9b', textDecoration: 'none' }}
        >
          open {idea.tier} →
        </Link>
        <button
          type="button"
          onClick={archive}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'IBM Plex Mono',
            fontSize: 11,
            color: '#4b4b4b',
            padding: 0,
          }}
        >
          Archive
        </button>
        <button
          type="button"
          onClick={cycleStatus}
          style={{
            background: 'none',
            border: '1px solid #2e2e2e',
            borderRadius: 3,
            cursor: 'pointer',
            fontFamily: 'IBM Plex Mono',
            fontSize: 11,
            color: '#6b6b6b',
            padding: '2px 8px',
          }}
        >
          Status ▾
        </button>
      </div>
    </div>
  );
}

function ArchivedRow({ idea, entry, postWorkspace }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const color = DOMAIN_COLORS[idea.domain] ?? '#52525b';

  function restore() {
    postWorkspace(idea.slug, { archived: false, archived_at: null });
  }

  function confirmAndDelete() {
    postWorkspace(idea.slug, { remove_entry: true });
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 0',
        borderBottom: '1px solid #1a1a1a',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#4b4b4b', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {idea.title}
      </span>
      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, padding: '1px 5px', borderRadius: 3, border: `1px solid ${color}`, color, flexShrink: 0 }}>
        {DOMAIN_LABELS[idea.domain] ?? idea.domain}
      </span>
      {entry.archived_at && (
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#3b3b3b', flexShrink: 0 }}>
          {entry.archived_at}
        </span>
      )}
      <button
        type="button"
        onClick={restore}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#6b6b6b', padding: 0, flexShrink: 0 }}
      >
        Restore
      </button>
      {confirmDelete ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#6b6b6b' }}>
            Are you sure? This cannot be undone.
          </span>
          <button
            type="button"
            onClick={confirmAndDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#fca5a5', padding: 0 }}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#3b3b3b', padding: 0 }}
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#3b3b3b', padding: 0, flexShrink: 0 }}
        >
          Delete
        </button>
      )}
    </div>
  );
}

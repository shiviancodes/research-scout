# Pipeline v3 + UX Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix agent armed-source behaviour, update the run prompt, restructure navigation (Research tab, Config page, Sources on Home), add per-agent file editor with restore-to-default, and audit dead code from the old brief/concept pipeline.

**Architecture:** Three independent layers — (1) agent `.md` files restructured for upload-first research, (2) backend gains agent file read/write/restore endpoints, (3) frontend gains new pages (Research, Config), moves Sources to Home sidebar, and strips dead brief/concept UI. All changes stay on `feature/inputs-pipeline`.

**Tech Stack:** FastAPI (Python), React + Vite, inline styles (no Tailwind in components), IBM Plex Mono/Sans typography, existing component patterns from `RegisterModal.jsx` and `Standards.jsx`.

---

## Context

The current pipeline is findings-only. Domain agents produce raw findings files; humans register interesting ones as "research" items. The previous plan removed brief/concept generation but the UI still references it. Armed sources are currently treated as equal alongside web research — they should be the primary material with web as a targeted supplement. The run prompt shown to users still describes the old three-tier pipeline.

---

## File Map

| Action | File |
|--------|------|
| Create | `defaults/agents/finance.md` |
| Create | `defaults/agents/healthcare.md` |
| Create | `defaults/agents/energy.md` |
| Create | `defaults/agents/synthesis.md` |
| Create | `defaults/agents/orchestrator.md` |
| Modify | `backend/main.py` — add agent file endpoints |
| Modify | `.claude/agents/finance.md` — restructure pre-flight |
| Modify | `.claude/agents/healthcare.md` — restructure pre-flight |
| Modify | `.claude/agents/energy.md` — restructure pre-flight |
| Modify | `frontend/src/components/RunInstructions.jsx` — fix buildPrompt |
| Create | `frontend/src/components/SourcesPanel.jsx` |
| Create | `frontend/src/pages/Research.jsx` |
| Create | `frontend/src/pages/Config.jsx` |
| Modify | `frontend/src/pages/Home.jsx` — two-column layout, dead code removal |
| Modify | `frontend/src/pages/History.jsx` — remove tabs, fix type filters |
| Delete | `frontend/src/pages/Standards.jsx` (functionality moves to Config) |
| Modify | `frontend/src/components/Navbar.jsx` — new nav items |
| Modify | `frontend/src/App.jsx` — new routes |

---

## Task 1: Agent defaults directory + backend endpoints

**Files:**
- Create: `defaults/agents/` (copy current agent files)
- Modify: `backend/main.py`

### Why

Users need a safe "restore to factory settings" for any agent file they've edited via the Config UI. The defaults directory ships with the repo and is never overwritten by agents or users. The backend exposes read/write/restore for the five named agent files.

- [ ] **Step 1: Create defaults directory and copy current agent files**

```powershell
New-Item -ItemType Directory -Force "defaults\agents" | Out-Null
Copy-Item ".claude\agents\finance.md" "defaults\agents\finance.md"
Copy-Item ".claude\agents\healthcare.md" "defaults\agents\healthcare.md"
Copy-Item ".claude\agents\energy.md" "defaults\agents\energy.md"
Copy-Item ".claude\agents\synthesis.md" "defaults\agents\synthesis.md"
Copy-Item ".claude\agents\orchestrator.md" "defaults\agents\orchestrator.md"
```

Expected: five `.md` files appear in `defaults/agents/`.

- [ ] **Step 2: Read `backend/main.py` lines 1–30 to locate constants block**

Confirm `PROJECT_ROOT`, `INPUTS_DIR`, `UPLOAD_DOMAINS` are defined there. Note the line where constants end so new ones can be appended.

- [ ] **Step 3: Add agent constants to `backend/main.py`**

After the `UPLOAD_DOMAINS` / `DOMAINS` lines, add:

```python
AGENTS_DIR = PROJECT_ROOT / ".claude" / "agents"
DEFAULTS_DIR = PROJECT_ROOT / "defaults" / "agents"
AGENT_NAMES = ("finance", "healthcare", "energy", "synthesis", "orchestrator")
```

- [ ] **Step 4: Add `AgentContentPayload` model**

After the `LinksPayload` model, add:

```python
class AgentContentPayload(BaseModel):
    content: str
```

- [ ] **Step 5: Add the three agent endpoints to `backend/main.py`**

Add these after the `add_links` endpoint:

```python
@app.get("/api/agents/{name}")
def get_agent(name: str):
    if name not in AGENT_NAMES:
        raise HTTPException(status_code=404, detail=f"Unknown agent '{name}'.")
    path = AGENTS_DIR / f"{name}.md"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Agent file '{name}.md' not found.")
    return {"name": name, "content": path.read_text(encoding="utf-8")}


@app.post("/api/agents/{name}")
def save_agent(name: str, payload: AgentContentPayload):
    if name not in AGENT_NAMES:
        raise HTTPException(status_code=400, detail=f"Unknown agent '{name}'.")
    path = AGENTS_DIR / f"{name}.md"
    path.write_text(payload.content, encoding="utf-8")
    return {"name": name, "path": str(path.relative_to(PROJECT_ROOT))}


@app.post("/api/agents/{name}/restore")
def restore_agent(name: str):
    if name not in AGENT_NAMES:
        raise HTTPException(status_code=400, detail=f"Unknown agent '{name}'.")
    default_path = DEFAULTS_DIR / f"{name}.md"
    if not default_path.exists():
        raise HTTPException(status_code=404, detail=f"No default found for '{name}'.")
    content = default_path.read_text(encoding="utf-8")
    (AGENTS_DIR / f"{name}.md").write_text(content, encoding="utf-8")
    return {"name": name, "content": content}
```

- [ ] **Step 6: Verify syntax**

```powershell
backend\venv\Scripts\python -m py_compile backend/main.py
```

Expected: no output.

- [ ] **Step 7: Commit**

```
git add defaults/agents/ backend/main.py
git commit -m "feat: add agent defaults directory and editor endpoints"
```

---

## Task 2: Restructure armed-source pre-flight in domain agents

**Files:**
- Modify: `.claude/agents/finance.md`
- Modify: `.claude/agents/healthcare.md`
- Modify: `.claude/agents/energy.md`

### Why

The current instruction treats uploaded files as supplementary alongside web research. The new instruction makes uploaded content the primary research material when armed. Web research is a targeted supplement: only to corroborate claims, find missing primary sources, or follow threads the uploaded material opened.

- [ ] **Step 1: Read all three agent files**

Read `.claude/agents/finance.md`, `.claude/agents/healthcare.md`, `.claude/agents/energy.md` in full.

- [ ] **Step 2: Replace the `## Inputs pre-flight` section in `finance.md`**

Replace the entire `## Inputs pre-flight` section (from the heading through the final numbered item) with:

```markdown
## Inputs pre-flight

Before doing any web research, check whether the user has activated local inputs for this domain:

1. Read `inputs/settings.json`.
2. If `finance` is `false` (or the file is missing), proceed directly to `## Sources` and run a full web research pass.
3. If `finance` is `true`, this is an **upload-first run**. Uploaded content is your primary research material. Follow steps 3a–3h before doing any web research.

   a. List all files in `inputs/finance/` (excluding `.gitkeep`).
   b. For each file named `links.md`: read the file, extract one URL per non-empty line, and use WebFetch to retrieve each URL. Treat each fetched page as a primary source document for this run.
   c. For all other non-PDF files: read their content directly and treat as a primary source document.
   d. For `.pdf` files: use the Read tool with the `pages` parameter. Read pages 1–10 first, then 11–20, and so on. Stop when the tool returns an empty result or fewer than 5 lines, or after reaching page 100, whichever comes first. Treat all chunks concatenated as a single source entry.
   e. **Immediately** update `inputs/settings.json` by setting `finance` to `false`.
   f. Mine every uploaded document for problem signals. For each candidate finding extracted from the uploaded material:
      - Name the specific person, role, or organisation experiencing the problem.
      - Identify the primary source. If the uploaded file is itself a primary document (regulatory filing, company report, original research paper, earnings transcript), it counts as the primary source — cite it with `(user-provided)` appended. If it is a secondary summary, fetch the underlying primary source via WebFetch before writing the finding.
      - Apply the non-negotiables from `prompts/STANDARDS.md`. Discard any finding that fails.
   g. Exhaust the uploaded material completely before moving to the web.
   h. After extracting all findings from uploaded content, do a **targeted supplementary web pass**. This pass has three purposes only:
      - Fetch primary sources for any uploaded-material finding that still lacks one.
      - Find corroborating data or named entities that strengthen a finding from the uploads.
      - Follow specific threads the uploaded material opened but did not close (e.g., a regulation cited but not fetched, a company named but not investigated).
      Do **not** introduce findings on topics unrelated to the uploaded material during this supplementary pass.

4. Cite each user-uploaded file or fetched URL as a **Source** entry in the findings file. Append `(user-provided)` to any citation that originates from an uploaded file or a link extracted from an uploaded `links.md`.
```

- [ ] **Step 3: Apply the identical pre-flight replacement to `healthcare.md`**

Same section structure as Step 2. Replace `finance` with `healthcare` in every occurrence:
- `inputs/settings.json` → `healthcare` key
- `inputs/finance/` → `inputs/healthcare/`
- "setting `finance` to `false`" → "setting `healthcare` to `false`"
- "The healthcare agent will read…" context in prose

- [ ] **Step 4: Apply the identical pre-flight replacement to `energy.md`**

Same as Step 3, replacing `finance` with `energy` throughout.

- [ ] **Step 5: Verify the three files each contain the updated section**

Read back the `## Inputs pre-flight` section of each file and confirm:
- Step 3h is present with "targeted supplementary web pass"
- Step 3e still says "immediately update `inputs/settings.json`"
- The domain name (`finance` / `healthcare` / `energy`) is correct in each file

- [ ] **Step 6: Commit**

```
git add .claude/agents/finance.md .claude/agents/healthcare.md .claude/agents/energy.md
git commit -m "refactor: upload-first armed-source behaviour in domain agents"
```

---

## Task 3: Fix RunInstructions buildPrompt

**Files:**
- Modify: `frontend/src/components/RunInstructions.jsx`

### Why

The current prompt references the old three-tier pipeline (registry, briefs, scoring). Anyone copying it and running it gets agents trying to do things the new pipeline doesn't support.

- [ ] **Step 1: Read `frontend/src/components/RunInstructions.jsx`**

Locate the `buildPrompt(domains)` function (currently lines 12–27).

- [ ] **Step 2: Replace `buildPrompt` with the corrected version**

```js
function buildPrompt(domains) {
  const names = domains.map((d) => DOMAIN_LABELS[d] ?? d);
  const argStr = domains.length === 3 ? 'all' : domains.join(', ');
  return [
    `Run a research run for: ${names.join(', ')}.`,
    '',
    '1. Read .claude/agents/orchestrator.md.',
    `2. Dispatch the domain agent(s): ${argStr}.`,
    '   Each agent reads prompts/STANDARDS.md before writing any finding.',
    '   Non-negotiables are hard filters — discard any finding that fails.',
    '   Each agent writes: outputs/{domain}/{YYYY-WNN}-findings.md',
    '   Minimum 8 findings per domain.',
    '3. After all domain agents complete, dispatch the synthesis agent.',
    '   Synthesis writes: outputs/summary/{YYYY-WNN}-summary.md',
    '4. Report: domains run · findings file paths · finding count per domain · summary path.',
  ].join('\n');
}
```

- [ ] **Step 3: Commit**

```
git add frontend/src/components/RunInstructions.jsx
git commit -m "fix: update run prompt to match findings-only pipeline"
```

---

## Task 4: Create SourcesPanel component

**Files:**
- Create: `frontend/src/components/SourcesPanel.jsx`
- Modify: `frontend/src/pages/History.jsx` (remove SourcesTab and LinksModal references)

### Why

Sources is a pre-run action, not a post-run archive item. It belongs on the Home page as a persistent panel. Extracting it into a standalone component makes it importable by Home without coupling to History.

- [ ] **Step 1: Read `frontend/src/pages/History.jsx`**

Locate the `SourcesTab` function (starts around line 290). Note all imports it needs: `useState`, `useRef`, `useEffect`, `DOMAIN_COLORS`, `DOMAIN_LABELS`, `LinksModal`, the fetch helpers (`load`, `toggleDomain`, `handleUpload`, `handleDelete`).

- [ ] **Step 2: Create `frontend/src/components/SourcesPanel.jsx`**

This is the SourcesTab function extracted verbatim, exported as a default, with its own imports. Copy the full SourcesTab body into this file:

```jsx
import { useEffect, useRef, useState } from 'react';
import { DOMAIN_COLORS, DOMAIN_LABELS } from './BriefCard.jsx';
import LinksModal from './LinksModal.jsx';

const UPLOAD_DOMAINS = ['energy', 'finance', 'healthcare'];

export default function SourcesPanel() {
  const [sources, setSources] = useState({ status: 'loading', items: [] });
  const [settings, setSettings] = useState({ energy: false, finance: false, healthcare: false });
  const [uploadState, setUploadState] = useState({});
  const [linksModal, setLinksModal] = useState(null);
  const fileRefs = useRef({});

  function load() {
    setSources({ status: 'loading', items: [] });
    Promise.all([
      fetch('/api/inputs').then((r) => r.json()),
      fetch('/api/inputs/settings').then((r) => r.json()),
    ])
      .then(([inputsBody, settingsBody]) => {
        setSources({ status: 'ok', items: Array.isArray(inputsBody) ? inputsBody : [] });
        setSettings(settingsBody);
      })
      .catch((err) => setSources({ status: 'error', items: [], error: err.message }));
  }

  useEffect(() => { load(); }, []);

  async function toggleDomain(domain) {
    const next = !settings[domain];
    try {
      const res = await fetch('/api/inputs/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, active: next }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? `HTTP ${res.status}`);
      setSettings(body);
    } catch {
      // state unchanged on error
    }
  }

  async function handleUpload(domain, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState((s) => ({ ...s, [domain]: { uploading: true, error: null } }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/inputs/${domain}`, { method: 'POST', body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? `HTTP ${res.status}`);
      load();
      setUploadState((s) => ({ ...s, [domain]: { uploading: false, error: null } }));
    } catch (err) {
      setUploadState((s) => ({ ...s, [domain]: { uploading: false, error: err.message } }));
    } finally {
      e.target.value = '';
    }
  }

  async function handleDelete(domain, filename) {
    try {
      const res = await fetch(`/api/inputs/${domain}/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.detail ?? `HTTP ${res.status}`);
      }
      load();
    } catch {
      // silently ignore
    }
  }

  const grouped = UPLOAD_DOMAINS.reduce((acc, d) => {
    acc[d] = sources.items.filter((s) => s.domain === d);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {linksModal && (
        <LinksModal
          domain={linksModal}
          onClose={() => setLinksModal(null)}
          onSaved={load}
        />
      )}

      {sources.status === 'loading' && (
        <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b' }}>Loading sources…</div>
      )}

      {sources.status === 'ok' && UPLOAD_DOMAINS.map((d) => {
        const color = DOMAIN_COLORS[d];
        const items = grouped[d];
        const armed = settings[d];
        const us = uploadState[d] ?? { uploading: false, error: null };

        return (
          <section
            key={d}
            style={{
              borderRadius: 5,
              border: `1px solid ${armed ? 'rgba(45,212,191,0.25)' : '#1e1e1e'}`,
              borderLeft: `3px solid ${armed ? '#2dd4bf' : '#1e1e1e'}`,
              backgroundColor: armed ? 'rgba(45,212,191,0.03)' : 'transparent',
              padding: '14px 16px',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: armed ? 6 : 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9b9b9b' }}>
                  {DOMAIN_LABELS[d]} — {items.length} file{items.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => fileRefs.current[d]?.click()}
                  disabled={us.uploading}
                  style={{ padding: '2px 8px', borderRadius: 3, cursor: us.uploading ? 'not-allowed' : 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 10, backgroundColor: 'transparent', color: us.uploading ? '#3b3b3b' : '#6b6b6b', border: '1px solid #2e2e2e' }}
                >
                  {us.uploading ? 'Uploading…' : '+ PDF'}
                </button>
                <input ref={(el) => { fileRefs.current[d] = el; }} type="file" accept=".pdf,.md,.txt" style={{ display: 'none' }} onChange={(e) => handleUpload(d, e)} />
                <button
                  type="button"
                  onClick={() => setLinksModal(d)}
                  style={{ padding: '2px 8px', borderRadius: 3, cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 10, backgroundColor: 'transparent', color: '#6b6b6b', border: '1px solid #2e2e2e' }}
                >
                  + Links
                </button>
                <button
                  type="button"
                  onClick={() => toggleDomain(d)}
                  style={{ padding: '2px 10px', borderRadius: 3, cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: armed ? 600 : 400, backgroundColor: armed ? 'rgba(45,212,191,0.15)' : 'transparent', color: armed ? '#2dd4bf' : '#4b4b4b', border: `1px solid ${armed ? '#2dd4bf' : '#2e2e2e'}`, transition: 'all 0.15s' }}
                >
                  {armed ? 'Armed ✓' : 'Arm'}
                </button>
              </div>
            </div>

            {armed && (
              <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 11, color: '#2dd4bf', opacity: 0.7, marginBottom: 10, paddingLeft: 14 }}>
                These files will be the primary research material on the next run.
              </div>
            )}

            {us.error && (
              <div style={{ borderRadius: 3, border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontFamily: 'IBM Plex Mono', fontSize: 11, padding: '5px 8px', marginBottom: 8 }}>
                {us.error}
              </div>
            )}

            {items.length === 0 ? (
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#3b3b3b', padding: '8px 12px', border: '1px solid #1e1e1e', borderRadius: 4 }}>
                No files uploaded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map((src) => (
                  <div key={src.path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', backgroundColor: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 4 }}>
                    <a
                      href={`/api/inputs/${src.domain}/${encodeURIComponent(src.filename)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: 'IBM Plex Sans', fontSize: 12, color: '#c0c0c0', flex: 1, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#f0f0f0'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#c0c0c0'; }}
                    >
                      {src.filename}
                    </a>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#4b4b4b', flexShrink: 0 }}>
                      {(src.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(src.domain, src.filename)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b3b3b', fontFamily: 'IBM Plex Mono', fontSize: 14, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#fca5a5'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#3b3b3b'; }}
                      title="Remove file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Remove SourcesTab from `History.jsx`**

In `History.jsx`:
- Remove `import LinksModal from '../components/LinksModal.jsx';` (LinksModal is now imported inside SourcesPanel)
- Delete the entire `function SourcesTab()` definition (from its `function` keyword through its closing `}`)
- Remove `{activeTab === 'sources' && <SourcesTab />}` from the render
- Remove `'sources'` from the tab array in the tab bar map: `['artefacts', 'ideas', 'sources']` → `['artefacts', 'ideas']`

- [ ] **Step 4: Commit**

```
git add frontend/src/components/SourcesPanel.jsx frontend/src/pages/History.jsx
git commit -m "feat: extract SourcesPanel component from History"
```

---

## Task 5: Create Config page

**Files:**
- Create: `frontend/src/pages/Config.jsx`
- Delete: `frontend/src/pages/Standards.jsx` (functionality subsumed)

### Why

The Standards page only edits one file. Config consolidates: Standards quality bar + all five agent files in one tabbed editor, each with Save and Restore to default. A senior designer puts all "system configuration" in one place.

- [ ] **Step 1: Create `frontend/src/pages/Config.jsx`**

```jsx
import { useEffect, useState } from 'react';

const TABS = [
  { key: 'standards', label: 'Standards', getUrl: '/api/standards', postUrl: '/api/standards', restoreUrl: null },
  { key: 'finance', label: 'Finance Agent', getUrl: '/api/agents/finance', postUrl: '/api/agents/finance', restoreUrl: '/api/agents/finance/restore' },
  { key: 'healthcare', label: 'Healthcare Agent', getUrl: '/api/agents/healthcare', postUrl: '/api/agents/healthcare', restoreUrl: '/api/agents/healthcare/restore' },
  { key: 'energy', label: 'Energy Agent', getUrl: '/api/agents/energy', postUrl: '/api/agents/energy', restoreUrl: '/api/agents/energy/restore' },
  { key: 'synthesis', label: 'Synthesis Agent', getUrl: '/api/agents/synthesis', postUrl: '/api/agents/synthesis', restoreUrl: '/api/agents/synthesis/restore' },
  { key: 'orchestrator', label: 'Orchestrator Agent', getUrl: '/api/agents/orchestrator', postUrl: '/api/agents/orchestrator', restoreUrl: '/api/agents/orchestrator/restore' },
];

const TAB_STYLE_BASE = {
  fontFamily: 'IBM Plex Mono', fontSize: 11, textTransform: 'uppercase',
  letterSpacing: '0.12em', cursor: 'pointer', background: 'none', border: 'none',
  borderBottom: '2px solid transparent', paddingBottom: 6, paddingLeft: 0, paddingRight: 0, marginRight: 20,
};

const LINE_COUNT = 120;
const LINE_NUMBERS = Array.from({ length: LINE_COUNT }, (_, i) => i + 1);

export default function Config() {
  const [activeTab, setActiveTab] = useState('standards');
  const [editorState, setEditorState] = useState({});
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { document.title = 'Config — Research Scout'; }, []);

  const tab = TABS.find((t) => t.key === activeTab);

  useEffect(() => {
    if (editorState[activeTab]) return;
    fetch(tab.getUrl)
      .then((r) => r.json())
      .then((body) => {
        setEditorState((s) => ({ ...s, [activeTab]: { status: 'ok', draft: body.content } }));
      })
      .catch((err) => {
        setEditorState((s) => ({ ...s, [activeTab]: { status: 'error', error: err.message } }));
      });
  }, [activeTab, tab]);

  function showToast(kind, text) {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSave() {
    const current = editorState[activeTab];
    if (!current || current.status !== 'ok') return;
    setSaving(true);
    try {
      const res = await fetch(tab.postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: current.draft }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? `HTTP ${res.status}`);
      showToast('success', `Saved`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore() {
    if (!tab.restoreUrl) return;
    setRestoring(true);
    try {
      const res = await fetch(tab.restoreUrl, { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? `HTTP ${res.status}`);
      setEditorState((s) => ({ ...s, [activeTab]: { status: 'ok', draft: body.content } }));
      showToast('success', 'Restored to default');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setRestoring(false);
    }
  }

  const current = editorState[activeTab];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header>
        <h1 style={{ fontFamily: 'IBM Plex Sans', fontSize: 32, fontWeight: 300, color: '#f0f0f0', margin: 0, letterSpacing: '-0.02em' }}>
          Configuration
        </h1>
        <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b', marginTop: 8, marginBottom: 0 }}>
          Edit agent instructions and the quality bar. Changes take effect on the next run.
        </p>
      </header>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e1e1e', flexWrap: 'wrap', gap: 0 }}>
        {TABS.map((t) => {
          const active = t.key === activeTab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              style={{ ...TAB_STYLE_BASE, color: active ? '#f0f0f0' : '#6b6b6b', borderBottom: active ? '2px solid #f0f0f0' : '2px solid transparent', marginRight: 20 }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Warning banner */}
      <div style={{ borderRadius: 4, border: '1px solid rgba(251,191,36,0.2)', backgroundColor: 'rgba(251,191,36,0.05)', color: '#fcd34d', fontSize: 13, fontFamily: 'IBM Plex Sans', padding: '10px 14px' }}>
        {activeTab === 'standards'
          ? 'STANDARDS.md is read by all agents before every research run.'
          : `${tab.label} is dispatched by the orchestrator during a research run.`}
        {' '}Changes take effect on the next run.
      </div>

      {/* Editor */}
      {!current && (
        <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b' }}>Loading…</div>
      )}
      {current?.status === 'error' && (
        <div style={{ borderRadius: 4, border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#fca5a5', padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
          {current.error}
        </div>
      )}
      {current?.status === 'ok' && (
        <>
          <div style={{ position: 'relative', display: 'flex', height: 560, border: '1px solid #1e1e1e', borderRadius: 4, overflow: 'hidden', backgroundColor: '#111111' }}>
            <div aria-hidden="true" style={{ width: '2.8rem', flexShrink: 0, backgroundColor: '#0d0d0d', borderRight: '1px solid #1e1e1e', padding: '16px 0', userSelect: 'none', pointerEvents: 'none', overflowY: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              {LINE_NUMBERS.map((n) => (
                <div key={n} style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#2e2e2e', lineHeight: '1.6', paddingRight: 8, height: '20.8px' }}>{n}</div>
              ))}
            </div>
            <textarea
              value={current.draft}
              onChange={(e) => setEditorState((s) => ({ ...s, [activeTab]: { ...s[activeTab], draft: e.target.value } }))}
              spellCheck={false}
              style={{ flex: 1, height: '100%', backgroundColor: '#111111', border: 'none', outline: 'none', padding: '16px', fontFamily: 'IBM Plex Mono', fontSize: 13, color: '#f0f0f0', lineHeight: 1.6, resize: 'none', overflowY: 'auto' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button" onClick={handleSave} disabled={saving || restoring}
              style={{ padding: '7px 18px', borderRadius: 3, fontFamily: 'IBM Plex Mono', fontSize: 13, backgroundColor: '#f0f0f0', color: '#0a0a0a', border: 'none', cursor: (saving || restoring) ? 'not-allowed' : 'pointer', opacity: (saving || restoring) ? 0.5 : 1, fontWeight: 500 }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {tab.restoreUrl && (
              <button
                type="button" onClick={handleRestore} disabled={saving || restoring}
                style={{ padding: '7px 18px', borderRadius: 3, fontFamily: 'IBM Plex Mono', fontSize: 13, backgroundColor: 'transparent', color: '#6b6b6b', border: '1px solid #2e2e2e', cursor: (saving || restoring) ? 'not-allowed' : 'pointer', opacity: (saving || restoring) ? 0.5 : 1 }}
              >
                {restoring ? 'Restoring…' : 'Restore to default'}
              </button>
            )}
            {toast && (
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: toast.kind === 'success' ? '#4ade80' : '#f87171' }}>
                {toast.text}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Delete `frontend/src/pages/Standards.jsx`**

```powershell
Remove-Item "frontend\src\pages\Standards.jsx"
```

- [ ] **Step 3: Commit**

```
git add frontend/src/pages/Config.jsx frontend/src/pages/Standards.jsx
git commit -m "feat: add Config page with tabbed agent editor and restore-to-default"
```

---

## Task 6: Home page — two-column layout with Sources panel

**Files:**
- Modify: `frontend/src/pages/Home.jsx`

### Why

Sources is a pre-run action. It belongs adjacent to the run interface, visible before a user launches a run. The two-column layout (run interface left, sources panel right) mirrors how a user mentally models the workflow: "I set my sources, then I run."

- [ ] **Step 1: Read `frontend/src/pages/Home.jsx` in full**

Note the current structure: header → IndustrySelector → RunInstructions → "Latest briefs" section with `computeBriefCounts`.

- [ ] **Step 2: Rewrite `frontend/src/pages/Home.jsx`**

Replace the entire file with:

```jsx
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
```

- [ ] **Step 3: Verify the file has no reference to `computeBriefCounts`, `pickLatestBriefs`, or `project-brief`**

Read the file and confirm those identifiers are absent.

- [ ] **Step 4: Commit**

```
git add frontend/src/pages/Home.jsx
git commit -m "feat: add Sources panel to Home and fix latest findings display"
```

---

## Task 7: Create Research page

**Files:**
- Create: `frontend/src/pages/Research.jsx`

### Why

"Ideas" is buried as a tab inside History. Research items are a first-class concept (curated, human-registered findings). They deserve their own route and nav item. `IdeasTab.jsx` already has the full implementation — we just promote it to a page.

- [ ] **Step 1: Create `frontend/src/pages/Research.jsx`**

```jsx
import { useEffect } from 'react';
import IdeasTab from './IdeasTab.jsx';

export default function Research() {
  useEffect(() => {
    document.title = 'Research — Research Scout';
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <header>
        <h1 style={{ fontFamily: 'IBM Plex Sans', fontSize: 32, fontWeight: 300, color: '#f0f0f0', margin: 0, letterSpacing: '-0.02em' }}>
          Research
        </h1>
        <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b', marginTop: 8, marginBottom: 0 }}>
          Registered findings and ideas under active investigation.
        </p>
      </header>
      <IdeasTab />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```
git add frontend/src/pages/Research.jsx
git commit -m "feat: promote Ideas to standalone Research page"
```

---

## Task 8: History page cleanup

**Files:**
- Modify: `frontend/src/pages/History.jsx`

### Why

History now has two remaining tabs (Artefacts, Ideas) after Sources was extracted. Ideas is now its own page. Remove the tab system entirely — History is just the artefact archive. Fix type filters: `project-brief` and `concept` are dead (agents don't produce them); keep `findings` and `synthesis`.

- [ ] **Step 1: Read `frontend/src/pages/History.jsx` in full**

Note: the file still imports `IdeasTab` and `LinksModal`. Both are now unused in History.

- [ ] **Step 2: Remove dead imports**

Remove these lines from History.jsx:
```jsx
import LinksModal from '../components/LinksModal.jsx';
import IdeasTab from './IdeasTab.jsx';
```

- [ ] **Step 3: Remove tabs entirely**

In History.jsx:
1. Delete the `activeTab` and `setActiveTab` state declaration.
2. Delete the `TAB_STYLE_BASE` constant if it exists.
3. Delete the tab bar `<div>` (the one mapping `['artefacts', 'ideas']` to buttons).
4. Remove all `{activeTab === 'artefacts' && ...}` wrapper — keep its contents (type filter row + artefact grid) but render them directly, not conditionally.
5. Delete `{activeTab === 'ideas' && <IdeasTab />}`.

- [ ] **Step 4: Fix TYPE_FILTERS**

Change:
```js
const TYPE_FILTERS = ['all', 'project-brief', 'concept', 'findings', 'synthesis'];
```
to:
```js
const TYPE_FILTERS = ['all', 'findings', 'synthesis'];
```

- [ ] **Step 5: Update the page description copy**

In the `<p>` tag under the History `<h1>`, change:
```
Every artefact produced by the agents, grouped by domain.
```
to:
```
Findings and synthesis files produced by each research run.
```

- [ ] **Step 6: Verify**

Read History.jsx and confirm:
- No reference to `LinksModal`, `IdeasTab`, `activeTab`, `'ideas'`, `'sources'`
- No reference to `project-brief` or `concept` in TYPE_FILTERS
- The page renders directly (no tab wrapper)

- [ ] **Step 7: Commit**

```
git add frontend/src/pages/History.jsx
git commit -m "refactor: remove tabs from History, strip dead type filters"
```

---

## Task 9: App.jsx + Navbar routing update

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Navbar.jsx`

### Why

New pages (Research, Config) need routes. Standards.jsx is deleted — its route must redirect to Config. Nav should be: Home | Research | History | Config.

- [ ] **Step 1: Read `frontend/src/App.jsx` and `frontend/src/components/Navbar.jsx`**

- [ ] **Step 2: Update `App.jsx`**

Replace the imports and routes:

```jsx
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import History from './pages/History.jsx';
import Research from './pages/Research.jsx';
import Config from './pages/Config.jsx';
import BriefViewer from './pages/BriefViewer.jsx';

export default function App() {
  return (
    <div className="text-zinc-100" style={{ backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10 page-enter" style={{ flex: 1, width: '100%' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/research" element={<Research />} />
          <Route path="/history" element={<History />} />
          <Route path="/config" element={<Config />} />
          <Route path="/standards" element={<Navigate to="/config" replace />} />
          <Route path="/brief/:domain/:filename" element={<BriefViewer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <div className="text-zinc-400">
      <h1 className="text-2xl font-semibold mb-2">Not found</h1>
      <p>That route does not exist.</p>
    </div>
  );
}
```

- [ ] **Step 3: Update `Navbar.jsx` nav items**

In Navbar.jsx, find the `<div className="flex items-center gap-6">` section. Replace the three `NavItem` calls with four:

```jsx
<NavItem to="/" label="Home" />
<NavItem to="/research" label="Research" />
<NavItem to="/history" label="History" badge={totalCount} />
<NavItem to="/config" label="Config" />
```

Remove the `totalCount`/`badge` from History if you want to clean that up — the badge counted all outputs, which is fine to keep.

- [ ] **Step 4: Commit**

```
git add frontend/src/App.jsx frontend/src/components/Navbar.jsx
git commit -m "feat: add Research and Config routes, redirect /standards to /config"
```

---

## Task 10: Final audit commit

**Files:**
- Verify no stray references remain

- [ ] **Step 1: Search for stray references**

Run these greps and confirm zero matches:

```powershell
# Should find nothing:
Select-String -Path "frontend\src\**\*.jsx" -Pattern "computeBriefCounts|project-brief|Standards\.jsx|IdeasTab" -Recurse
Select-String -Path "frontend\src\**\*.jsx" -Pattern "registry\.json" -Recurse
Select-String -Path ".claude\agents\*.md" -Pattern "three-tier|brief|concept note|registry" -Recurse
```

- [ ] **Step 2: Fix any matches found**

If `IdeasTab` is found in History.jsx (import not removed): remove the line.
If `project-brief` found in type filters: already fixed in Task 8, verify.
If `registry` found in agent files: these may be legitimate references in the orchestrator. Only remove if they describe old pipeline behaviour.

- [ ] **Step 3: Confirm agent files don't reference old concepts**

Read `.claude/agents/orchestrator.md` and `.claude/agents/synthesis.md`. Confirm neither mentions `registry.json`, `brief`, `concept note`, or `tier`. If any stray text exists, edit it out.

- [ ] **Step 4: Final commit**

```
git add -A
git commit -m "chore: remove stray references from old brief/concept pipeline"
```

---

## Verification

After all tasks:

1. Start backend: `cd backend && venv\Scripts\uvicorn main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Check Home: Sources panel appears on right, toggles open/closed. "Latest findings" shows findings files (not briefs).
4. Select an industry on Home, confirm run prompt references findings-only pipeline (no registry, no brief, no three-tier).
5. Open Sources panel, upload a PDF, arm a domain. Confirm arm status shows "These files will be the primary research material on the next run."
6. Navigate to `/research` — IdeasTab renders with header "Research".
7. Navigate to `/config` — tab row shows Standards, Finance Agent, Healthcare Agent, Energy Agent, Synthesis Agent, Orchestrator Agent. Click each, confirm content loads. Edit and save — confirm toast. Click Restore to default on an agent tab — confirm original content reloads.
8. Navigate to `/history` — no tabs visible, type filter shows only `all`, `findings`, `synthesis`.
9. Navigate to `/standards` — redirects to `/config`.
10. Confirm Navbar shows: Home | Research | History | Config.

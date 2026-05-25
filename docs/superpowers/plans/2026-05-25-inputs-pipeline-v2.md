# Inputs Pipeline v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the inputs pipeline with proper agent frontmatter, YouTube transcript fetching, a redesigned links/PDF upload UI, PDF chunk-reading in agents, and PPTX rejection.

**Architecture:** Four independent workstreams on the same branch: (1) add YAML frontmatter to all 5 agent files; (2) add a backend `/api/inputs/{domain}/links` endpoint that auto-fetches YouTube transcripts and saves regular URLs to `links.md`, plus a new `LinksModal` frontend component; (3) update domain agent instructions to chunk-read PDFs page by page; (4) reject PPTX uploads in the backend and restrict the file picker to `.pdf/.md/.txt`. No new abstraction layers — each change is surgical.

**Tech Stack:** Python (FastAPI, youtube-transcript-api), React, Markdown agent definitions.

---

## Files Modified / Created

| File | Action | What changes |
|------|--------|-------------|
| `.claude/agents/finance.md` | Modify | Add YAML frontmatter + PDF chunk-read instruction |
| `.claude/agents/healthcare.md` | Modify | Same |
| `.claude/agents/energy.md` | Modify | Same |
| `.claude/agents/synthesis.md` | Modify | Add YAML frontmatter |
| `.claude/agents/orchestrator.md` | Modify | Add YAML frontmatter |
| `backend/requirements.txt` | Modify | Add `youtube-transcript-api` |
| `backend/main.py` | Modify | Add `/api/inputs/{domain}/links` endpoint + PPTX rejection |
| `frontend/src/components/LinksModal.jsx` | Create | New modal for pasting URLs |
| `frontend/src/pages/History.jsx` | Modify | Replace "Add file" with "Upload PDF" + "Add links" buttons |

---

## Task 1: Agent frontmatter — domain agents

**Files:** `.claude/agents/finance.md`, `.claude/agents/healthcare.md`, `.claude/agents/energy.md`

Each domain agent gets YAML frontmatter declaring its name, description, tool allowlist, model, permission mode, and color. The frontmatter is prepended before the existing `# Finance domain agent` heading. The PDF chunk-read instruction is added to the `## Inputs pre-flight` section.

- [ ] **Step 1: Prepend frontmatter to `finance.md`**

The file currently starts at line 1 with `# Finance domain agent`. Replace the entire file so it starts with:

```markdown
---
name: finance-researcher
description: Research the finance sector for credible problem findings. Use when the user asks to run a finance research run or when the orchestrator dispatches finance research.
model: claude-sonnet-4-6
tools: WebFetch, Read, Write, Glob
permissionMode: acceptEdits
color: green
---

# Finance domain agent
```

Then keep all existing content unchanged after the heading.

- [ ] **Step 2: Add PDF chunk-read instruction to `finance.md`**

In the `## Inputs pre-flight` section, after step 3c ("For all other files: read their content directly"), insert this line as step 3c-i:

```
   c-i. For files ending in `.pdf`: read in chunks using the Read tool
        with `pages` parameter. Read pages 1–10 first, then 11–20, and
        so on until the tool returns no more content. Concatenate all
        chunks as a single source entry.
```

- [ ] **Step 3: Apply identical frontmatter + PDF instruction to `healthcare.md`**

Same structure, changing only:
- `name: healthcare-researcher`
- `description: Research the healthcare sector for credible problem findings. Use when the user asks to run a healthcare research run or when the orchestrator dispatches healthcare research.`
- `color: blue`

- [ ] **Step 4: Apply identical frontmatter + PDF instruction to `energy.md`**

Same structure, changing only:
- `name: energy-researcher`
- `description: Research the energy sector for credible problem findings. Use when the user asks to run an energy research run or when the orchestrator dispatches energy research.`
- `color: yellow`

- [ ] **Step 5: Verify all three files**

Open each file and confirm: frontmatter block is present and valid YAML, `# {Domain} domain agent` heading follows immediately after the closing `---`, and the PDF chunk-read note appears inside the inputs pre-flight section.

- [ ] **Step 6: Commit**

```
git add .claude/agents/finance.md .claude/agents/healthcare.md .claude/agents/energy.md
git commit -m "feat: add frontmatter and pdf chunk-read to domain agents"
```

---

## Task 2: Agent frontmatter — synthesis and orchestrator

**Files:** `.claude/agents/synthesis.md`, `.claude/agents/orchestrator.md`

- [ ] **Step 1: Prepend frontmatter to `synthesis.md`**

```markdown
---
name: synthesis
description: Aggregate findings files from the current run into a tagged summary. Use after all domain agents have completed their runs.
model: claude-sonnet-4-6
tools: Read, Write, Glob
permissionMode: acceptEdits
color: purple
---

# Synthesis agent
```

Keep all existing content after the heading unchanged.

- [ ] **Step 2: Prepend frontmatter to `orchestrator.md`**

```markdown
---
name: orchestrator
description: Coordinate a research run. Use when the user asks to run research across one or all domains.
model: claude-sonnet-4-6
tools: Read, Task
permissionMode: default
color: cyan
---

# Orchestrator agent
```

Keep all existing content after the heading unchanged.

- [ ] **Step 3: Verify both files**

Confirm frontmatter block present, heading follows `---`, no existing content was removed.

- [ ] **Step 4: Commit**

```
git add .claude/agents/synthesis.md .claude/agents/orchestrator.md
git commit -m "feat: add frontmatter to synthesis and orchestrator agents"
```

---

## Task 3: Backend — YouTube transcript endpoint + PPTX rejection

**Files:** `backend/requirements.txt`, `backend/main.py`

The new endpoint `POST /api/inputs/{domain}/links` accepts a JSON body `{"urls": ["..."]}`. For each URL:
- If it matches a YouTube pattern → fetch transcript via `youtube-transcript-api`, save as `{video_id}-transcript.md`
- Otherwise → append the URL as a new line to `inputs/{domain}/links.md` (creating the file if absent)

Returns a list of result objects describing what was saved.

PPTX rejection: in the existing `upload_input` endpoint, check the file extension before writing. If `.ppt` or `.pptx`, return HTTP 400.

- [ ] **Step 1: Add dependency**

In `backend/requirements.txt`, add:

```
youtube-transcript-api
```

- [ ] **Step 2: Install it**

```
cd backend && pip install youtube-transcript-api
```

Expected: package installs without error.

- [ ] **Step 3: Add imports to `backend/main.py`**

After the existing `import re` line, add:

```python
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled, VideoUnavailable
```

- [ ] **Step 4: Add YouTube URL helper and Pydantic model to `backend/main.py`**

After the `_safe_filename` function (around line 120), add:

```python
_YT_RE = re.compile(
    r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)"
    r"([a-zA-Z0-9_-]{11})"
)


def _extract_video_id(url: str) -> str | None:
    m = _YT_RE.search(url)
    return m.group(1) if m else None


class LinksPayload(BaseModel):
    urls: list[str]
```

- [ ] **Step 5: Add PPTX rejection to the existing `upload_input` endpoint**

In the existing `upload_input` function (around line 458), add this block immediately after the domain validation check (after the first `raise HTTPException`):

```python
    ext = Path(file.filename or "").suffix.lower()
    if ext in {".ppt", ".pptx"}:
        raise HTTPException(
            status_code=400,
            detail=(
                "PowerPoint files are not supported. "
                "Export your presentation as a PDF from PowerPoint or Google Slides, "
                "then upload the PDF."
            ),
        )
```

- [ ] **Step 6: Add the links endpoint to `backend/main.py`**

Add this endpoint after the `delete_input` function (around line 515):

```python
@app.post("/api/inputs/{domain}/links")
async def add_links(domain: str, payload: LinksPayload):
    if domain not in UPLOAD_DOMAINS:
        raise HTTPException(
            status_code=400,
            detail=f"domain must be one of: {', '.join(UPLOAD_DOMAINS)}.",
        )
    if not payload.urls:
        raise HTTPException(status_code=400, detail="urls list is empty.")

    domain_dir = INPUTS_DIR / domain
    domain_dir.mkdir(parents=True, exist_ok=True)

    results = []
    regular_urls = []

    for url in payload.urls:
        url = url.strip()
        if not url:
            continue
        video_id = _extract_video_id(url)
        if video_id:
            try:
                api = YouTubeTranscriptApi()
                transcript = api.fetch(video_id)
                text = "\n".join(s.text for s in transcript)
                filename = f"{video_id}-transcript.md"
                target = domain_dir / filename
                target.write_text(
                    f"# YouTube transcript: {url}\n\n{text}\n",
                    encoding="utf-8",
                )
                results.append({"url": url, "type": "youtube", "saved_as": filename})
            except (NoTranscriptFound, TranscriptsDisabled, VideoUnavailable) as exc:
                results.append({"url": url, "type": "youtube", "error": str(exc)})
        else:
            regular_urls.append(url)
            results.append({"url": url, "type": "link", "saved_as": "links.md"})

    if regular_urls:
        links_file = domain_dir / "links.md"
        existing = links_file.read_text(encoding="utf-8") if links_file.exists() else ""
        new_lines = "\n".join(regular_urls)
        links_file.write_text(
            (existing.rstrip("\n") + "\n" + new_lines + "\n").lstrip("\n"),
            encoding="utf-8",
        )

    return results
```

- [ ] **Step 7: Restart the backend and verify the PPTX rejection**

Restart uvicorn, then test with curl or the UI. Upload a `.pptx` file — expect HTTP 400 with the PowerPoint message.

- [ ] **Step 8: Verify the links endpoint with a YouTube URL**

```bash
curl -X POST http://localhost:8000/api/inputs/finance/links \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"]}'
```

Expected: JSON array with `{"type": "youtube", "saved_as": "dQw4w9WgXcQ-transcript.md"}`. Verify the file appears in `inputs/finance/`.

- [ ] **Step 9: Verify the links endpoint with a regular URL**

```bash
curl -X POST http://localhost:8000/api/inputs/finance/links \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany"]}'
```

Expected: JSON array with `{"type": "link", "saved_as": "links.md"}`. Verify the URL appears in `inputs/finance/links.md`.

- [ ] **Step 10: Commit**

```
git add backend/requirements.txt backend/main.py
git commit -m "feat: add youtube transcript endpoint and pptx rejection"
```

---

## Task 4: Frontend — LinksModal component

**File:** `frontend/src/components/LinksModal.jsx`

New component. Accepts `domain`, `onClose`, `onSaved` props. Shows a textarea for pasting URLs (one per line), posts to `/api/inputs/{domain}/links`, and shows per-URL results.

- [ ] **Step 1: Create `frontend/src/components/LinksModal.jsx`**

```jsx
import { useState } from 'react';

const OVERLAY = {
  position: 'fixed', inset: 0, zIndex: 1000,
  backgroundColor: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const MODAL = {
  backgroundColor: '#111111',
  border: '1px solid #2e2e2e',
  borderRadius: 6,
  padding: '28px 32px',
  width: 480,
  maxWidth: '92vw',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
};

const LABEL = {
  fontFamily: 'IBM Plex Mono', fontSize: 11,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  color: '#6b6b6b', marginBottom: 8, display: 'block',
};

export default function LinksModal({ domain, onClose, onSaved }) {
  const [raw, setRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const urls = raw.split('\n').map((u) => u.trim()).filter(Boolean);
    if (!urls.length) { setError('Paste at least one URL.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/inputs/${domain}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? `HTTP ${res.status}`);
      setResults(body);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={OVERLAY} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form style={MODAL} onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'IBM Plex Sans', fontSize: 15, fontWeight: 500, color: '#f0f0f0' }}>
            Add links — {domain}
          </span>
          <button
            type="button" onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b6b', fontFamily: 'IBM Plex Mono', fontSize: 16 }}
          >×</button>
        </div>

        {!results && (
          <>
            <div>
              <span style={LABEL}>URLs — one per line</span>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder={"https://www.youtube.com/watch?v=...\nhttps://www.sec.gov/..."}
                rows={7}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #2e2e2e', borderRadius: 3,
                  color: '#f0f0f0', fontFamily: 'IBM Plex Mono', fontSize: 12,
                  padding: '8px 10px', resize: 'vertical', outline: 'none',
                }}
              />
              <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 11, color: '#4b4b4b', marginTop: 5 }}>
                YouTube URLs are fetched as transcripts automatically. All other URLs are queued for the agent to fetch.
              </div>
            </div>

            {error && (
              <div style={{
                border: '1px solid rgba(239,68,68,0.3)',
                backgroundColor: 'rgba(239,68,68,0.08)',
                color: '#fca5a5', fontFamily: 'IBM Plex Mono', fontSize: 12,
                padding: '8px 12px', borderRadius: 3,
              }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button" onClick={onClose} disabled={submitting}
                style={{
                  padding: '7px 16px', borderRadius: 3, cursor: 'pointer',
                  fontFamily: 'IBM Plex Mono', fontSize: 12,
                  backgroundColor: 'transparent', color: '#6b6b6b',
                  border: '1px solid #2e2e2e',
                }}
              >Cancel</button>
              <button
                type="submit" disabled={submitting}
                style={{
                  padding: '7px 16px', borderRadius: 3,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'IBM Plex Mono', fontSize: 12,
                  backgroundColor: submitting ? '#2e2e2e' : '#f0f0f0',
                  color: submitting ? '#6b6b6b' : '#0a0a0a',
                  border: 'none', fontWeight: 500,
                }}
              >{submitting ? 'Processing…' : 'Process links'}</button>
            </div>
          </>
        )}

        {results && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {results.map((r, i) => (
                <div key={i} style={{
                  fontFamily: 'IBM Plex Mono', fontSize: 11,
                  color: r.error ? '#fca5a5' : '#a3e635',
                  padding: '6px 10px',
                  backgroundColor: r.error ? 'rgba(239,68,68,0.06)' : 'rgba(163,230,53,0.06)',
                  border: `1px solid ${r.error ? 'rgba(239,68,68,0.2)' : 'rgba(163,230,53,0.2)'}`,
                  borderRadius: 3,
                  wordBreak: 'break-all',
                }}>
                  {r.error
                    ? `✗ ${r.url} — ${r.error}`
                    : `✓ ${r.type === 'youtube' ? 'transcript' : 'queued'}: ${r.saved_as}`
                  }
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button" onClick={onClose}
                style={{
                  padding: '7px 16px', borderRadius: 3, cursor: 'pointer',
                  fontFamily: 'IBM Plex Mono', fontSize: 12,
                  backgroundColor: '#f0f0f0', color: '#0a0a0a',
                  border: 'none', fontWeight: 500,
                }}
              >Done</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```
git add frontend/src/components/LinksModal.jsx
git commit -m "feat: add LinksModal component for URL/youtube input"
```

---

## Task 5: Frontend — Sources tab redesign

**File:** `frontend/src/pages/History.jsx`

Replace the single "Add file" button in each domain card with two buttons: "Upload PDF" and "Add links". The file picker gains `accept=".pdf,.md,.txt"`. LinksModal is wired to the "Add links" button.

- [ ] **Step 1: Add LinksModal import to `History.jsx`**

At the top of `History.jsx`, after the existing imports, add:

```jsx
import LinksModal from '../components/LinksModal.jsx';
```

- [ ] **Step 2: Add linksModal state to the SourcesTab component**

Inside the `SourcesTab` function, after the `uploadState` state declaration, add:

```jsx
const [linksModal, setLinksModal] = useState(null); // domain string or null
```

- [ ] **Step 3: Replace the "Add file" button with two buttons**

Find this block in `SourcesTab` (the "+ Add file" button plus its hidden input):

```jsx
                <button
                  type="button"
                  onClick={() => fileRefs.current[d]?.click()}
                  disabled={us.uploading}
                  style={{
                    padding: '3px 10px', borderRadius: 3, cursor: us.uploading ? 'not-allowed' : 'pointer',
                    fontFamily: 'IBM Plex Mono', fontSize: 10,
                    backgroundColor: 'transparent',
                    color: us.uploading ? '#3b3b3b' : '#6b6b6b',
                    border: '1px solid #2e2e2e',
                  }}
                >
                  {us.uploading ? 'Uploading…' : '+ Add file'}
                </button>
                <input
```

Replace it with:

```jsx
                <button
                  type="button"
                  onClick={() => fileRefs.current[d]?.click()}
                  disabled={us.uploading}
                  style={{
                    padding: '3px 10px', borderRadius: 3, cursor: us.uploading ? 'not-allowed' : 'pointer',
                    fontFamily: 'IBM Plex Mono', fontSize: 10,
                    backgroundColor: 'transparent',
                    color: us.uploading ? '#3b3b3b' : '#6b6b6b',
                    border: '1px solid #2e2e2e',
                  }}
                >
                  {us.uploading ? 'Uploading…' : '+ Upload PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => setLinksModal(d)}
                  style={{
                    padding: '3px 10px', borderRadius: 3, cursor: 'pointer',
                    fontFamily: 'IBM Plex Mono', fontSize: 10,
                    backgroundColor: 'transparent',
                    color: '#6b6b6b',
                    border: '1px solid #2e2e2e',
                  }}
                >
                  + Add links
                </button>
                <input
```

- [ ] **Step 4: Add `accept` attribute to the existing hidden file input**

Find the hidden file `<input>` inside the domain card — it is the one with `ref={(el) => { fileRefs.current[d] = el; }}` and `type="file"`. Add a single attribute: `accept=".pdf,.md,.txt"`. Do not change its `ref`, `style`, or `onChange` — only add the accept attribute.

- [ ] **Step 5: Render LinksModal when open**

At the bottom of the `SourcesTab` return, just before the closing `</div>`, add:

```jsx
      {linksModal && (
        <LinksModal
          domain={linksModal}
          onClose={() => setLinksModal(null)}
          onSaved={() => { setLinksModal(null); load(); }}
        />
      )}
```

- [ ] **Step 6: Verify in the browser**

Start the dev server. Go to the Sources tab. Confirm each domain card shows "Upload PDF" and "Add links" buttons. Click "Add links" — modal should open. Paste a YouTube URL and click "Process links" — confirm the result row shows "transcript" with the video ID filename. Reload the Sources tab — confirm the transcript file appears in the file list.

- [ ] **Step 7: Commit**

```
git add frontend/src/pages/History.jsx
git commit -m "feat: redesign sources tab with pdf upload and links modal"
```

---

## Verification checklist

After all tasks complete:

- [ ] `git log --oneline -8` — 4 clean commits on `feature/findings-only-pipeline`
- [ ] All 5 agent files have valid YAML frontmatter (name, description, model, tools, permissionMode, color)
- [ ] Domain agents contain PDF chunk-read instruction in the inputs pre-flight section
- [ ] Uploading a `.pptx` file via the UI shows the "Export as PDF" error message
- [ ] Uploading a `.pdf` file succeeds
- [ ] Adding a YouTube URL via "Add links" saves a `{video_id}-transcript.md` file in `inputs/{domain}/`
- [ ] Adding a regular URL via "Add links" appends it to `inputs/{domain}/links.md`
- [ ] The file list in each domain card shows both transcript `.md` files and regular uploaded files

---

## PR and release details (to be used when pushing)

**PR title:** `feat: inputs pipeline v2 — agent frontmatter, youtube transcripts, pdf-only upload`

**PR body:**
```markdown
## Summary

- Adds YAML frontmatter to all 5 agent files (name, description, model, tools, permissionMode, color)
- Domain agents now chunk-read PDFs page by page rather than failing silently on large files
- New `POST /api/inputs/{domain}/links` endpoint: YouTube URLs are auto-fetched as transcripts, regular URLs queued in `links.md`
- Sources tab redesigned: separate "Upload PDF" and "Add links" buttons per domain
- New `LinksModal` component with per-URL result display
- PPTX uploads rejected at the backend with a helpful "export as PDF" message
- File picker restricted to `.pdf`, `.md`, `.txt`

## Test plan
- [ ] Upload a PDF to each domain — confirm it appears in the file list
- [ ] Upload a PPTX — confirm 400 error with export message
- [ ] Add a YouTube URL via "Add links" — confirm transcript file saved
- [ ] Add a regular URL via "Add links" — confirm it appears in links.md
- [ ] Arm a domain and run the agent — confirm it reads uploaded PDFs and transcript files
```

**Release tag:** `v2.1.0`

**Release title:** `v2.1.0 — Inputs Pipeline v2`

**Release notes:**
```markdown
## What's new

- **Agent frontmatter**: All agents now declare their tool allowlist, model, permission mode, and colour — no more inheriting everything from the parent session.
- **YouTube transcripts**: Paste a YouTube URL in the new "Add links" modal and the transcript is fetched server-side and saved as a markdown file. No API key. No extra steps for the user.
- **PDF-first upload**: The file picker now accepts `.pdf`, `.md`, and `.txt` only. PowerPoint files are rejected with instructions to export as PDF.
- **Full PDF reading**: Domain agents now chunk-read large PDFs page by page, including pages with diagrams (Claude reads each page visually).
- **Links modal**: New UI for adding multiple URLs at once, with per-URL feedback showing what was saved and any errors.

## Breaking changes

None. Existing uploaded files in `inputs/` continue to work.
```

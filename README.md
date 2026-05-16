# research-scout

research-scout turns Claude Code into a private research analyst. You point it at an industry — finance, healthcare, energy — and a team of specialised sub-agents scours the space for project ideas, scores every candidate against a quality bar, and produces structured briefs you can act on. The output is a tiered pipeline of fully-written project briefs, concept notes, and a persistent ideas workspace, all rendered in a local dashboard that you own completely.

## How it works

```
You → Dashboard → Claude Code agents → outputs/ → Dashboard
         ↑                                             |
         └─────────── refresh to see results ──────────┘
```

Three layers work together:

- **Claude Code agents** (`.claude/agents/`) research a domain, collect raw findings, then score each candidate against `prompts/STANDARDS.md`. The orchestrator dispatches the domain agents; the synthesis agent decides what survives.
- **FastAPI backend** (`backend/`) watches `outputs/` and serves everything as a JSON API.
- **React dashboard** (`frontend/`) reads the API and renders briefs, concept notes, the registry, and the ideas workspace.

## What it produces

Every run produces tiered output:

| Tier | Output | Threshold |
|------|--------|-----------|
| 1 | Full project brief | Passes all non-negotiables + strong positive signals |
| 2 | Concept note | Promising but needs more research |
| 3 | Discarded | Failed quality gate — logged but not written |

The **Ideas Workspace** (History → Ideas tab) lets you track briefs through a backlog → in-progress → done workflow, attach per-idea to-do lists, and archive completed work. State persists locally in `outputs/ideas-workspace.json`.

## Prerequisites

- Python 3.11+
- Node.js 18+
- [Claude Code CLI](https://claude.ai/code)

## Quickstart

```
git clone https://github.com/shiviancodes/research-scout
cd research-scout
```

First time only:

```
.\setup.ps1     # Windows
./setup.sh      # Mac / Linux
```

Every time:

```
.\start.ps1     # Windows
./start.sh      # Mac / Linux
```

Or with make if you have it:

```
make setup   # first time only
make start   # every time
make stop    # when done
```

Open the URL printed by the start script (default: http://localhost:5173)

## Running a research session

1. Open the dashboard at `http://localhost:5173` (or the URL printed by start script)
2. Select an industry on the Home page (Finance, Healthcare, or Energy)
3. Copy the Claude Code prompt shown in the dashboard
4. Open a terminal at the project root and run: `claude`
5. Paste the copied prompt into Claude Code and press Enter
6. Agents run automatically - domain agent fetches and scores 
   findings, synthesis agent writes briefs to `outputs/`
7. Refresh the History tab to see new artefacts
8. Track and manage ideas in the Ideas Workspace

## Customising your quality bar

`prompts/STANDARDS.md` controls what gets promoted to a brief. It defines non-negotiables, positive signals, disqualifiers, and scoring dimensions. Edit it directly or use the **Standards** page in the dashboard — changes take effect on the next run.

## Project structure

```
.claude/agents/     Orchestrator + domain + synthesis agent definitions
backend/            FastAPI — serves outputs/ as a JSON API
frontend/           React + Vite dashboard
outputs/            Generated artefacts (gitignored, folders committed)
prompts/            STANDARDS.md quality bar
docs/               Reference briefs (NEXUS_OVERVIEW, OMNIGEN_OVERVIEW)
```

## Port configuration

| Service  | Default | Variable |
|----------|---------|----------|
| Backend  | 8766    | `BACKEND_PORT` |
| Frontend | 5173    | `FRONTEND_PORT` |

Both are set in `.env` at the project root (copy `.env.example` to get started). Vite runs with `strictPort: true` — if a port is taken it fails loudly rather than silently shifting, so you always know which backend you're talking to.

## License 

MIT - see LICENSE

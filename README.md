# research-scout

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![Node](https://img.shields.io/badge/Node-18+-brightgreen.svg)](https://nodejs.org)
[![Claude Code](https://img.shields.io/badge/Claude-Code-orange.svg)](https://claude.ai/code)
[![React](https://img.shields.io/badge/React-Vite-61dafb.svg)](https://vitejs.dev)

research-scout turns Claude Code into a private research analyst. Upload your own research materials (PDFs, YouTube transcripts, articles) to control the evidence base. Point agents at a domain (Finance, Healthcare, Energy) and they'll surface real, named problems backed by primary sources — then search the web to validate and extend. You get a structured findings summary entirely under your control.

<div align="center">
  <img width="800" height="450" alt="research-scout" src="https://github.com/user-attachments/assets/f5348519-e80f-41fd-977b-2a8fd44b3ce8" />
</div>

## How it works

### Data Flow

```
┌──────────────────┐
│   You: Upload    │  PDFs, markdown, YouTube links per domain
│   & Arm Sources  │  (sources stored in inputs/{domain}/)
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│ Research Dashboard   │  • Select domain & run
│ (React + Vite)       │  • Copy prompt to Claude Code
└────────┬─────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│ Claude Code Agents (.claude/agents/)                 │
│                                                      │
│  Orchestrator → Domain Agents (Finance/Healthcare/  │
│                 Energy) → Synthesis Agent            │
│                                                      │
│  Apply STANDARDS.md filter → Surface credible       │
│  findings (real problem + primary source +          │
│  defensible why-now)                                │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Output Files (outputs/)          │
│ • {domain}/{YYYY-WNN}-findings  │
│ • summary/{YYYY-WNN}-summary.md │
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────────┐
│ FastAPI Backend          │  Serves outputs/ and agent
│ (backend/main.py)        │  definitions as JSON API
└────────┬─────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Dashboard reads API & displays     │
│ • Findings grouped by tag          │
│ • Run history                      │
│ • Source materials                 │
└────────────────────────────────────┘
```

### System Architecture

```
Frontend (React)          Backend (FastAPI)        Storage
┌─────────────────┐      ┌──────────────────┐     ┌──────────────────┐
│ Home            │      │ /api/inputs      │     │ inputs/
│ • Run control   │◄────►│ • Upload files   │────►│ • energy/
│ • Sources panel │      │ • Delete files   │     │ • finance/
│                 │      │ • Arm/disarm     │     │ • healthcare/
│ Config          │      │                  │     │
│ • Agent editor  │      │ /api/agents      │     │ outputs/
│ • Standards ref │      │ • Get/post agent │────►│ • findings/
│                 │      │ • Restore        │     │ • summary/
│ History         │      │                  │     │
│ • Findings view │      │ /api/run         │     │ .claude/agents/
│ • Search        │      │ • List runs      │     │ • orchestrator
│                 │      │ • Get findings   │     │ • domain agents
│ Research        │      │                  │     │ • synthesis
│ • Findings      │      │                  │     │
│   workspace     │      │                  │     │
└─────────────────┘      └──────────────────┘     └──────────────────┘
  http://localhost:5173     http://localhost:8766    Local filesystem
```

### Research Workflow

```
1. UPLOAD SOURCES          2. ARM MATERIALS           3. RUN RESEARCH
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐
│ Sources Panel        │  │ Sources Panel        │  │ Dashboard        │
│ (Home sidebar)       │  │ (Home sidebar)       │  │ Home page        │
│                      │  │                      │  │                  │
│ + PDF                │  │ Per-domain toggle:   │  │ Select domain    │
│   Drag & drop        │  │ ☐ Energy             │  │ Click "Run"      │
│   Multiple files     │  │ ☑ Finance (armed)    │  │                  │
│                      │  │ ☐ Healthcare        │  │ Copy prompt      │
│ + Links              │  │                      │  │ Paste to Claude  │
│   YouTube URLs       │  │ "Armed sources will  │  │ Code terminal    │
│   Auto-transcript    │  │  be primary on next  │  │                  │
│                      │  │  run"                │  │ Agents run       │
│ Clear                │  │                      │  │ automatically    │
│   Bulk delete        │  │ Clear (remove all)   │  │                  │
└──────────────────────┘  └──────────────────────┘  └──────────────────┘
        ↓                          ↓                          ↓
   inputs/finance/            settings.json             orchestrator.md
   • report.pdf                (domain toggles)         dispatches agents
   • slides.pptx
   • youtube-xxx.md
```

## What it produces

Every run produces a **findings file** per domain:

```
outputs/energy/2026-W21-findings.md
outputs/finance/2026-W21-findings.md
outputs/healthcare/2026-W21-findings.md
```

Plus an **aggregated summary:**

```
outputs/summary/2026-W21-summary.md
```

Each finding contains:
- **Problem:** Real, named people/roles experiencing pain + concrete consequence
- **Source:** Primary document (YouTube transcript, regulatory filing, PDF, research paper)
- **Why now:** Defensible change in the last 12 months + specific date
- **Tags:** positive signals (sa-angle, regulatory-shift, contrarian, data-moat)

Example finding:

> **Eskom Bars Licensed Traders from Virtual Wheeling Despite Live NERSA Licences**
>
> **Problem:** Traders holding NERSA-issued electricity trading licences — including Discovery Green (CEO Andre Nepgen, on record) and others — cannot contract directly as counterparty on Eskom's virtual wheeling product. Eskom's Acting GM for ED Exchange stated: "we are not dealing with traders in this virtual wheeling setup at all." Without trader participation, the aggregation model required to bring virtual wheeling to SMEs cannot function.
>
> **Source:** EE Business Intelligence webinar "Virtual Wheeling: Pilot to Platform" (user-provided YouTube transcript), NERSA public licensing data
>
> **Why now:** Eskom launched virtual wheeling as a live commercial product in early 2025. NERSA issued electricity trading licences to multiple parties including Discovery Green. The South African wholesale electricity market (SAWEM) is scheduled for April 2026 launch, forcing resolution of trader roles before market commencement.
>
> **Tags:** sa-angle regulatory-shift contrarian

The quality bar is entirely yours: edit `prompts/STANDARDS.md` directly or use the **Config → Standards** tab in the dashboard.

## Prerequisites

- Python 3.11+
- Node.js 18+
- [Claude Code CLI](https://claude.ai/code)

## Quickstart

```bash
git clone https://github.com/shiviancodes/research-scout
cd research-scout
```

**First time only:**
```bash
.\setup.ps1     # Windows
./setup.sh      # Mac / Linux
```

**Every time:**
```bash
.\start.ps1     # Windows
./start.sh      # Mac / Linux
```

Or with make:
```bash
make setup   # first time only
make start   # every time
make stop    # when done
```

Open the URL printed by the start script (default: **http://localhost:5173**)

## Running a research session

1. **Open the dashboard** at `http://localhost:5173`
2. **Upload research materials** (right sidebar, Sources panel):
   - Drag PDFs, markdown, text files
   - Paste YouTube links → system auto-fetches transcripts
   - See all materials in the Sources panel organized by domain
3. **Arm your materials** — toggle per-domain to control which files feed the next run
   - Marked as "primary research material on the next run"
4. **Run research** — select a domain and click "Run"
5. **Copy the prompt** shown in the dashboard
6. **Open Claude Code** terminal at project root and run: `claude`
7. **Paste and run** — agents execute automatically:
   - Domain agent(s) research against your armed sources + targeted web
   - Synthesis agent aggregates findings into a summary
8. **Refresh the History tab** to see new findings files
9. **(Optional) Edit agents** — Config page lets you adjust agent definitions, edit Standards, and restore to factory defaults

## Customising your quality bar

`prompts/STANDARDS.md` defines what makes a finding credible:

- **Non-negotiables:** Real named problem, primary source, defensible why-now
- **Disqualifiers:** No primary source, pure trend chasing, already solved
- **Positive signals:** sa-angle, regulatory-shift, contrarian, data-moat (help readers prioritise)

Edit directly or use **Config → Standards** in the dashboard. Changes take effect on the next run.

## Key features

### Armed-Source Workflow
Upload your own research materials (PDFs, YouTube transcripts, markdown). Toggle per-domain which materials are "armed" (primary research). Run agents against materials you've curated and chosen.

### Config Page
Edit agent definitions in-browser:
- **Standards** — view quality bar reference
- **Finance, Healthcare, Energy** — edit domain agents
- **Synthesis, Orchestrator** — edit orchestration logic
- **Save** posts changes; **Restore-to-Default** pulls factory copies

### Findings Format
Standardised four-field findings (Problem, Source, Why now, Tags) make output actionable and machine-readable.

### Run Summary
Synthesis agent aggregates findings by domain and tag. No scoring, no tiers — humans decide what to investigate.

## Project structure

```
.claude/agents/             Agent definitions (orchestrator, domain, synthesis)
.claude/projects/           Agent planning docs
backend/                    FastAPI - serves outputs/ + agent/source endpoints
frontend/                   React + Vite dashboard
outputs/                    Generated artefacts (gitignored folder skeletons)
  ├─ energy/                Domain findings per run
  ├─ finance/
  ├─ healthcare/
  └─ summary/               Aggregated summaries per run
prompts/                    STANDARDS.md — quality bar
defaults/agents/            Factory copies of agent definitions (restore-to-default)
inputs/                     User-uploaded research materials per domain
  ├─ energy/
  ├─ finance/
  └─ healthcare/
docs/                       Reference materials
```

## Port configuration

| Service  | Default | Variable |
|----------|---------|----------|
| Backend  | 8766    | `BACKEND_PORT` |
| Frontend | 5173    | `FRONTEND_PORT` |

Both are set in `.env` at the project root (copy `.env.example` to get started). Vite runs with `strictPort: true` - if a port is taken it fails loudly rather than silently shifting.

## License

MIT - see [LICENSE](LICENSE).

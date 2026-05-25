# research-scout

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![Node](https://img.shields.io/badge/Node-18+-brightgreen.svg)](https://nodejs.org)
[![Claude Code](https://img.shields.io/badge/Claude-Code-orange.svg)](https://claude.ai/code)
[![React](https://img.shields.io/badge/React-Vite-61dafb.svg)](https://vitejs.dev)

research-scout turns Claude Code into a private research analyst. Upload your own research materials (PDFs, YouTube transcripts, articles) to control the evidence base. Point agents at a domain (Finance, Healthcare, Energy) and they'll surface real, named problems backed by primary sources — then search the web to validate and extend. You get a structured findings summary entirely under your control.

<div align="center">
<img width="1265" height="694" alt="Screenshot 2026-05-25 213234" src="https://github.com/user-attachments/assets/e975cd84-bc66-4425-8a66-48e101ec95fa" />
</div>

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


<div align="left">
<img width="616" height="348" alt="image" src="https://github.com/user-attachments/assets/7b33c4fd-8f0d-40af-a44a-8b3ea6c191f9" />
</div>

## Architecture

```mermaid
flowchart TB
    subgraph input["Input"]
        User["You<br/>Upload sources<br/>Arm domains"]
    end
    
    subgraph frontend["Frontend"]
        Dashboard["React Dashboard @ :5173<br/>Home | Config | History | Research"]
    end
    
    subgraph backend["Backend"]
        API["FastAPI @ :8766<br/>/api/inputs | /api/agents | /api/run"]
    end
    
    subgraph processing["AI Processing"]
        Agents["Claude Code Agents<br/>Orchestrator → Domain Agents<br/>→ Synthesis"]
    end
    
    subgraph storage["Storage"]
        Files["inputs/ - Your uploads<br/>outputs/ - Findings<br/>.claude/agents/ - Definitions"]
    end
    
    subgraph output["Output"]
        Findings["Findings<br/>Problem | Source | Why now | Tags"]
    end
    
    User -->|Upload PDFs<br/>YouTube links| Dashboard
    Dashboard -->|API calls| API
    Dashboard -->|Copy prompt| Agents
    API -->|Serves| Dashboard
    Agents -->|Read armed sources| Files
    Agents -->|Web search| Agents
    Agents -->|Write| Files
    Files -->|Serve| API
    Files -->|Generate| Findings
    Dashboard -->|View| Findings
```

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

# research-scout

A local research intelligence system that uses Claude Code sub-agents to autonomously
research industries and generate raw findings that are aggregated into summaries.

## Folder structure

- `.claude/` — Claude Code configuration.
  - `CLAUDE.md` — this file. Project-level operating instructions.
  - `agents/` — sub-agent definitions. One file per agent. Each file declares the
    agent's role, sources, and output format.
- `prompts/STANDARDS.md` — the quality bar. Every agent must read this before
  producing any findings.
- `outputs/` — agent-generated artefacts. Domain subfolders (`finance/`,
  `healthcare/`, `energy/`) hold raw findings files. `summary/` holds aggregated
  summaries. `registry.json` tracks registered ideas for reference.
- `backend/` — FastAPI service that serves the `outputs/` directory as JSON.
- `frontend/` — React + Vite dashboard that consumes the backend.
- `docs/` — reference materials.

## Output naming convention

All output files use ISO week-based naming:

    YYYY-WNN-{type}.md

Where:
- `YYYY` is the four-digit year
- `WNN` is the ISO week number, zero-padded (e.g. `W07`, `W23`)
- `{type}` is one of: `findings`, `summary`

Examples:
- `outputs/finance/2026-W20-findings.md`
- `outputs/summary/2026-W20-summary.md`

## Sub-agents

Sub-agents live in `.claude/agents/`. The orchestrator dispatches domain agents
(finance, healthcare, energy), which produce raw findings files. The synthesis
agent reads findings across domains and produces an aggregated summary.

## Quality bar

Every agent must read `prompts/STANDARDS.md` before producing findings. The
standards define non-negotiables, positive signals, tagging conventions, and
the required output format. Do not deviate.

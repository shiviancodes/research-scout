# research-scout

A local research intelligence system that uses Claude Code sub-agents to autonomously
research industries, score findings against a defined quality bar, and generate
project briefs in the style of `docs/NEXUS_OVERVIEW.md` and `docs/OMNIGEN_OVERVIEW.md`.

## Folder structure

- `.claude/` — Claude Code configuration.
  - `CLAUDE.md` — this file. Project-level operating instructions.
  - `agents/` — sub-agent definitions. One file per agent. Each file declares the
    agent's role, sources, scoring criteria, and output format.
- `prompts/STANDARDS.md` — the quality bar. Every agent must read this before
  proposing any idea and apply it when scoring findings.
- `outputs/` — agent-generated artefacts. Domain subfolders (`finance/`,
  `healthcare/`, `energy/`) hold full briefs and raw findings. `concepts/` holds
  shorter concept notes that did not reach full-brief threshold. `registry.json`
  is the canonical index of every idea ever proposed and must be consulted by
  the synthesis agent before any new idea is written, to prevent duplicates.
- `backend/` — FastAPI service that serves the `outputs/` directory as JSON.
- `frontend/` — React + Vite dashboard that consumes the backend.
- `docs/` — reference materials. `NEXUS_OVERVIEW.md` and `OMNIGEN_OVERVIEW.md` are
  the canonical examples of the brief format every full brief must match.

## Output naming convention

All output files use ISO week-based naming:

    YYYY-WNN-{type}.md

Where:
- `YYYY` is the four-digit year
- `WNN` is the ISO week number, zero-padded (e.g. `W07`, `W23`)
- `{type}` is one of: `brief`, `concept`, `findings`

Examples:
- `outputs/finance/2026-W20-brief.md`
- `outputs/healthcare/2026-W20-concept.md`
- `outputs/energy/2026-W20-findings.md`

## Sub-agents

Sub-agents live in `.claude/agents/`. The orchestrator dispatches domain agents
(finance, healthcare, energy), which produce raw findings. The synthesis agent
reads findings across domains, consults `outputs/registry.json` to avoid
duplicates, scores against `prompts/STANDARDS.md`, and decides whether each
candidate becomes a full brief, a concept note, or is discarded.

## Quality bar

Every agent must read `prompts/STANDARDS.md` before scoring or writing. The
standards define non-negotiables, positive signals, disqualifiers, and the
required output format. Do not deviate.

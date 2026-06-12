# research-scout

A local research intelligence system that uses a Claude Code multi-stage
pipeline to research one industry per run and surface adversarially-verified,
primary-sourced problem findings.

## Running research

`/research <domain> "[focus keywords]" [dry]` — e.g.
`/research energy "grid storage, municipal billing"`.

The command runs in the main session and orchestrates:
scouts (parallel, one per modality) → triage → deep-dive (one subagent per
candidate) → red-team (adversarial verification, kill-by-default) →
assemble + registry + synthesis. One domain per run; `dry` runs a cheap
2-scout / 2-candidate end-to-end test.

## Folder structure

- `.claude/` — Claude Code configuration.
  - `CLAUDE.md` — this file. Project-level operating instructions.
  - `commands/research.md` — the pipeline orchestrator command.
  - `agents/` — stage sub-agents: `scout` (breadth, haiku), `deep-dive`
    (primary-source chase, sonnet), `red-team` (adversarial verify,
    sonnet), `synthesis` (summary). The old per-domain agents
    (finance/healthcare/energy/orchestrator) are deprecated, kept only
    until the backend/Config cutover.
  - `settings.json` — PostToolUse hook running `scripts/lint_findings.py`
    on findings-file writes.
- `prompts/STANDARDS.md` — the quality bar. Deep-dive applies it as a hard
  filter; the lint hook enforces the output format mechanically.
- `prompts/sources/{domain}.md` — per-domain source packs, organized by
  scout modality, with search strategies and degraded-mode index URLs.
  Adding an industry = adding a source pack (plus backend/UI wiring).
- `scripts/` — deterministic helpers: `lint_findings.py` (hook),
  `update_registry.py` (atomic registry appends), `log_run.py` (run
  telemetry), `check_links.py` (advisory link check).
- `outputs/` — agent-generated artefacts. Domain subfolders hold weekly
  findings files; `.run/` scratch dirs are transient per-run workspaces.
  `summary/` holds aggregated summaries. `registry.json` tracks registered
  ideas (backend-owned — agents never write it).
  `findings-registry.json` is the cross-run finding memory (written only
  via `update_registry.py`); `run-log.jsonl` is per-run telemetry.
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

## Quality bar

Every writing agent must read `prompts/STANDARDS.md` before producing
findings. The standards define non-negotiables, positive signals, tagging
conventions, and the required output format. Do not deviate. The red-team
stage defaults to KILL when uncertain — thin weeks are expected output,
not failure.

## TODO

- Revisit around 2026-07-10 (~4 weeks of usage data): does the
  armed-uploads workflow (inputs/ + settings.json arming) earn its place,
  or should uploads become just another scout modality permanently?

---
description: Run a single-domain research pipeline (scouts → triage → deep-dive → red-team → assemble → synthesis)
argument-hint: <finance|healthcare|energy> "[focus keywords]" [dry]
---

Run a research pipeline for domain `$0` with optional focus keywords `$1`
and optional mode flag `$2`. You are the orchestrator; you run in the main
session and dispatch all stage subagents via the Task tool. Follow the
phases below exactly and in order.

## Setup

1. Validate the domain with the hard gate: run
   `python scripts/validate_domain.py $0` via Bash. If it exits non-zero,
   STOP immediately and show the user its stderr — do not proceed to any
   later step. This is a real exit-code gate, not a judgment call.
2. Mode: if `$2` is `dry`, this is a dry run — spawn only 2 scouts
   (regulatory + earnings modalities) and select only 2 candidates for
   deep-dive. Use dry mode for cheap end-to-end testing. The
   armed-uploads scout, when eligible per Setup step 7, runs in BOTH full
   and dry mode — armed material is never silently skipped.
3. Compute the ISO week label `{YYYY-WNN}` for today (e.g. `2026-W24`).
   If `outputs/$0/{YYYY-WNN}-findings.md` already exists, warn the user it
   will be overwritten and continue.
4. Read `prompts/STANDARDS.md` and `prompts/sources/$0.md`.
5. Delete any stale scratch files: remove `outputs/$0/.run/` contents if
   the directory exists (aborted earlier runs leave debris).
6. Read `outputs/findings-registry.json` if it exists. Build the
   **exclusion list**: one compact line per entry (`title — keywords`),
   filtered to domain `$0` entries from the last 12 ISO weeks, capped at
   100 lines (most recent first). Entries older than 12 weeks are included
   only if their keywords match the focus keywords `$1`. Treat killed and
   survived entries alike.
7. Read `inputs/settings.json`. The armed-uploads scout runs only if the
   `$0` flag is `true` AND `inputs/$0/` contains files other than
   `.gitkeep`. If the flag is true but no files exist, note it, proceed
   without the uploads scout, and still reset the flag in Phase E.

## Phase A — Scouts (parallel)

Dispatch the `scout` subagent once per modality **in a single message**
(parallel Task calls). Full run: 4 scouts — `regulatory consultations &
comment letters`, `earnings-call Q&A & investor documents`, `audit &
oversight reports`, `tenders, RFPs & practitioner complaints` — plus the
armed-uploads scout if Setup step 7 allows. Dry run: first 2 modalities
only.

Each scout's task prompt must contain, explicitly:
- Its single modality charter and the instruction to stay inside it
  (boundaries prevent duplicate work).
- The domain `$0` and the source pack path `prompts/sources/$0.md`,
  telling it to use its modality's section.
- The focus keywords `$1` (if any) as steering, with the note that an
  off-focus strong signal beats an on-focus weak one.
- The exclusion list from Setup step 6 (or "none — first run").
- The required return format from `scout.md` (SIGNAL | URL | WHY |
  MODALITY lines, 6–10 candidates).
- For the uploads scout only: the file listing of `inputs/$0/` and the
  armed-uploads instructions.

Record any `DEGRADED:` flags returned for the run report.

## Phase B — Triage (you, no subagent)

Apply this procedure exactly — do not improvise:

1. Merge all scout candidates into one list.
2. Dedup by normalized URL: lowercase the host, strip query string and
   fragment; identical normalized URLs collapse to one candidate.
3. Collapse remaining same-topic candidates by title similarity (the same
   consultation/filing found by two scouts from different angles is ONE
   candidate — keep the best-evidenced line).
4. Drop any candidate matching the exclusion list.
5. Rank by, in order: specificity of named actor; likelihood the URL is or
   leads to a primary source; likelihood of a dated why-now within 12
   months; focus-keyword match. Break ties by modality rarity (prefer
   candidates from underrepresented modalities).
6. Select the top 10 (dry run: top 2). List the selected candidates with
   one-line justifications before proceeding.

## Phase C — Deep-dive (parallel, batches of ≤5)

For each selected candidate, dispatch a `deep-dive` subagent. Spawn at
most 5 concurrent Task calls; run two batches if needed.

Each task prompt must contain: the full candidate line; the domain and
source pack path; the focus keywords; and the exact scratch output path
`outputs/$0/.run/{slug}.md` where `{slug}` is a short kebab-case slug you
derive from the candidate title (unique per candidate).

Collect the `WROTE:` / `DISCARD:` results.

## Phase D — Red-team (parallel, batches of ≤5)

For each scratch finding written in Phase C, dispatch a `red-team`
subagent with the scratch file path. Spawn at most 5 concurrent Task
calls. Collect `VERDICT: KILL|SURVIVE`, reasons, and evidence.

## Phase E — Assemble (durable-value steps first, in this exact order)

1. **Write the findings file.** Read the surviving scratch files and
   assemble `outputs/$0/{YYYY-WNN}-findings.md`: H1 title
   `# {Domain} Findings — {YYYY-WNN}`, then each surviving finding
   verbatim, separated by `---`. If fewer than 8 survivors, append an
   explicit gap note ("Fewer than 8 credible findings survived
   verification this run; N candidates were killed — see registry for
   reasons.") — never pad with weak findings.
2. **Update the registry.** For EVERY finding that reached Phase D (both
   survived and killed), run:
   `python scripts/update_registry.py '<entry JSON>'`
   with schema `{id, domain, run, title, keywords[], primary_source,
   tags[], status: "survived"|"killed", kill_reason, file}`. The `id` is
   `{domain}-{YYYY-WNN}-{slug}`. `file` is the findings file path for
   survivors, null for kills. Run once per entry; stop and report if the
   script errors.
3. **Reset the armed flag** — only if the armed material was actually
   consumed (the uploads scout ran and read the files) OR the flag was
   true with no files present (stale flag). If files exist but were NOT
   consumed (e.g. unreadable PDF, scout failure), leave the flag true and
   report why — resetting would silently discard the user's armed
   material.
4. Advisory link check: `python scripts/check_links.py
   outputs/$0/{YYYY-WNN}-findings.md` — include results in the report;
   failures are flags for human review, not blockers (many primary
   sources block non-browser clients).
5. Log the run: `python scripts/log_run.py '<entry JSON>'` with
   `{run, domain, focus, candidate_count, deep_dive_count, kill_count,
   kill_reasons (tally object), survival_rate, modality_mix (candidates
   per modality), degraded_scouts, link_check (summary string),
   subagent_tokens_per_stage (from Task results if shown, else null)}`.
6. Delete the `outputs/$0/.run/` directory and its contents.
7. Dispatch the `synthesis` subagent with the findings file path.
8. **Report** to the user: domain, focus, candidate count per modality,
   triage selections, deep-dive discards, kills with reasons, survivor
   count, findings file path, summary file path, degraded scouts,
   link-check summary.

Steps 1–3 are the durable-value steps; if anything from step 4 on fails,
the output and cross-run memory are already safely on disk — report the
failure and continue with the remaining steps where possible.

## Calibration note (include in every report)

The red-team defaults to KILL when uncertain. The first 2–3 runs may have
high kill rates while the bar settles; if survival rate stays below 30%,
review the kill reasons in the registry before loosening anything. A thin
week (1–2 survivors, especially after a degraded-WebSearch run) is
expected output, not failure — better empty than generic.

"""Deterministic JSONL appender for outputs/run-log.jsonl.

Usage: python scripts/log_run.py '<json run entry>'
   or: echo '<json run entry>' | python scripts/log_run.py

Expected keys (missing ones default to null):
  run, domain, focus, candidate_count, deep_dive_count, kill_count,
  kill_reasons (object: reason -> tally), survival_rate, modality_mix,
  degraded_scouts (list), link_check, subagent_tokens_per_stage

No dollar estimates by design — hardcoded pricing goes stale silently;
apply current pricing to the token counts externally.
"""
import json
import os
import sys

LOG = os.path.join("outputs", "run-log.jsonl")
KEYS = (
    "run", "domain", "focus", "candidate_count", "deep_dive_count",
    "kill_count", "kill_reasons", "survival_rate", "modality_mix",
    "degraded_scouts", "link_check", "subagent_tokens_per_stage",
)
REQUIRED = ("run", "domain")


def die(msg):
    print(f"log_run: {msg}", file=sys.stderr)
    sys.exit(1)


def main():
    raw = sys.argv[1] if len(sys.argv) > 1 else sys.stdin.read()
    try:
        entry = json.loads(raw)
    except (json.JSONDecodeError, ValueError) as exc:
        die(f"invalid JSON entry: {exc}")

    for key in REQUIRED:
        if not entry.get(key):
            die(f"entry missing required key '{key}'")

    record = {key: entry.get(key) for key in KEYS}

    with open(LOG, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, ensure_ascii=False) + "\n")
    print(f"logged run {record['run']} ({record['domain']})")


if __name__ == "__main__":
    main()

"""Deterministic appender for outputs/findings-registry.json.

Usage: python scripts/update_registry.py '<json entry>'
   or: echo '<json entry>' | python scripts/update_registry.py

Entry schema:
  {id, domain, run, title, keywords[], primary_source, tags[],
   status: "survived"|"killed", kill_reason, file}

Creates the registry if missing. Atomic write (temp + os.replace).
Agents never hand-edit this JSON; only this script writes it.
"""
import json
import os
import sys

REGISTRY = os.path.join("outputs", "findings-registry.json")
REQUIRED = ("id", "domain", "run", "title", "status")
STATUSES = {"survived", "killed"}


def die(msg):
    print(f"update_registry: {msg}", file=sys.stderr)
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
    if entry["status"] not in STATUSES:
        die(f"status must be one of {sorted(STATUSES)}")

    entry.setdefault("keywords", [])
    entry.setdefault("tags", [])
    entry.setdefault("primary_source", None)
    entry.setdefault("kill_reason", None)
    entry.setdefault("file", None)

    if os.path.exists(REGISTRY):
        try:
            with open(REGISTRY, encoding="utf-8") as fh:
                data = json.load(fh)
        except (json.JSONDecodeError, OSError) as exc:
            die(f"cannot read existing registry: {exc}")
    else:
        data = {"version": 1, "findings": []}

    if any(f.get("id") == entry["id"] for f in data["findings"]):
        die(f"duplicate id '{entry['id']}' — already registered")

    data["findings"].append(entry)

    tmp = REGISTRY + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    os.replace(tmp, REGISTRY)
    print(f"registered {entry['id']} ({entry['status']})")


if __name__ == "__main__":
    main()

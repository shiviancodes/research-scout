"""PostToolUse hook: validate findings files against prompts/STANDARDS.md section 4.

Reads the hook payload from stdin, fast-exits 0 for any path that is not a
findings file, exits 2 with a named rule on stderr for violations so Claude
self-corrects. Stdlib only.
"""
import json
import re
import sys
from pathlib import PurePosixPath

ALLOWED_TAGS = {"contrarian", "sa-angle", "regulatory-shift", "data-moat"}
HEDGES = ("could potentially", "might be", "may be relevant")
FINDINGS_PATH = re.compile(
    r"outputs/(finance|healthcare|energy)/(\.run/)?[^/]+\.md$"
)
WEEKLY_NAME = re.compile(r"\d{4}-W\d{2}-findings\.md$")
GAP_NOTE = re.compile(r"fewer than 8|gap note|credible findings", re.IGNORECASE)


def fail(rule, detail):
    print(f"lint_findings: {rule}: {detail}", file=sys.stderr)
    sys.exit(2)


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    file_path = (payload.get("tool_input") or {}).get("file_path", "")
    if not file_path:
        sys.exit(0)

    normalized = file_path.replace("\\", "/")
    match = FINDINGS_PATH.search(normalized)
    if not match:
        sys.exit(0)

    try:
        with open(file_path, encoding="utf-8") as fh:
            content = fh.read()
    except OSError:
        sys.exit(0)

    name = PurePosixPath(normalized).name
    is_weekly = WEEKLY_NAME.search(name) and not match.group(2)

    blocks = re.split(r"^## ", content, flags=re.MULTILINE)[1:]
    if not blocks:
        fail("no-findings", f"{name} contains no '## ' finding blocks")

    for block in blocks:
        title = block.splitlines()[0].strip()
        positions = []
        for field in ("**Problem:**", "**Source:**", "**Why now:**"):
            pos = block.find(field)
            if pos == -1:
                fail("missing-field", f"finding '{title}' lacks {field}")
            positions.append(pos)
        if positions != sorted(positions):
            fail("field-order", f"finding '{title}' fields out of order "
                                "(Problem, Source, Why now)")

        source_match = re.search(r"\*\*Source:\*\*(.*?)(?=\n\*\*|\Z)",
                                 block, re.DOTALL)
        source_text = source_match.group(1) if source_match else ""
        if not re.search(r"https?://", source_text):
            fail("source-url", f"finding '{title}' Source has no URL")
        if not re.search(r"\b(19|20)\d{2}\b", source_text):
            fail("source-date", f"finding '{title}' Source has no year")

        tags_match = re.search(r"\*\*Tags:\*\*(.+)", block)
        if tags_match:
            tags = set(tags_match.group(1).split())
            bad = tags - ALLOWED_TAGS
            if bad:
                fail("bad-tag", f"finding '{title}' has unknown tags: "
                                f"{' '.join(sorted(bad))}")

        lowered = block.lower()
        for hedge in HEDGES:
            if hedge in lowered:
                fail("hedging", f"finding '{title}' contains '{hedge}' "
                                "(STANDARDS section 5)")

    if is_weekly:
        if not re.search(r"^# ", content, re.MULTILINE):
            fail("missing-h1", f"{name} needs an H1 title (Register flow)")
        if len(blocks) < 8 and not GAP_NOTE.search(content):
            fail("min-findings", f"{name} has {len(blocks)} findings; "
                                 "needs >=8 or an explicit gap note")

    sys.exit(0)


if __name__ == "__main__":
    main()

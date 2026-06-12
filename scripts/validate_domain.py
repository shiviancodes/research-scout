"""Hard domain gate for the /research pipeline.

Usage: python scripts/validate_domain.py <domain>

Exits 0 only if <domain> is one of finance|healthcare|energy AND its source
pack prompts/sources/<domain>.md exists. Otherwise exits non-zero with a
clear message on stderr. This is a real exit code, not model-obeyed prose —
the command calls it before Phase A and stops on non-zero.
"""
import os
import sys

VALID = ("finance", "healthcare", "energy")


def main():
    if len(sys.argv) != 2 or not sys.argv[1].strip():
        print("validate_domain: no domain given. "
              f"Valid domains: {', '.join(VALID)}.", file=sys.stderr)
        sys.exit(2)

    domain = sys.argv[1].strip().lower()
    if domain not in VALID:
        print(f"validate_domain: '{sys.argv[1]}' is not a valid domain. "
              f"Valid domains: {', '.join(VALID)}.", file=sys.stderr)
        sys.exit(2)

    pack = os.path.join("prompts", "sources", f"{domain}.md")
    if not os.path.isfile(pack):
        print(f"validate_domain: domain '{domain}' is valid but its source "
              f"pack is missing: {pack}", file=sys.stderr)
        sys.exit(3)

    print(f"validate_domain: OK ({domain})")
    sys.exit(0)


if __name__ == "__main__":
    main()

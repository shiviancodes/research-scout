"""Advisory link checker for an assembled findings file.

Usage: python scripts/check_links.py outputs/energy/2026-W24-findings.md

Extracts URLs from **Source:** lines and HEAD/GETs each with a browser-like
User-Agent and a short timeout. Prints one line per URL. ALWAYS exits 0 —
results are advisory; many primary sources (SEC EDGAR, regulators) block
non-browser clients, so a failure here is a flag for human review, not a
verdict. The red-team stage is the real citation check.
"""
import re
import ssl
import sys
import urllib.error
import urllib.request

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
TIMEOUT = 5
URL_RE = re.compile(r"https?://[^\s)>\]\"']+")


def check(url):
    ctx = ssl.create_default_context()
    for method in ("HEAD", "GET"):
        req = urllib.request.Request(url, method=method,
                                     headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT,
                                        context=ctx) as resp:
                return f"OK {resp.status}"
        except urllib.error.HTTPError as exc:
            if method == "HEAD" and exc.code in (403, 405, 501):
                continue  # some hosts reject HEAD; retry with GET
            return f"HTTP {exc.code}"
        except Exception as exc:  # timeout, DNS, TLS — advisory only
            return f"FAIL {type(exc).__name__}"
    return "FAIL unreachable"


def main():
    if len(sys.argv) != 2:
        print("usage: check_links.py <findings file>", file=sys.stderr)
        sys.exit(0)

    try:
        with open(sys.argv[1], encoding="utf-8") as fh:
            content = fh.read()
    except OSError as exc:
        print(f"check_links: cannot read file: {exc}", file=sys.stderr)
        sys.exit(0)

    # Capture the whole Source block (from **Source:** up to the next bold
    # field marker like **Why now:** / **Tags:**, the finding separator
    # ---, or end of file) so every URL across multiple lines is checked,
    # not just the first line.
    source_blocks = re.findall(
        r"\*\*Source:\*\*(.*?)(?=\n\*\*[A-Za-z][^*]*:\*\*|\n---|\Z)",
        content, re.DOTALL)
    urls = []
    for block in source_blocks:
        for url in URL_RE.findall(block):
            url = url.rstrip(".,;")
            if url not in urls:
                urls.append(url)

    if not urls:
        print("check_links: no URLs found in Source lines")
        sys.exit(0)

    for url in urls:
        print(f"{check(url):<12} {url}")
    sys.exit(0)


if __name__ == "__main__":
    main()

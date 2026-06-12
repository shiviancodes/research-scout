# Finance — source pack

Per-modality venues and search strategies for scout and deep-dive agents.
SA venues are listed inside each modality; SA context is a positive signal
per `prompts/STANDARDS.md` — a problem unsolved in SA but solved elsewhere
is a valid project angle.

## Modality: regulatory consultations & comment letters

Comment letters are companies describing their own pain in writing, with
numbers. Read the letters, not the rule summaries.

- SEC proposed rules + comment files: https://www.sec.gov/rules-regulations/proposed-rules
  - Search: `site:sec.gov comments "file number" [topic]`
- CFTC public comments: https://comments.cftc.gov/
- FINRA regulatory notices + comment letters: https://www.finra.org/rules-guidance/notices
- FCA consultation papers: https://www.fca.org.uk/publications/search-results?np_category=consultations
- ECB/EBA consultations; OCC bulletins.
- SARB Prudential Authority circulars and consultations: https://www.resbank.co.za/en/home/publications/prudential-authority
- National Treasury (SA) policy papers and budget documents: https://www.treasury.gov.za/
- JSE regulatory notices and SENS announcements: https://www.jse.co.za/
- Search strategies: `"comment letter" [rule] operational burden site:sec.gov`,
  `"we are concerned" OR "significant cost" consultation response [topic]`

## Modality: earnings-call Q&A & investor documents

Read the Q&A section, skip the prepared remarks — analysts probe what
management avoids.

- SEC EDGAR full-text search (10-K, 10-Q, 8-K): https://efts.sec.gov/LATEST/search-index?q=
  - 10-K "Risk Factors" diffs year-over-year surface newly admitted problems.
- Earnings transcripts for the largest twenty US/EU banks plus top-tier
  fintechs (Stripe, Adyen, Block, Nubank, Revolut, Wise) — issuer IR pages
  host them directly (primary); Motley Fool/Seeking Alpha transcripts are
  acceptable pointers but cite the issuer copy.
- Federal Reserve, BIS, IMF, FSB working papers and statistical releases.
- Search strategies: `[bank] earnings call transcript Q&A "manual process"`,
  `10-K "risk factor" "we rely on" [legacy system topic]`

## Modality: audit & oversight reports

- GAO reports on financial regulation: https://www.gao.gov/reports-testimonies
- Treasury OIG and SIGTARP audit reports.
- Federal Reserve OIG: https://oig.federalreserve.gov/
- FCA/Bank of England enforcement notices and skilled-person review summaries.
- Auditor-General South Africa reports on public-entity finance: https://www.agsa.co.za/
- Search strategies: `site:gao.gov [topic] "remains unresolved"`,
  `OIG audit "material weakness" [payment system]`

## Modality: tenders, RFPs & practitioner complaints

- SAM.gov (US federal) and TED (EU) financial-services tenders — an RFP is
  a named organisation paying to solve a problem.
- SA eTenders portal: https://www.etenders.gov.za/
- Operator and practitioner blogs: Bits about Money (Patrick McKenzie),
  Net Interest (Marc Rubinstein), Money Stuff (Matt Levine), Fintech
  Business Weekly.
- FinMark Trust research reports (SA informal economy fintech): https://finmark.org.za/
- Industry conference agendas: Money 20/20, Sibos — session titles reveal
  what operators are struggling with this year.
- Search strategies: `RFP "core banking" OR "reconciliation" 2026`,
  `site:news.ycombinator.com [fintech pain point]`

## Avoid

Generic news aggregators, listicle "top 10" coverage, LinkedIn summaries of
filings — always fetch the primary document itself.

## Degraded-mode index URLs (WebFetch fallback when WebSearch unavailable)

- https://www.sec.gov/rules-regulations/proposed-rules
- https://www.gao.gov/reports-testimonies
- https://www.resbank.co.za/en/home/publications/prudential-authority
- https://www.bitsaboutmoney.com/archive/
- https://www.etenders.gov.za/

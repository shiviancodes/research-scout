# Energy — source pack

Per-modality venues and search strategies for scout and deep-dive agents.
SA venues are listed inside each modality; SA context is a positive signal
per `prompts/STANDARDS.md` (grid instability is a named SA angle).

## Modality: regulatory consultations & comment letters

- FERC dockets, orders, and filed comments: https://elibrary.ferc.gov/eLibrary/search
  — intervenor and utility comments quantify interconnection, market-design,
  and compliance pain directly.
- Public utility commission dockets: CPUC (CA), PUCT (TX), NY PSC, plus the
  largest five European markets.
- ISO/RTO stakeholder processes (CAISO, ERCOT, PJM, MISO, NYISO) — market
  notices, capacity auction results, stakeholder meeting comments.
- NERSA (SA) regulatory decisions, tariff applications, and consultation
  papers: https://www.nersa.org.za/
- Search strategies: `site:elibrary.ferc.gov comments [docket topic] "burden"`,
  `PUC docket [state] "interconnection queue" complaint`

## Modality: earnings-call Q&A & investor documents

- Earnings transcripts (Q&A first): integrated majors (Shell, BP, Exxon,
  Chevron), largest US utilities (NextEra, Duke, Southern), serious
  cleantech operators (Tesla Energy, Fluence, Sunrun, Form Energy).
- SEC EDGAR 10-K risk-factor diffs for utilities and IPPs.
- EIA short-term and annual energy outlooks; weekly petroleum and natural
  gas reports (primary data).
- Eskom (SA) integrated reports and investor presentations.
- Search strategies: `[utility] earnings call Q&A "load growth" OR "curtailment"`,
  `10-K utility "wildfire" OR "interconnection" risk factor 2026`

## Modality: audit & oversight reports

- GAO energy reports: https://www.gao.gov/energy
- DOE OIG audit reports: https://www.energy.gov/ig/listings/audit-reports
- State auditor reports on utility commissions and public power.
- IEA, IRENA, BloombergNEF reports where the underlying data is primary.
- Auditor-General South Africa reports on Eskom and municipalities
  (electricity revenue): https://www.agsa.co.za/
- CSIR (SA) energy research publications: https://www.csir.co.za/
- Eskom system operator adequacy reports.
- Search strategies: `site:gao.gov grid OR transmission "GAO recommends"`,
  `auditor-general municipal electricity losses report`

## Modality: tenders, RFPs & practitioner complaints

- DOE loan office announcements and ARPA-E programme summaries.
- SAM.gov energy RFPs; utility-issued RFPs for capacity, storage, DR.
- DMRE (SA) IPP procurement documents: https://www.ipp-projects.co.za/
- SA eTenders portal (energy category): https://www.etenders.gov.za/
- GreenCape (SA) market intelligence reports: https://greencape.co.za/
- Operator blogs: Volts (David Roberts), Energy Bad Boys, Doomberg (with
  appropriate scepticism), Catalyst (Shayle Kann).
- Search strategies: `utility RFP "battery storage" OR "demand response" 2026`,
  `site:reddit.com/r/solar installer [pain point]`

## Avoid

Generic "renewables hype" coverage; any source that conflates nameplate
capacity with actual delivered energy.

## Degraded-mode index URLs (WebFetch fallback when WebSearch unavailable)

- https://www.gao.gov/energy
- https://www.energy.gov/ig/listings/audit-reports
- https://www.nersa.org.za/
- https://www.ipp-projects.co.za/
- https://www.volts.wtf/archive

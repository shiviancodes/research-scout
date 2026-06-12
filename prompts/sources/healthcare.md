# Healthcare — source pack

Per-modality venues and search strategies for scout and deep-dive agents.
SA venues are listed inside each modality; SA context is a positive signal
per `prompts/STANDARDS.md`.

## Modality: regulatory consultations & comment letters

- CMS proposed rules + public comments on regulations.gov:
  https://www.regulations.gov/ (agency = CMS) — provider and payer comment
  letters quantify compliance pain directly.
- FDA guidance documents, 510(k) clearances, De Novo classifications,
  warning letters: https://www.fda.gov/medical-devices
- ONC/ASTP health-IT rules and information-blocking complaints.
- SAHPRA (SA Health Products Regulatory Authority) notices and approvals:
  https://www.sahpra.org.za/
- Council for Medical Schemes (SA) circulars and annual reports:
  https://www.medicalschemes.co.za/
- Search strategies: `site:regulations.gov comment CMS [rule] "administrative burden"`,
  `FDA warning letter [device category] 2026`

## Modality: earnings-call Q&A & investor documents

- Earnings transcripts (Q&A section first): UnitedHealth, Elevance,
  CVS/Aetna, Humana, HCA; digital health top tier (Hims, Teladoc, Hinge,
  Omada). Issuer IR pages are primary.
- SEC EDGAR 10-K risk-factor diffs for payers/providers/health-IT vendors.
- Discovery Health (SA) medical scheme reports and investor presentations.
- Search strategies: `[payer] earnings transcript "prior authorization" Q&A`,
  `10-K "denials" OR "revenue cycle" health system`

## Modality: audit & oversight reports

- HHS OIG reports and advisory opinions: https://oig.hhs.gov/reports-and-publications/
- GAO healthcare reports: https://www.gao.gov/health-care
- CMS MAC LCDs and audit findings; MedPAC reports to Congress.
- State auditor reports on Medicaid programs.
- NICD (SA) surveillance reports: https://www.nicd.ac.za/
- Office of Health Standards Compliance (SA) inspection reports.
- Search strategies: `site:oig.hhs.gov [topic] "improper payments"`,
  `GAO "lacks data" OR "cannot verify" [care setting]`

## Modality: tenders, RFPs & practitioner complaints

- SAM.gov health-IT and services RFPs; state procurement portals.
- SA eTenders portal (health category): https://www.etenders.gov.za/
- ClinicalTrials.gov registrations/updates from the past 12 months —
  recruitment failures and protocol amendments are problem signals.
- Peer-reviewed primary literature: NEJM, JAMA, Lancet, Nature Medicine —
  original research only, not reviews.
- Operator and practitioner blogs: Sensible Medicine, Out-Of-Pocket
  (Nikhil Krishnan), Health Tech Nerds, Eric Topol's Ground Truths.
- HIMSS, JPM Healthcare, ViVE conference programmes — session titles track
  operator pain.
- Search strategies: `RFP "interoperability" OR "prior authorization" state health`,
  `site:reddit.com/r/healthIT [workflow complaint]`

## Avoid

Wellness-influencer content, supplement-industry coverage, any source that
cannot be primary-document-verified.

## Degraded-mode index URLs (WebFetch fallback when WebSearch unavailable)

- https://oig.hhs.gov/reports-and-publications/
- https://www.gao.gov/health-care
- https://www.fda.gov/medical-devices
- https://www.sahpra.org.za/
- https://www.outofpocket.health/

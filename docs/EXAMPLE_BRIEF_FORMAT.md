<!--
  FORMAT REFERENCE — for synthesis agent use only.
  This document shows the exact section structure, tone, and depth every
  Tier 1 full brief must match. SENTINEL is a fictional example project
  used purely to demonstrate what correct content looks like in each
  section. Do not cite or reference SENTINEL in any output.
-->

# SENTINEL — real-time tier-2 supplier failure detection for mid-market manufacturers

## Master Overview Document

SENTINEL ingests customs clearance records, AIS vessel position data, and
supplier financial filings to produce 48-hour lead-time warnings on tier-2
supplier failure events. It delivers structured alerts to plant operations
teams at mid-market automotive and electronics manufacturers, allowing them to
activate alternate sourcing before a line stoppage occurs.

---

## Vision

> SENTINEL gives plant ops teams at mid-market manufacturers 48 hours of
> warning before a tier-2 supplier fails — before the tier-1 supplier knows.
> It does this by correlating shipping frequency anomalies, payment latency
> spikes, and OFAC screening hits across 14 public and semi-public data feeds,
> producing a single risk score per supplier updated every six hours.

---

## Why This Is Different

| Conventional approach | SENTINEL |
|-----------------------|----------|
| Quarterly supplier scorecards completed manually by procurement teams | Continuous signal ingestion updated every 6 hours from 14 sources |
| Tier-1 visibility only — tier-2 and tier-3 are opaque | Tier-2 mapped via AIS vessel tracking and UN Comtrade shipment records |
| Risk identified after a missed delivery event | 48-hour pre-failure warning based on payment latency + shipping frequency decay |
| Spreadsheet-based, no API integration into ERP | Webhook delivery into SAP MM and Oracle Procurement; no manual step |
| €0 upfront, but R2.4M average line stoppage cost per event | €14,400/yr SaaS; payback at one avoided event per 6 years |

---

## System Architecture

```
External feeds                     Core pipeline                Output
──────────────                     ─────────────                ──────
UN Comtrade API   ──┐
MarineTraffic AIS ──┤              ┌──────────────┐             ┌────────────────┐
D&B financial     ──┼─► Ingestor ─► Signal        ─► Scoring  ─► Alert          │
OFAC SDNL         ──┤  (Python)   │ Normaliser    │  Engine    │ Dispatcher     │
Customs EDI       ──┘  nightly    └──────────────┘  (rule +   └────────────────┘
                                   (Pandas,          ML hybrid)  │  Webhooks →
                                    DuckDB)                      │  SAP MM
                                                                 │  Slack
                                                                 │  Email
                                                                 ▼
                                                           ops_dashboard/
                                                           (React, FastAPI)
```

---

## Components

| File / Component | Responsibility | Inputs | Outputs |
|------------------|---------------|--------|---------|
| `ingestor/comtrade.py` | Pull monthly HS-code shipment volumes per supplier–country pair from UN Comtrade REST API | Supplier DUNS list, HS codes | `raw/comtrade/{supplier_id}/{YYYY-MM}.parquet` |
| `ingestor/ais.py` | Resolve supplier port calls from MarineTraffic AIS stream; flag vessels >14 days delayed | MarineTraffic WebSocket, supplier port roster | `raw/ais/{vessel_mmsi}/{date}.parquet` |
| `ingestor/dnb.py` | Fetch quarterly D&B PAYDEX score and days-beyond-terms delta per supplier | D&B Direct+ API, supplier DUNS list | `raw/dnb/{supplier_id}/{YYYY-QQ}.json` |
| `pipeline/normaliser.py` | Align all feeds to a common supplier–date index; forward-fill gaps ≤7 days | Raw parquet files | `normalised/{supplier_id}/signals.parquet` |
| `scoring/engine.py` | Compute composite risk score: 40% payment latency, 35% shipment frequency decay, 25% OFAC proximity | Normalised signals | `scores/{supplier_id}/{date}.json` |
| `alerts/dispatcher.py` | Emit webhook to SAP MM + Slack when score crosses threshold (default 0.72) | Score feed | SAP IDocs, Slack API calls |
| `dashboard/` | React + FastAPI UI showing risk heatmap, alert history, per-supplier signal breakdown | Score + alert DB | Browser |

---

## Algorithm Inventory

| Layer | Algorithm / Method |
|-------|--------------------|
| Shipment frequency anomaly | CUSUM (cumulative sum control chart) over 90-day rolling shipment volume; threshold at 2.5σ |
| Payment latency scoring | Z-score on PAYDEX delta vs 12-month supplier baseline; clipped at ±3 |
| AIS delay flag | Rule: vessel ETA slip >14 days on final leg to supplier port |
| OFAC proximity | BFS graph search depth-2 from supplier DUNS to any SDN entity via UBO registry; binary flag |
| Composite risk score | Weighted sum of normalised sub-scores; weights calibrated on 2018–2023 known-failure dataset (n=214 events, automotive sector) |
| Supplier graph | PageRank centrality on tier-1/tier-2 dependency graph to weight alerts by downstream exposure |

---

## Data Sources and Cost Reality

| Source | What it provides | Cost | Layer |
|--------|-----------------|------|-------|
| UN Comtrade REST API | Monthly HS-code export/import volumes by country pair | Free (500 req/day) | Tier-2 shipment proxy |
| MarineTraffic AIS (Vessel Tracking plan) | Real-time vessel position, ETA, port call history | €299/mo | Last-mile shipment delay |
| Dun & Bradstreet Direct+ (PAYDEX) | Supplier payment behaviour score, days-beyond-terms | $2,400/yr per 500 DUNS | Payment latency |
| OFAC SDNL (sanctions list) | Sanctioned entities and their known aliases | Free (bulk download) | Sanctions proximity |
| Customs EDI (importer-provided) | Actual PO-level shipment confirmations | Customer-supplied | Ground truth reconciliation |
| Failure label dataset | 214 confirmed supplier failure events 2018–2023, auto sector | Internal (assembled from public insolvency filings) | Model training only |

---

## Anchor Wedge

Automotive tier-1 suppliers in South Africa operating 40–60 active tier-2
suppliers across Southeast Asia and Eastern Europe. Target buyer: supply chain
risk manager at a manufacturer with R800M–R3B annual procurement spend.

The pain is acute and measurable: a single tier-2 failure causing a line
stoppage at an SA automotive plant costs R2.4M per day in lost production
(based on published NAACAM line-rate figures). The tier-1 supplier typically
receives no warning until the missed delivery — because they monitor tier-2
manually, by phone, on a quarterly cadence.

First reachable accounts: 11 SA-headquartered tier-1 automotive suppliers
identified from NAACAM membership directory, each with documented tier-2
supplier networks in the ITAC import data.

---

## What Makes This Commercially Valuable

- **Supply chain risk managers pay for prevention, not reporting.** The buyer
  is not the CFO; it is the plant ops or procurement lead who gets fired when
  a line stops. They have budget and discretionary authority up to ~$50K/yr.
- **Switching cost is high once integrated.** After SAP MM webhook integration,
  SENTINEL's alert history becomes part of the ops team's incident record.
  Migration is a project, not a cancellation.
- **Data compounds.** Each customer's confirmed/rejected alerts become labelled
  training data. 24 months of production use produces a failure-prediction
  dataset no competitor can replicate without the same customer base.
- **The wedge expands naturally.** Tier-1 supplier → tier-2 → tier-3. Same
  algorithm, wider graph. Customer value increases without additional sales
  motion.
- **SA wedge is replicable.** NAACAM directory gives a named, reachable set of
  11 first accounts. Same playbook applies to Kenya EPZ manufacturers
  (KEPZA directory) and Nigerian FMCG tier-1 suppliers (MANSA registry).

---

## What This Is Not

- Not a procurement platform. SENTINEL does not manage POs, RFQs, or supplier
  onboarding. It reads from procurement systems; it does not replace them.
- Not a supplier portal. Suppliers do not log in. SENTINEL is a monitoring
  tool for the buyer, not a collaboration layer.
- Not a payments or financing product. PAYDEX data is an input signal only.
- Not a consultancy or managed service. All data ingestion, scoring, and alert
  delivery is automated. No analyst layer.
- Not a general-purpose supply chain visibility platform. Scope is limited to
  early-warning on supplier failure. Inventory optimisation, demand forecasting,
  and logistics routing are out of scope.

# OMNIGEN — Spatiotemporal Oncology Intelligence Engine
## Master Overview Document

---

## Vision

OMNIGEN treats a tumor as a **living, evolving adversary** operating inside a spatially constrained physical environment. Treatment fails not because the drug is wrong, but because the tumor's resistant subpopulations are physically shielded from the drug by the microenvironment's own structure — and because every treatment creates selection pressure that accelerates the evolution of those subpopulations.

The core thesis:

> Every treatment is a selection event.
> Every selection event reshapes the clonal landscape.
> Every proposed counter-treatment must be validated against the tumor's known biological escape routes before it is recommended.

This is not a survival prediction model with an agent bolted on. The coupled physics-biology simulation *is* the system. Everything else — clonal tracking, adversarial debate, treatment optimization — derives from the spatiotemporal dynamics of tumor evolution and drug delivery.

---

## Why Existing Approaches Fail

| Conventional Oncology ML | OMNIGEN |
|---|---|
| Predicts outcomes from static snapshots | Models dynamic clonal evolution over time |
| Treats tumor as homogeneous | Models spatial heterogeneity as the primary resistance mechanism |
| Drug efficacy = scalar response probability | Drug efficacy = spatially resolved concentration field via physics PDE |
| Ignores immune microenvironment | Immune cell populations are first-class graph nodes |
| One model, one prediction | Multi-agent adversarial debate before any protocol is recommended |
| Validated on population statistics | Forward-simulates proposed treatment on the specific patient's tumor model |
| No constraint on biological plausibility | Every agent claim requires Reactome/OmniPath pathway citation |
| Backtests on full historical data | Strict clinical point-in-time integrity — no future data ever used |

---

## System Architecture

```
╔══════════════════════════════════════════════════════════════════════╗
║               LAYER 0 — CLONAL DYNAMICS ENGINE                       ║
║                                                                      ║
║  Longitudinal VAF time series (TRACERx / GENIE BPC)                 ║
║  Stochastic Lotka-Volterra clonal competition model                  ║
║  Bayesian inference (pymc) → per-clone growth rate posteriors        ║
║  Trigger: resistant clone selection coefficient crosses threshold     ║
╚═══════════════════════════╦══════════════════════════════════════════╝
                            │  TRIGGER: clone under positive selection
                            ▼
╔══════════════════════════════════════════════════════════════════════╗
║          LAYER 1 — TUMOR MICROENVIRONMENT GRAPH                      ║
║                                                                      ║
║  Spatial transcriptomics (10x Visium HD / Xenium Prime 5K)          ║
║  Cell type deconvolution: cell2location (scvi-tools)                ║
║  Spatial domain detection: cellcharter                              ║
║  Heterogeneous PyG graph: tumor · immune · vascular nodes           ║
║                                                                      ║
║  ┌─────────────────────────────────────────────────┐               ║
║  │  XPINN Physics Solver (deepxde)                  │               ║
║  │  ∂C/∂t = ∇·(D(x)∇C) − λ(x)C − R(x,C)          │               ║
║  │  Drug concentration field over spatial graph     │               ║
║  │  Domain decomposition for heterogeneous D(x)     │               ║
║  └─────────────────────────────────────────────────┘               ║
╚═══════════════════════════╦══════════════════════════════════════════╝
                            │  INPUT: spatial drug concentration field
                            ▼
╔══════════════════════════════════════════════════════════════════════╗
║         LAYER 2 — ADVERSARIAL MULTI-AGENT CORE                       ║
║                                                                      ║
║  Blue Team:                                                          ║
║    Clonal Pathologist  ─── analyzes clone dynamics from Layer 0     ║
║    Spatial Pharmacologist ─ analyzes diffusion failure from Layer 1  ║
║                                                                      ║
║  Red Team:                                                           ║
║    Tumor Adversary ──────── queries OmniPath graph for escape routes ║
║    Biology Constraint Validator ── rejects uncited claims            ║
║                                                                      ║
║  Synthesis Agent ────────── Pareto front of dosing protocols         ║
╚═══════════════════════════╦══════════════════════════════════════════╝
                            │  PROPOSED PROTOCOL
                            ▼
╔══════════════════════════════════════════════════════════════════════╗
║         LAYER 3 — TREATMENT VALIDATION ENGINE                        ║
║                                                                      ║
║  Forward simulation: run proposed protocol through Layers 0 + 1     ║
║  Simulate 6-month treatment course on patient's tumor model          ║
║  Predict VAF trajectory under proposed treatment                     ║
║  Gate: resistant clone growth rate must become negative              ║
║  If gate fails → protocol rejected back to Blue Team                 ║
╚═══════════════════════════╦══════════════════════════════════════════╝
                            │  VALIDATED PROTOCOL
                            ▼
╔══════════════════════════════════════════════════════════════════════╗
║         CALIBRATION AGENT (post-hoc, async)                          ║
║                                                                      ║
║  Compares predicted resistance mechanism vs. actual clinical outcome ║
║  Flags protocols that were right for wrong biological reasons        ║
║  Feeds back into agent system prompt calibration                     ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Components

| File | Component | Core Function |
|---|---|---|
| `01_clonal_dynamics.md` | Clonal Dynamics Engine | Lotka-Volterra model, Bayesian VAF inference, clone trigger |
| `02_tme_graph.md` | Tumor Microenvironment Graph | Spatial transcriptomics ingestion, cell2location, cellcharter, PyG graph |
| `03_physics_solver.md` | XPINN Drug Diffusion | Reaction-diffusion PDE, domain decomposition, D(x) parameterization |
| `04_adversarial_agents.md` | Multi-Agent Adversarial Core | Agent roles, OmniPath constraint validation, debate protocol |
| `05_treatment_validation.md` | Treatment Validation Engine | Forward simulation, protocol gate, Pareto optimization |
| `06_data_infrastructure.md` | Data Layer | TRACERx, GENIE BPC, 10x Genomics, OmniPath, PIT integrity |
| `07_backtesting.md` | Clinical Backtesting Engine | Cohort selection, PIT enforcement, propensity scoring, validation |
| `08_research_agenda.md` | Open Research Questions | Unresolved hypotheses, go/no-go empirical gates |
| `09_build_roadmap.md` | Implementation Plan | Phases, dependencies, milestones, gate criteria |

---

## Algorithm Inventory

| Layer | Algorithms |
|---|---|
| Clonal dynamics | Stochastic Lotka-Volterra ODEs, Bayesian inference (NUTS sampler, pymc) |
| Spatial graph | Heterogeneous GNN (PyTorch Geometric), cell2location deconvolution, cellcharter domain detection |
| Physics solver | Extended PINNs (XPINNs) with domain decomposition, FEniCSx fallback for forward validation |
| Drug PK/PD | Two-compartment ODE pharmacokinetic model, receptor occupancy pharmacodynamics |
| Adversarial agents | Structured multi-agent debate, OmniPath/Reactome tool-use validation |
| Treatment optimization | NSGA-II multi-objective optimization (pymoo), Pareto front generation |
| Forward simulation | Coupled ODE + PINN forward integration, VAF trajectory prediction |
| Backtesting integrity | Point-in-time enforcement, propensity score matching, outcome blackout |
| Calibration | Post-hoc mechanism comparison, agent reasoning audit trail |

---

## Data Sources and Cost Reality

| Source | What It Provides | Cost | Layer |
|---|---|---|---|
| 10x Genomics public datasets | Visium HD + Xenium LUAD spatial transcriptomics | $0 | Layer 1 |
| TRACERx (Francis Crick / EGA) | Multi-region serial liquid biopsy, LUAD longitudinal VAF | Free (DUA required) | Layer 0 |
| GENIE BPC NSCLC v2.0 (Synapse) | 1,846 NSCLC patients, pre/post-treatment paired samples | Free (DUA required) | Layer 0 + Validation |
| TCGA-LUAD (GDC Portal) | Bulk RNA-seq, WES mutation calls, CNV, clinical data | $0 | Layer 0 + Validation |
| OmniPath (local PostgreSQL) | Integrated signaling network: Reactome + SIGNOR + STRING | $0 | Layer 2 |
| DrugBank (academic) | Drug targets, mechanisms, EGFR-TKI pharmacology | Free (registration) | Layer 1 + 3 |
| FDA pharmacology reviews | PK parameters for erlotinib, osimertinib, gefitinib | $0 | Layer 1 |
| TEMULATOR (synthetic) | Simulated clonal evolution trajectories for Layer 0 bootstrap | $0 | Layer 0 |
| Anthropic API | Multi-agent debate (Haiku for specialists, Sonnet for Red Team/Synthesis) | ~$0.03–0.08/simulation | Layer 2 |

Total infrastructure cost: $0/month. Anthropic API cost during development: <$2/day at 20 simulations/day.

---

## Anchor Cohort: EGFR-TKI Resistance in LUAD

OMNIGEN is scoped to lung adenocarcinoma (LUAD) with EGFR-TKI treatment as the Phase 0–3 validation cohort. This is deliberate and follows the same philosophy as NEXUS scoping to semiconductors first.

**Why LUAD / EGFR-TKI:**
- EGFR inhibitor resistance mechanisms are the best-characterized in oncology: T790M (63% of 1st/2nd-gen failures), MET amplification (16%), C797S (6% first-line osimertinib), HER2 amplification (2%), small-cell transformation (3–15%)
- Ground truth exists: FLAURA trial biomarker data provides resistance prevalences and timelines (mPFS 18.9 months for osimertinib first-line)
- Spatial transcriptomics data is available: 10x Genomics hosts free Visium HD and Xenium LUAD datasets
- Longitudinal mutation data exists: TRACERx LUAD and GENIE BPC NSCLC cohorts
- The 6-class resistance label set is well-defined and clinically actionable

**Resistance label set for validation:**
1. C797S (EGFR tertiary mutation)
2. MET amplification
3. HER2 amplification
4. PI3K/BRAF/KRAS pathway activation
5. Small-cell transformation (ASCL1/NEUROD1 lineage switch)
6. No detected mechanism (unknown resistance)

---

## What Makes This Commercially Valuable

- **Pharma clinical trial design**: Run OMNIGEN against a synthetic cohort before enrolling Phase II patients — predict resistance timeline and most likely escape route, de-risk trial design
- **Computational oncology labs**: Open research tool for tumor evolution modeling; publishable architecture (no equivalent open-source system exists)
- **Precision oncology platforms**: Treatment decision support layer for institutions running molecular tumor boards
- **Drug combination screening**: Model whether a proposed combination closes the Red Team's escape routes before in-vitro testing
- **Biotech/diagnostics**: Liquid biopsy interpretation — given this VAF trajectory, what is the probability of each resistance mechanism and when?

---

## What This Is Not

- A survival prediction model (OMNIGEN models mechanism, not prognosis)
- A drug discovery system (OMNIGEN optimizes existing approved drug combinations)
- A clinical decision system (OMNIGEN is a research and decision-support tool, not a medical device)
- Dependent on proprietary hospital data (all anchor data is public or DUA-accessible at zero cost)
- A one-shot build — this is a research program with compounding value as the clonal dynamics model accumulates validation data

---

## Relationship to NEXUS

OMNIGEN and NEXUS share a common design philosophy:

| Design Principle | NEXUS | OMNIGEN |
|---|---|---|
| Core abstraction | Market as causal graph | Tumor as evolving spatial adversary |
| Primary signal | Network perturbation propagation | Clonal selection under drug pressure |
| Adversarial validation | 6 red team agents destroy signals | Red Team agent finds biological escape routes |
| Physics layer | None | XPINN reaction-diffusion PDE |
| Forward simulation | Paper trading before live | Treatment validation before protocol output |
| Integrity constraint | Point-in-time financial data | Clinical observation-date enforcement |
| Anchor scope | Semiconductor supply chain | LUAD / EGFR-TKI resistance |
| Multi-agent debate | 5 agents, financial domain | 4 agents + validator, oncology domain |

Both systems refuse to output a recommendation until it has been adversarially stress-tested. That property — not the domain — is what defines the architecture.

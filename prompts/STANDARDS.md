# STANDARDS — The Quality Bar

Every agent in research-scout must read this document before scoring any
finding or writing any brief. The standards are absolute. Do not relax
them because a candidate idea is "interesting" or "topical".

The reference briefs `docs/NEXUS_OVERVIEW.md` and `docs/OMNIGEN_OVERVIEW.md`
are the canonical examples. Match their depth, specificity, and tone.

---

## 1. Non-negotiables

A candidate idea must satisfy **every** item below. Failing any one is an
automatic discard, regardless of how strong the rest looks.

1. **A real, identifiable problem.** The brief names a specific person,
   role, or organisation that has this problem today, and describes the
   pain in concrete terms. "People struggle with X" is not a problem
   statement. "Mid-cap regional banks running [system] hit [specific
   failure mode] during [specific event]" is.
2. **A primary source.** At least one citation must be a primary document
   — a filing, a paper, a transcript, a regulation. Aggregator coverage
   does not count.
3. **A defensible "why now".** The brief explains what changed in the
   last twelve months that makes this problem solvable or urgent now,
   when it was not before. "AI is improving" is not a why-now.
4. **Technical leverage.** The brief identifies a specific technical
   capability — algorithm, dataset, regulatory change, infrastructure
   shift — that gives a builder an asymmetric edge. Generic "use LLMs"
   is not leverage.
5. **A wedge.** The brief names the narrowest possible first customer or
   use case the project would attack. No "platform plays". No
   "horizontal infrastructure" without a vertical wedge.

## 2. Positive signals

These do not gate inclusion but materially raise the score. The synthesis
agent should be able to point to specific evidence for each it claims.

- **Contrarian framing.** The brief argues for something that incumbents,
  consensus media, or category analysts have explicitly dismissed or
  ignored. Identify the consensus position and where it is wrong.
- **Compounding data advantage.** Doing the work generates a proprietary
  dataset that the next iteration of the product is better because of.
- **Regulatory tailwind.** A recent or pending rule change shifts the
  cost curve in the project's favour. Cite the rule.
- **Asymmetric distribution.** A non-obvious channel — a specific
  conference, a specific community, a specific procurement vehicle —
  gives unusual reach.
- **Founder-market fit hook.** The brief identifies the kind of operator
  who would be uniquely qualified to attack this, and explains why.
- **South African or broader African context** gives a unique and
  underserved angle — a problem unsolved in SA but solved elsewhere, or
  a problem uniquely acute in SA (grid instability, private health
  insurance fragmentation, JSE microstructure, informal economy fintech)
  counts as a strong positive signal.

## 3. Disqualifiers

These are automatic discards. No exceptions.

- **No primary source.** All citations are secondary or aggregator.
- **Saturated category.** The space already has well-funded incumbents
  attacking the exact same wedge with the exact same approach.
- **Regulatory blocker.** A current rule makes the proposed approach
  illegal in the wedge market, and there is no credible path to change.
- **Solved by an obvious adjacent player.** A hyperscaler, an EHR
  vendor, a core banking system, or an ISO/RTO would ship the feature
  within twelve months as a side effect of their roadmap.
- **Founder economics broken.** Even at full success, the unit economics
  cannot support a venture-scale or sustainable-cashflow outcome.
- **Pure trend chasing.** The brief's why-now is "[hot topic] is hot".

## 4. Scoring dimensions

The synthesis agent scores each candidate on these five axes. Use them
to tag findings and to justify tier decisions in the brief itself.

- **Problem clarity.** How specifically is the problem named?
- **Evidence strength.** How primary, recent, and converging are the
  sources?
- **Contrarian signal.** How far is this from consensus?
- **Market size hint.** Is there evidence the wedge expands into a real
  market, even if today's wedge is small?
- **Technical leverage.** How asymmetric is the proposed capability?

## 5. Required output format — full brief

Every Tier 1 brief must contain these sections, in this order, matching
the depth and specificity of the reference briefs in `docs/`:

1. `# {PROJECT_NAME} — {one-line descriptor}`
2. `## Master Overview Document`
3. `## Vision` — what the project does and for whom, in operator-readable terms.
4. `## Why Existing Approaches Fail` — the consensus position and where it breaks.
5. `## System Architecture` — components, data flow, interfaces.
6. `## Components` — each named component, its responsibility, its inputs and outputs.
7. `## Algorithm Inventory` — the specific algorithmic or methodological choices.
8. `## Data Sources and Cost Reality` — exactly which data, where from, what it costs.
9. `## Anchor Wedge` — the narrowest first customer or use case.
10. `## What Makes This Commercially Valuable` — the path from wedge to category.
11. `## What This Is Not` — the explicit non-goals.
12. `## Sources` — every citation, with URL and access date.

## 6. Required output format — concept note

Concept notes are shorter. Required sections:

1. `# {PROJECT_NAME} — concept`
2. `## Problem`
3. `## Why now`
4. `## Hypothesis`
5. `## What would make this a full brief`
6. `## Sources`

## 7. Tone

Operator-grade. No marketing language. No hedging adjectives ("powerful",
"innovative", "cutting-edge"). Concrete nouns, specific numbers, named
entities. If a sentence could appear in a generic pitch deck, rewrite it.

# STANDARDS — Findings Quality Bar

Every domain agent must read this document before writing any finding.
Apply it as a hard filter. Do not surface a finding that fails a
non-negotiable. Do not relax the bar because a topic is timely or
interesting.

---

## 1. Non-negotiables

A finding must satisfy **every** item below. Failing any one is a discard.

1. **A real, identifiable problem.**
   Name a specific person, role, or organisation experiencing the problem
   today. Describe the pain in concrete terms.
   - PASS: "Community health centres using Epic's MyChart module cannot
     reconcile same-day billing adjustments without manual intervention,
     causing ~3-day revenue cycle delays. (Source: OIG Report OEI-09-23-00040)"
   - FAIL: "Healthcare providers struggle with billing inefficiencies."

2. **A primary source.**
   At least one citation must be a primary document. Primary means the
   organisation or individual who generated the underlying data wrote or
   published it directly.
   - PASS: SEC 10-K filing, FDA guidance document, earnings call transcript,
     peer-reviewed original research paper, SARB prudential circular,
     NERSA tariff application, OIG report, CMS final rule.
   - FAIL: TechCrunch article citing the filing. LinkedIn post summarising
     the paper. "Industry analysts estimate..." without a named source.
   - FAIL: A secondary outlet quoting the primary. Fetch the primary itself.

3. **A defensible why-now.**
   Explain what changed in the last 12 months that makes this problem newly
   visible, newly acute, or newly tractable. The change must be named and
   dated.
   - PASS: "CMS finalized the interoperability rule (CMS-0057-F, Jan 2024)
     requiring payers to expose claims data via FHIR APIs by Jan 2027,
     creating a hard deadline that did not exist before."
   - FAIL: "AI is improving and making this easier."
   - FAIL: "This has been a problem for years and is getting worse."

---

## 2. Disqualifiers

These are automatic discards regardless of how strong the rest looks.

- **No primary source.** All citations are secondary or aggregator.
- **Pure trend chasing.** The why-now is "[topic] is trending" with no
  concrete, dated change.
- **Already a commodity.** The exact problem is already publicly solved by
  a well-documented, widely-adopted tool or workflow.

---

## 3. Positive signal tags

These do not gate inclusion. Tag each finding with any that apply. They
help the human reader prioritise which findings to investigate further.

- `contrarian` — the finding points to something incumbents, analysts, or
  consensus media have explicitly dismissed or ignored.
- `sa-angle` — the problem is uniquely acute or uniquely unsolved in South
  Africa (grid instability, private health insurance fragmentation, JSE
  microstructure, informal economy fintech, SAHPRA delays).
- `regulatory-shift` — a named rule change or pending regulation is
  directly driving the problem or creating a new constraint.
- `data-moat` — whoever addresses the problem will accumulate data that
  is hard to replicate.

---

## 4. Finding output format

Each finding in the output file must contain these fields, in this order:

```
## {Short descriptive title}

**Problem:** One to three sentences. Named role/org + specific pain +
concrete consequence.

**Source:** Full citation — URL or document reference + publication date.

**Why now:** One to three sentences. Named change + date + effect.

**Tags:** Space-separated list from section 3. Omit if none apply.
```

Minimum 8 findings per domain per run. If fewer than 8 credible findings
exist, note the gap explicitly rather than padding with weak findings.

---

## 5. Tone

Operator-grade. Concrete nouns. Specific numbers. Named entities. No
marketing adjectives ("innovative", "powerful", "cutting-edge"). No
hedging ("may", "could potentially", "might be relevant to"). If a
sentence could appear in a generic pitch deck, rewrite it or cut it.

# Three-slide competition outline

Use 16:9, large text, captions, and only redacted synthetic screenshots. Replace
all placeholders before recording.

## Slide 1 — Trust breaks between AI output and release

**Headline:** Agents can build; accountable humans still decide what ships.

**Visual:** Left: self-declared Claude-assisted synthetic PR. Center: three
unresolved cards (`dependency fail`, `authorization marker fail`, `retention
unknown`). Right: release manager.

**Evidence strip:** Anonymized research found two direct release-validation
cases, with adjacent AI-governance evidence across nine accounts and traceable
legal/compliance evidence across five. Counts validate the problem, not demand
for this exact solution; no customer names, quotes, or links.

**Speaker line:** “The hard problem is not who typed the code. It is whether the
exact change earned evidence and an accountable decision.”

## Slide 2 — AgentProof's commit-bound control loop

**Headline:** Deterministic evidence, specialist context, explicit decision.

**Visual:** One horizontal flow:

```text
PR head SHA → no-secret collectors → protected-base policy → AgentProof / gate
          ↘ Test / Security / Policy sessions → mutable Evidence Board
          → human remediation or bounded exception → new SHA invalidation
          → independent PR approval → merge
```

Add two live screenshots: red check with full SHA and final green check/review.
Caption: “GitHub is authoritative; the canvas is a mutable coordination view.”

**Speaker line:** “Agents explain same-SHA facts, deterministic code computes
the gate, and a different human approves.”

## Slide 3 — Reusable, governed, and honestly bounded

**Headline:** A field kit customers can adapt without copying customer data.

**Visual:** Plugin box (four agents, two skills, Evidence Board), three versioned
automation prompt cards, protected-policy/customer-adaptation template, and
metrics row.

**Competitive callout:** “Claude Code and Copilot both edit code and use MCP.
Here, the Copilot App demonstrates fewer lifecycle seams across parallel
sessions, reusable UI, remediation, checks, reviews, and GitHub rules—not
superior code generation.”

**Limit/product-feedback callout:** Personal automations live outside Git; deep
links require confirmation; canvas is mutable; external provenance may be
self-declared/unknown. Proposals: signed assistance attestation, native
commit-bound release evidence, locked/exportable canvas snapshots, typed
multi-agent aggregation, and versioned/admin-visible automations.

**Speaker line:** “The green result is bounded to this repository, policy, and
SHA; it is evidence, not universal compliance or provenance.”

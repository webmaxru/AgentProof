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
          ↘ confirmed manual Test / Security / Policy sessions
           → manual Evidence Assembler → mutable Evidence Board
          → human remediation or bounded exception → new SHA invalidation
          → independent PR approval → merge
```

Add two live screenshots: red check with full SHA and final green check/review.
Caption: “GitHub is authoritative; the canvas is a mutable coordination view.”

**Validated badge:** “2026-09-02: PR-triggered Analysis/Publish produced the
SHA-bound gate, artifact, and PR summary in the private live repo; plugin
installed from `msft-common-demos/AgentProof:plugin`.”

**Speaker line:** “Manually launched read-only agents explain same-SHA facts,
deterministic code computes the gate, and a different human approves.”

## Slide 3 — Reusable, governed, and honestly bounded

**Headline:** A field kit customers can adapt without copying customer data.

**Visual:** Plugin box (four agents, two skills, Evidence Board), three versioned
prompt cards labeled **FUTURE AUTOMATION SETUP / PRODUCT FEEDBACK**,
protected-policy/customer-adaptation template, and metrics row.

**Competitive callout:** “Claude Code and Copilot both edit code and use MCP.
Here, the working prototype demonstrates a GitHub-centered handoff across
manually started isolated sessions, reusable UI, remediation, checks, reviews,
and GitHub rules—not superior code generation.”

**Limit/product-feedback callout:** The working MVP has manual reviewers and a
manual assembler. On 2026-09-02, installed AgentProof agents were absent from
the New PR automation picker, which showed only Default and msx; tools defaulted
to All tools with no safe clear-all path, so setup was canceled. Deep links
require confirmation; canvas is mutable; external provenance may be
self-declared/unknown. Proposals: safe least-privilege presets, signed assistance
attestation, native commit-bound release evidence, locked/exportable canvas
snapshots, typed multi-agent aggregation, and versioned/admin-visible
automations.

**Speaker line:** “The green result is bounded to this repository, policy, and
SHA; it is evidence, not universal compliance or provenance.”

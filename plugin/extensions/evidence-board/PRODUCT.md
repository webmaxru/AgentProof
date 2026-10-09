# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user (inferred from the explicit redesign brief and repository roles): a release manager reviewing a pull request before a go/no-go decision.

Supporting users: engineering leads triaging remediation, and test, security, or policy reviewers inspecting the evidence behind a finding.

## Product Purpose

The Evidence Board turns commit-bound release evidence into an operational review workspace. Success means a release manager can identify the current gate state, understand which findings require action, inspect the supporting evidence, and draft an exact human disposition command without confusing mutable coordination state with GitHub's authoritative record.

## Positioning

Every displayed finding, reviewer note, and proposed disposition is scoped to one repository, pull request, protected policy, and full head SHA. The board makes stale or mismatched evidence visible rather than smoothing it into a generic release score.

## Operating Context

The board is opened after deterministic GitHub analysis and read-only reviewer sessions produce a final evidence document. Users scan the release state, filter and select findings, inspect references and history, and prepare a human-submitted disposition. GitHub checks, comments, reviews, artifacts, repository rules, and commit SHAs remain authoritative.

## Capabilities and Constraints

- Preserve `pass`, `fail`, `unknown`, and `exception` as distinct evidence states.
- Bind evidence and draft dispositions to the full pull-request head SHA.
- Surface stale, expired, superseded, and edited-away dispositions without treating them as effective.
- Support filtering, search, evidence inspection, finding selection, and draft disposition generation.
- Never approve a pull request, accept an exception, merge, release, or claim a legal or compliance determination.
- Use synthetic demonstration data only; do not introduce secrets, customer data, tenant links, or private evidence.

## Evidence on Hand

- Final evidence documents and their SHA-bound projections.
- Finding references, reviewer notes, disposition history, and repository metadata.
- Existing Evidence Board implementation in `src/renderer.ts`.
- Existing automated validator, reducer, renderer, and integration tests.

No customer testimonials, production benchmarks, or compliance certifications are available and none may be fabricated.

## Product Principles

1. Decision state before explanation.
2. Blockers before passing evidence.
3. Exact scope and SHA are always visible.
4. Dense enough for real work, calm enough for high-stakes review.
5. Human authority and audit boundaries remain explicit.

## Accessibility & Inclusion

The dashboard must support keyboard navigation, visible focus, semantic controls, responsive layouts, light and dark host themes, high text contrast, and readable status communication that does not rely on color alone.

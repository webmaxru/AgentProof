# Continuity material: PRECOMPUTED / NOT LIVE

The main film is an **edited recording of a genuine synthetic scenario** and
is labeled `Recorded synthetic scenario | workflow waits omitted`. It never
claims that CI and human decisions ran live in 116 seconds.

A substituted earlier run, fixture, or static guide is different. For every
such fallback segment, keep this label visible for its entire duration:

```text
PRECOMPUTED / NOT LIVE - SYNTHETIC AGENTPROOF DEMO
```

Name the substitution in the narration or an unambiguous on-screen
explanation and in the sanitized shot log. A generated storyboard is not
product footage; a synthetic test is not an end-to-end GitHub run.

## Allowed sources, in order

1. A previous genuine synthetic AgentProof run, with its own correct
   repository/PR/SHA context and approved redactions.
2. The wholly synthetic [`demo/synthetic-findings.json`](../../demo/synthetic-findings.json)
   fixture, labeled as UI/test illustration, never as scanner output.
3. An explicitly editorial static guide that does not imitate a real check,
   comment, review, approval, or immutable record.

Never splice evidence from a different PR or SHA into the nominated scenario
and call it the same release decision. Never create plausible-looking GitHub
results or human actions that did not exist.

## When to use it

Fallback may explain an unavailable App surface or show a clearly separate
prior demonstration. Ordinary CI waits should instead be cut out of the
real recording and disclosed. Do not use fallback to conceal an incorrect
gate, ruleset, unauthorized decision, or unsafe reviewer tool boundary.

If the actual stale exception or human disposition is unavailable, use the
honest alternative in [the script](../video-script.md), then retime the voice
track and captions. Do not keep the original successful-path narration.

## Sanitized manifest

| File/source label | Type                                              | Full synthetic SHA or N/A | Capture UTC | Redactions | Segment | Narration change |
| ----------------- | ------------------------------------------------- | ------------------------- | ----------- | ---------- | ------- | ---------------- |
|                   | prior-real-run / synthetic-test / editorial-guide |                           |             |            |         |                  |

No private URLs, customer identifiers, tenant links, notifications, credentials,
or private evidence belong in this manifest. Preserve any required
non-shareable provenance only in approved storage.

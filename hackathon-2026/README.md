# AgentProof submission packet

This folder contains competition-specific material only. The product
documentation remains in the repository root and `docs/`; this packet is
deliberately isolated so the public project README can describe AgentProof
without event-specific positioning or deadlines.

## Contents

| Path | Purpose |
| --- | --- |
| `winning-criteria-matrix.md` | Judge-facing mapping from winning criteria to current product evidence, demo proof, and remaining actions. |
| `video-recording-guide.md` | Production plan, privacy controls, capture setup, live-demo procedure, fallback protocol, and post-production checklist. |
| `video-script.md` | A time-coded, voiceover-ready script for a 2:54 final cut. |
| `recording-checklist.md` | Printable go/no-go checklist for the presenter and editor. |
| `demo/storyboard.md` | Original shot storyboard and timing budget. |
| `demo/runbook.md` | Live validation and presenter runbook. |
| `fallback/README.md` | Rules for continuity footage and clearly labeled precomputed material. |
| `slides/outline.md` | Three-slide pitch outline and submission quality bar. |
| `assets/` | Generated title cards, captions, and draft media. |

## Recommended submission framing

**Working title:** AgentProof — Trustworthy Agentic Delivery

**One-sentence thesis:** AgentProof prevents AI-assisted changes from merging
until the exact commit has earned deterministic evidence and an accountable
human decision.

**Primary challenge fit:** Hack to Make Agents Trustworthy.

The strongest proof is a live red-to-green release decision:

1. An unsafe pull request fails on the current head SHA.
2. Deterministic collectors produce bounded findings without secrets.
3. Read-only specialist sessions explain the same-SHA evidence.
4. A release manager records a bounded, expiring decision only where policy
   allows it.
5. Remediation creates a new SHA and invalidates the old evidence.
6. Fresh evidence and an independent approval make merge available.

The packet never presents the mutable Evidence Board as an immutable audit
record. GitHub commits, checks, comments, reviews, rules, and artifacts remain
the authoritative record.

## Media status

The checked-in MP4 in `assets/` is a **silent precomputed draft** with
on-screen `PRECOMPUTED / NOT LIVE` labels. It is a timing and voiceover aid,
not the final proof. Replace its cue cards with the live GitHub/App capture
described in `video-recording-guide.md` before submitting.

No file in this folder should contain secrets, customer data, tenant links,
personal notifications, or unredacted account identifiers.

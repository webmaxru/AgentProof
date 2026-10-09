# Maximum-score evidence matrix

This matrix maps the official 100-point rubric and five-point bonus to visible,
testable AgentProof proof.

| Criterion                                              | Points | Judge-facing claim                                                                                        | Visible proof                                                                                                                                                       | Submission asset                                       |
| ------------------------------------------------------ | -----: | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Enterprise relevance and customer value                |     35 | Enterprise release leads need AI speed without losing accountability for the exact change that ships.     | Anonymized internal research signals, real synthetic PR, commit-bound gate, clear user and outcome.                                                                 | Video scenes 1-2; deck slides 1-2; summary.            |
| Repeatability and field usability                      |     20 | This is a field kit, not a one-off dashboard.                                                             | Marketplace plugin, four agents, two skills, canvas extension, setup guide, templates, synthetic scenario, adoption path.                                           | Video scene 6; deck slide 6; root README.              |
| Governance, security, Responsible AI, and human review |     20 | Agents explain and propose; deterministic controls and accountable humans decide.                         | Protected-base policy, no-secret analysis, distinct evidence states, current-SHA validation, bounded exceptions, independent review, GitHub authority boundary.     | Video scenes 4-5; deck slides 4-5; threat model.       |
| Competitive positioning against Claude Code            |     15 | The differentiator is the GitHub-native governed workflow, not a claim that one model writes better code. | Checks, artifacts, comments, reviews, rulesets, repository context, plugin agents, manual multi-agent review, Evidence Board.                                       | Video scene 7; deck slide 7; `CLAUDE-COMPARISON.md`.   |
| Storytelling and demo clarity                          |     10 | One user, one question, one proof: when the code changes, evidence must keep up.                          | 2:44 narrated demo, large type, persistent staged/synthetic label, exact SHA and PR, concise close.                                                                 | Master MP4, SRT, deck, stills.                         |
| Product feedback bonus                                 |      5 | Enterprise users need effective runtime permissions to match the automation picker.                       | Reproduced permission canary: 50 tools reduced to 21 read-only selections, but runtime still exposed mutation-capable tools; canary failed closed and was disabled. | Video scene 8; deck slide 8; product feedback summary. |

## Why the scenario is credible

The approved internal research pack found two direct release-validation cases,
adjacent AI-governance evidence across nine accounts, and traceable
legal/compliance evidence needs across five accounts. The data is anonymized
and supports the problem, not demand for this exact implementation.

The live synthetic repository produced a full-SHA-bound gate, artifact, and PR
summary. PR #2 remains an intentionally unsafe demo record. The current
submission uses that validated record plus staged Evidence Board visuals
generated from the checked-in evidence contract.

## Adoption path

1. Start with one approved synthetic or low-risk repository.
2. Review the protected-base policy with the customer's accountable owners.
3. Install the AgentProof plugin and keep specialist sessions read-only.
4. Enable deterministic checks and a required `AgentProof / gate`.
5. Add independent review and stale-approval dismissal.
6. Measure review effort, stale-decision rejection, explicit dispositions, and
   governed merge rate.
7. Expand only after permissions, data handling, and exception ownership are
   accepted.

## Success measures

| Measure                   | Definition                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| Evidence time             | Minutes from PR open to complete evidence for the current head SHA.                       |
| Review effort             | Human minutes spent locating facts and deciding next action.                              |
| Stale-decision rejection  | Prior-SHA evidence or dispositions rejected after a new commit.                           |
| Explicit disposition rate | Eligible unknown/exception findings with a current authorized decision.                   |
| Governed merge rate       | Merges with current evidence and required independent approval.                           |
| Unsafe-boundary rejection | Reviewer or automation runs stopped when effective permissions exceed the reviewed scope. |

Targets must be agreed with pilot teams before deployment. No measured customer
ROI, adoption lift, compliance result, or production deployment is claimed.

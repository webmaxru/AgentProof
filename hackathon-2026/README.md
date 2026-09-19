# AgentProof submission packet

This folder contains competition-specific material only. The product
documentation remains in the repository root and `docs/`; this packet is
deliberately isolated so the public project README can describe AgentProof
without event-specific positioning or deadlines.

## Contents

| Path                         | Purpose                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `winning-criteria-matrix.md` | Judge-facing mapping from winning criteria to current product evidence, demo proof, and remaining actions.                  |
| `video-recording-guide.md`   | Production plan, privacy controls, recorded-demo procedure, fallback protocol, and post-production checklist.               |
| `video-script.md`            | Complete 1:56 script: first-ten-second choreography, exact voiceover, source-footage requirements, and honest alternatives. |
| `video-strategy.md`          | Research-backed editorial choices, source limitations, hook selection, and a claim-to-proof ledger.                         |
| `recording-checklist.md`     | Printable go/no-go checklist for the presenter and editor.                                                                  |
| `demo/storyboard.md`         | Eight-scene edit decision list, per-scene word counts, and the 116-second timing budget.                                    |
| `demo/runbook.md`            | Live validation and presenter runbook.                                                                                      |
| `fallback/README.md`         | Rules for continuity footage and clearly labeled precomputed material.                                                      |
| `slides/outline.md`          | Three supporting editorial frames: opening contrast, proposed Microsoft value, and close.                                   |
| `assets/`                    | Labeled 1:56 silent animatic, full voiceover text/captions, source timeline, local renderer, and shot-log template.         |

## Current video direction

**Opening:** "The code changed. Should the old exception still count?"
By ten seconds, show an actual exception that has not expired but is stale
for the new commit. The second payoff is a green evidence gate that still
requires independent human approval.

The film targets **1:56**, with a hard **2:00** maximum from the project owner.
Its 234-word narration names release leads using Copilot, demonstrates the
product, states Microsoft's potential benefit, and proposes a measurable
pilot. [The matrix](winning-criteria-matrix.md) uses the exact five supplied
categories: Inspiration, Business Value, Customer Focus, Feasibility, and
Make Something. No category weights or win guarantee are assumed.

## Recommended submission framing

This section is a copy-ready draft for title, tagline, description, keywords,
challenge fit, and media. Confirm the actual fields and event-specific rules
in authenticated Innovation Studio before submitting. Earlier generic
platform defaults were not verified requirements for this event.

**Official references:** [Hackathon About
page](https://innovation-studio.microsoft.com/events/hackathon2026/page/about)
and [Executive
Challenges](https://innovation-studio.microsoft.com/events/hackathon2026/challenges/executive-challenges).

### Submission type and challenge

| Field               | Recommended value                                                                       |
| ------------------- | --------------------------------------------------------------------------------------- |
| Submission type     | **Project**                                                                             |
| Executive challenge | **Hack to Make Agents Trustworthy**                                                     |
| Challenge selection | Recommend this primary fit; confirm the event's actual selection and eligibility rules. |
| Project maturity    | Working prototype; final recorded end-to-end master and voiceover are still pending.    |
| Data used in demo   | Synthetic expense-approval data only                                                    |

### Title

**AgentProof: Trustworthy Agentic Delivery**

### Tagline

**Commit-bound evidence and accountable human decisions for AI-assisted software delivery.**

### Description

AI-assisted development can increase throughput while making release decisions
harder to defend. Reviewers see code, tests, and agent output, but may not know
whether the exact commit was evaluated under the intended policy or whether
an exception is still applicable after the code changes.

AgentProof is a model-neutral control loop for trustworthy agentic delivery.
When a pull request opens, a no-secret GitHub Actions analysis runs
deterministic test, dependency, retention, and origin collectors against the
pull-request head. A protected-base evaluator applies the policy from the
trusted base revision. The publisher validates the repository, pull request,
workflow, policy, artifact, and live head SHA before publishing the
`AgentProof / gate`, an evidence artifact, and a pull-request summary.
Unresolved `fail`, `unknown`, and `exception` states block.

After the check, manually launched read-only specialist sessions explain the
same-SHA evidence; they do not approve, merge, or remediate. Unsafe tool
boundaries must stop the session. A release manager may record only an
eligible, reasoned, expiring exception. Prior-SHA evidence and dispositions
do not apply to a new head; configured GitHub rules separately dismiss stale
approvals and require independent human review.

The result is not a chatbot and not a claim of universal compliance or
authorship. It is a GitHub-native control intended to support AI-assisted
engineering without removing human accountability. The planned video uses a
synthetic expense app: an unexpired exception becomes stale after a commit
change, fresh evidence and a new human decision satisfy the current gate,
and independent review remains required. Product footage and voiceover still
need recording. The unsafe-tool-boundary canary remains disabled.

### Keywords

`trustworthy AI, AI agents, agentic engineering, GitHub Copilot, GitHub Actions, software supply chain, release governance, SHA-bound evidence, human-in-the-loop, responsible AI, developer productivity, policy-as-code`

### Challenge fit

AgentProof directly addresses **Hack to Make Agents Trustworthy**. The
trustworthiness problem is operational: an organization needs to know whether
the exact AI-assisted change being released was evaluated, whether the
evidence is current, and whether a human decision is authorized and bounded.
AgentProof connects those questions to policy and repository enforcement,
building on GitHub's existing commit checks and review rules. It does not
determine authorship or make a legal or compliance decision.

The strongest challenge proof is the new-SHA transition. A remediation commit
does not inherit an old SHA-bound disposition. Current evidence is required,
and configured GitHub rules preserve the independent human-review boundary.

### Audience and user value

**Primary users:** release leads and reviewers on engineering teams using
GitHub and Copilot. Repository administrators and policy owners are supporting
stakeholders, not a substitute for naming the main user.

**User problem to validate:** evidence and decisions can be scattered, leaving
release leads to check whether they apply to the current code. Review effort
and customer demand have not yet been measured for this prototype.

**User outcome:** a release manager gets one current, commit-bound decision
surface; reviewers get bounded evidence; repository owners get a fail-closed
control that works with existing GitHub rules.

### Innovation and differentiation

- **Commit-bound, not prose-bound:** every finding, disposition, reviewer note,
  artifact, and gate is tied to the full pull-request head SHA.
- **Protected-base evaluation:** a pull request cannot weaken the policy used to
  evaluate itself.
- **Distinct evidence states:** `pass`, `fail`, `unknown`, and `exception` are
  preserved instead of hiding uncertainty behind a green result.
- **Human accountability with advisory context:** specialist agents explain
  evidence, but they cannot approve, merge, or override the deterministic gate.
- **Fail-closed host boundary:** the permission canary stops when hidden
  mutation capability remains visible, rather than presenting an unsafe
  automation as a success.
- **Honest scope:** GitHub records remain authoritative and the Evidence Board
  is explicitly mutable coordination state.

### Microsoft technology and architecture

AgentProof uses Microsoft and GitHub technology as part of the product
mechanism, not as decoration:

- GitHub Actions runs no-secret analysis and trusted publication workflows.
- GitHub checks, artifacts, pull-request comments, reviews, rulesets, and
  CODEOWNERS provide the enforcement and audit boundary.
- GitHub Copilot App/plugin surfaces provide isolated read-only specialist
  sessions, a manual assembler, and the Evidence Board canvas.
- Node.js, TypeScript, JSON Schema, SHA-256 canonicalization, and Vitest make
  the evidence contract reproducible and testable.

### Impact and measurement

Do not enter targets as achieved results. Capture a baseline and a trial, then
report the actual values in the final submission notes:

| Metric                    | Definition                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| Evidence time             | Minutes from pull-request open to complete same-SHA evidence.                                    |
| Human review effort       | Human minutes spent locating facts and deciding what to do.                                      |
| Pre-merge detection       | Material findings discovered before merge.                                                       |
| Explicit disposition rate | Percentage of `unknown` or eligible `exception` findings with a current, authorized disposition. |
| Stale-decision rejection  | Unauthorized or stale SHA-bound decisions rejected by the system.                                |
| Governed merge rate       | Merges with current evidence and independent approval.                                           |

The Microsoft business hypothesis is more confident adoption of GitHub and
Copilot workflows with less evidence chasing. No revenue, adoption, retention,
satisfaction, or time-saving result is claimed. The
[five-category matrix](winning-criteria-matrix.md) specifies a proposed
two-team pilot and measurements.

### Trust, safety, and limitations

- Analysis runs without secrets and with read-only repository access.
- Publication runs trusted base/default-branch code and validates live GitHub
  state before writing.
- Reviewer sessions are advisory and manually started in the supported MVP.
- Exceptions are eligibility-checked, authorized, reasoned, expiring, and
  bound to the current SHA.
- Prior-SHA evidence and dispositions do not apply to a new head; configured
  GitHub rules separately handle stale approvals.
- The system does not prove universal authorship, model provenance, legal
  compliance, security, privacy, or production suitability.
- The canvas is mutable and cannot replace GitHub's authoritative records.

### Demo video package

**Recommended upload name:** `agentproof-trustworthy-agentic-delivery.mp4`

**Planned story:** unexpired exception -> new commit -> stale result within
ten seconds -> named customer -> working evidence and protected policy ->
fresh B evidence and genuine B decision -> green gate but human approval still
required -> feasible integration -> proposed Microsoft value/pilot ->
accountability close.

**Current checked-in asset:** `assets/agentproof-silent-draft.mp4`. It is a
1920x1080, 30 fps, **116-second silent storyboard** with a persistent
`PRECOMPUTED / NOT LIVE` banner. It is not the final product demonstration.
The separate master needs actual GitHub/App footage and the presenter's
voiceover. Complete 234-word narration, rehearsal captions, and the source
timeline are in `assets/`.

**Duration:** target 1:56; hard maximum 2:00 from the project owner. Confirm
the actual upload container, size, caption, and accessibility rules in the
authenticated event form. Earlier five-minute/100 MB statements were not
verified event-specific requirements and must not be relied on.
The complete recording procedure is in
[video-recording-guide.md](video-recording-guide.md), and the voiceover is in
[video-script.md](video-script.md).

### Collaboration and project settings

Complete these account-controlled fields in Innovation Studio before final
submission:

| Field                    | Recommended choice                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Team                     | List only people who materially contributed; assign clear roles such as product/demo lead, engineering lead, and reviewer/governance lead. |
| Open to new team members | **No** for the final polished submission unless active recruitment is genuinely needed.                                                    |
| Open to invitations      | **No** after the demo story and ownership are stable.                                                                                      |
| Participation mode       | Select the actual mode used by the team; do not claim an in-person venue or partner participation that did not occur.                      |
| Challenge links          | Recommended primary fit: **Hack to Make Agents Trustworthy**; verify current event selection rules.                                        |
| Project visibility       | Use the visibility required by the event, but do not expose private repositories, tenant links, or personal notifications in media.        |
| Media                    | Upload the final recorded product video and any required stills only after privacy and event-rule review.                                  |

### Final submission checklist

- [ ] Title, tagline, and description match the actual final product/recording status.
- [ ] Keywords are entered as searchable terms, not a paragraph.
- [ ] Challenge fit and selection follow the actual current event rules.
- [ ] A separate recorded-product master replaces cue-card placeholders and contains voiceover and
      captions.
- [ ] The exported master is at most 120 seconds and meets separately verified upload rules.
- [ ] The unsafe and remediated full SHAs are visible and different.
- [ ] The final artifact digest and green gate match the final SHA.
- [ ] The actual independent-review requirement is shown; any claimed approval
      is a genuine independent human record.
- [ ] Baseline/trial metrics are actual observations, not targets.
- [ ] No secrets, customer data, tenant links, account details, or
      notifications appear.
- [ ] The final claims remain bounded to the repository, policy, and SHA.

The strongest proof is a recorded, genuine release-evidence sequence:

1. An unsafe pull request fails on the current head SHA.
2. Deterministic collectors produce bounded findings without secrets.
3. A human records a bounded, expiring A decision only where policy allows it.
4. Real remediation creates head B and requires fresh evidence.
5. A's exception remains unexpired but is stale and ineffective for B.
6. Fresh evidence and a new authorized decision can satisfy B's gate, but
   independent human review is still required.

The packet never presents the mutable Evidence Board as an immutable audit
record. GitHub commits, checks, comments, reviews, rules, and artifacts remain
the authoritative record.

## Media status

The checked-in MP4 in `assets/` is a **silent precomputed draft** with
on-screen `PRECOMPUTED / NOT LIVE` labels. It is a timing and voiceover aid,
not the final proof. Capture the genuine GitHub/App shots described in
`video-recording-guide.md`, add voiceover, and export a separately named
master before submitting. No completed source-shot log or voiced master is
claimed by this packet.

No file in this folder should contain secrets, customer data, tenant links,
personal notifications, or unredacted account identifiers.

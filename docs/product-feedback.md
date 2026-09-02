# Product feedback from the AgentProof prototype

These proposals record workflow friction, not promises of available product
features. Reproduce against the current Copilot App before submission because
the product changes quickly.

## 1. Verifiable, cross-tool assistance provenance

- **Reproduction:** submit equivalent changes from Copilot cloud activity,
  Claude-assisted local work, copied code, and human-only work; try to generate
  one trustworthy origin field.
- **Observed gap:** GitHub can attribute some first-party activity, while
  external assistance is self-declared or unknown. Code shape is not reliable
  authorship evidence.
- **Impact:** reviewers cannot consistently distinguish origin confidence from
  code/evidence quality, and manual declarations are easy to omit.
- **Workaround:** bounded `github-attributed | self-declared | unknown`
  classification that never changes the deterministic gate.
- **Proposal:** a signed, privacy-aware assistance-attestation envelope bound
  to repository and commit, supporting multiple tools and explicit `unknown`
  without inferring authorship.

## 2. First-class commit-bound release evidence and human attestation

- **Reproduction:** combine a Check Run, Actions artifact, PR comment command,
  review, policy digest, and exact SHA into one release decision.
- **Observed gap:** the proof is assembled across several GitHub objects and
  custom schemas; expiry and new-SHA invalidation require custom workflows.
- **Impact:** every field team must rebuild validation, binding, retention, and
  exception history.
- **Workaround:** versioned evidence JSON, canonical digest, strict PR command,
  stable required check, and scheduled revalidation.
- **Proposal:** a GitHub-native release-evidence object with schema/version,
  source/policy SHA, linked checks, signed human attestation, expiry,
  invalidation, ruleset integration, and export API.

## 3. Exportable or locked canvas snapshots

- **Reproduction:** load final evidence into Evidence Board, edit/clear it, then
  try to cite that exact state as the approved record.
- **Observed gap:** canvas state is intentionally mutable and is not a locked
  snapshot or signature.
- **Impact:** a useful collaboration view can be mistaken for audit evidence,
  or teams must capture screenshots that lack machine-verifiable binding.
- **Workaround:** persistent authority banner and links back to GitHub check,
  PR history, and hashed artifact.
- **Proposal:** user-confirmed immutable snapshot/export with source SHA,
  extension/version, timestamp, content digest, visibility/retention controls,
  and a link to—but not replacement for—native GitHub approval.

## 4. Native multi-agent result aggregation

- **Reproduction:** trigger independent test, security, and policy sessions for
  one PR and attempt to aggregate only their current-SHA structured results.
- **Observed gap:** three automations can run, but the prototype needs a manual
  Evidence Assembler and custom mixed-SHA validation.
- **Impact:** manual coordination adds latency and can combine obsolete results.
- **Workaround:** one marker per specialist, common schema/SHA, then a manual
  assembler that fails closed.
- **Proposal:** a governed aggregation primitive with typed child outputs,
  expected participant set, shared subject SHA, timeout/cancellation,
  partial/unknown semantics, provenance links, and human-confirmed publication.

## 5. Versioned, administrator-visible automations

- **Reproduction:** create a personal PR automation, then ask a repository
  administrator to review its prompt/version/tools from Git or transfer it when
  the owner leaves.
- **Observed gap:** automations are personal and stored outside Git; committed
  prompts are only setup inputs. Enterprise App settings and automation tool
  scope are separate.
- **Impact:** drift, ownership, review, recovery, and fleet inventory are
  harder in governed environments.
- **Workaround:** commit prompt templates and maintain a manual inventory of
  owner, repository, events, tool scope, prompt commit, and review date.
- **Proposal:** optional automation-as-code with review/approval, version
  history, effective-permission view, admin inventory, ownership transfer,
  policy constraints, and safe deep-link import that still requires
  confirmation.

## Feedback evidence to capture

For each end-to-end trial record product version/date, exact steps, expected and
actual behavior, non-sensitive screenshot or log, time/workaround cost, and
whether the proposal still applies. Do not submit customer identifiers,
secrets, or a claim that the gap is universal.

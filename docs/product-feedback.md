# Product feedback from the AgentProof prototype

These proposals record workflow friction, not promises of available product
features. Reproduce against the current Copilot App before submission because
the product changes quickly.

## 1. Installed plugin agents and safe automation permissions

- **Validation context:** on 2026-09-02, AgentProof `v0.1.0` was installed in
  Copilot App from the private `msft-common-demos/AgentProof` repository.
- **Exact reproduction:**
  1. Open the new **Pull request** automation flow.
  2. Observe configuration for `Opened` and `Synchronized`, **Require write
     access**, cloud execution, and path filters.
  3. Open the Agent picker. It lists only **Default** and **msx**; the installed
     AgentProof Test, Security, and Policy Reviewer agents are absent.
  4. Open the Tools picker. It defaults to **All tools selected**.
  5. Try to establish an explicit read-only/least-privilege scope. In the
     validated flow, no safe clear-all/select-none path is available.
  6. Cancel the draft. Confirm that no AgentProof automation was saved.
- **Expected:** select the exact installed AgentProof reviewer and build from no
  tools or a reviewed least-privilege preset, with the effective scope visible
  before confirmation.
- **Impact:** the intended reviewer identity cannot be preserved, and saving
  with an opaque all-tools default could grant capabilities the reviewer does
  not need. The three AgentProof automation templates therefore cannot be
  safely validated or represented as live.
- **Workaround:** use the installed AgentProof reviewers in manual, read-only
  sessions. Cancel every automation draft unless the custom reviewer and
  effective least-privilege tool scope are both verifiable. Keep publication and
  Evidence Assembler invocation human-controlled.
- **Product proposal:**
  - include installed plugin/custom agents in the automation Agent picker, with
    source, stable identity, and installed version;
  - add **Select none** plus administrator-reviewed presets such as
    **Read-only PR reviewer**, and show changes from the preset;
  - show a pre-save effective-permission preview that expands bundled/implicit
    tools, repository and write scope, MCP/network access, and denied
    capabilities; and
  - expose prompt, agent/plugin version, tool scope, owner, validation date, and
    status to repository/enterprise administrators, with export, history, and
    ownership-transfer support.

The safe default should be no capabilities. A deep link may prefill a draft but
must still require human review and confirmation.

## 2. Verifiable, cross-tool assistance provenance

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

## 3. First-class commit-bound release evidence and human attestation

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

## 4. Exportable or locked canvas snapshots

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

## 5. Native multi-agent result aggregation

- **Reproduction:** start independent manual test, security, and policy reviewer
  sessions for one PR and attempt to aggregate only their current-SHA structured
  results. The automation target is not currently validated.
- **Observed gap:** the MVP needs manual reviewer sessions, a manual Evidence
  Assembler, and custom mixed-SHA validation. The 2026-09-02 automation flow
  could not select the installed reviewer agents or establish a safe explicit
  tool scope.
- **Impact:** manual coordination adds latency and can combine obsolete results.
- **Workaround:** one marker per specialist, common schema/SHA, then a manual
  assembler that fails closed.
- **Proposal:** a governed aggregation primitive with typed child outputs,
  expected participant set, shared subject SHA, timeout/cancellation,
  partial/unknown semantics, provenance links, and human-confirmed publication.

## 6. Versioned, administrator-visible automations

- **Reproduction:** inspect a personal PR automation draft, then ask a repository
  administrator to review its prompt, custom-agent/plugin version, and effective
  tools from Git or transfer ownership. Cancel the draft rather than saving it
  when those details cannot be verified.
- **Observed gap:** any saved automation would be personal and stored outside
  Git; committed prompts are only setup inputs. Enterprise App settings and
  per-automation identity/tool scope are separate, and the validated draft did
  not provide enough visibility to pass the save gate.
- **Impact:** drift, ownership, review, recovery, and fleet inventory are
  harder in governed environments.
- **Workaround:** keep manual reviewer sessions as the MVP. For a future gated
  experiment, commit prompt templates and maintain an inventory of owner,
  repository, events, agent/plugin version, effective tool scope, prompt commit,
  validation result, and review date.
- **Proposal:** optional automation-as-code with review/approval, version
  history, effective-permission preview, administrator inventory, ownership
  transfer, policy constraints, and safe deep-link import that still requires
  confirmation.

## Feedback evidence to capture

For each end-to-end trial record product version/date, exact steps, expected and
actual behavior, non-sensitive screenshot or log, time/workaround cost, and
whether the proposal still applies. Do not submit customer identifiers,
secrets, private evidence, or a claim that the gap is universal. Do not describe
reviewer or scanner output as a legal or compliance determination.

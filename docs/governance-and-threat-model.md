# Governance and threat model

## Protected assets

- Integrity of `AgentProof / gate`.
- Binding among repository, PR, base policy, head SHA, findings, dispositions,
  and artifact digest.
- Human identity and independent approval.
- Workflow tokens, repository settings, and absence of secrets in untrusted
  execution.
- Confidentiality of customer and enterprise data.

## Trust boundaries

| Zone                                                             | Trust level          | Rule                                                                                                                                                                  |
| ---------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR code, package scripts, PR body, comments, and model prose     | Untrusted input      | Parse narrowly; execute only in a no-secret, read-only analysis job.                                                                                                  |
| Protected base workflows, scripts, evaluator, schema, and policy | Trusted enforcement  | CODEOWNERS and ruleset protect current orchestration and the immutable PR-base analyzer/evaluator/policy; keep both revisions explicit.                               |
| Public-packet specialists                                        | Advisory             | No callable tools; only approved public synthetic input and advisory fragment INPUT. Native identity, policy, artifacts and runtime proof belong to the trusted host. |
| Trusted public-packet host                                       | Trusted integration  | GET-only native source resolution, pinned CLI tool exclusion, native zero-tool/zero-call verification, and before/after freshness. No model self-attestation.         |
| Personal PR automation experiment                                | Untrusted capability | A disposable permission canary must inspect effective host tools before use. Any mutation-capable built-in stops the run; a human disables the trigger.               |
| Evidence Board                                                   | Mutable coordination | Never accepted as an approval, signature, or immutable audit record.                                                                                                  |
| Native GitHub commit/check/comment/review/artifact               | Authoritative record | Validate current state and SHA; retain/export according to approved policy.                                                                                           |

## Threats, controls, and residual risk

| Threat                                                          | Primary controls                                                                                                         | Residual risk / response                                                                                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR code steals secrets or writes to the repository              | No secrets, read-only token, ephemeral runner, `persist-credentials: false`, no write capability in analysis             | PR code still executes and may attack the runner/network or produce hostile logs. Use only synthetic data; add network isolation/egress controls for production.      |
| PR changes evaluator/workflow/policy to approve itself          | Publisher checks out protected base/default code and applies base policy; CODEOWNERS and ruleset protect paths           | A compromised admin/default branch remains trusted. Protect administrator accounts and audit bypass.                                                                  |
| Forged, replayed, or wrong artifact                             | Validate source workflow/repository/run, schema, PR, base/head SHA, artifact names/digests, and live head                | GitHub/service compromise is outside the prototype; fail closed on any ambiguity.                                                                                     |
| Old run overwrites a new result                                 | Per-PR concurrency, live-head resolution before publish, SHA-bound check/artifact                                        | Race defects are possible; acceptance tests must force overlapping updates.                                                                                           |
| Old PR base selects obsolete publication safeguards             | Current default-ref-bound orchestration/core validation and separate PR-base analyzer/evaluator/policy                   | Recheck repository/default ref, source attempt/controller and PR head/base/body before writes; changed state blocks rather than downgrades publication.               |
| Unauthorized or vague exception                                 | Exact PR-comment grammar, repository-permission check, eligibility, rationale/expiry bounds, comment digest, current SHA | Authorized users can still make poor decisions; require independent approval and periodic review.                                                                     |
| Accepted exception is edited, deleted, expires, or head changes | Immediate invalidation, bounded exact-run Analysis-to-Publisher dispatch, scheduled refresh, stale-SHA/body rejection    | Dispatch/scheduling outages can leave a pending gate. Verify comment and expiry paths live after rollout; a configured schedule alone is not evidence of enforcement. |
| Reviewer agent invents a pass or mixes SHAs                     | Deterministic gate is authoritative; preserve recorded `unknown`; reject missing, stale, or mixed-SHA packet inputs      | Prose may still be wrong. Humans follow evidence links and GitHub check, not the summary alone.                                                                       |
| Canvas is mistaken for audit evidence                           | Persistent banner and documentation: mutable operational view only                                                       | Screenshots can mislead; label synthetic contract fixtures and use GitHub authoritative records.                                                                      |
| Claimed model provenance is false                               | Only `github-attributed`, `self-declared`, or `unknown`; provenance does not affect verified gate facts                  | Universal authorship detection is unsolved and explicitly not claimed.                                                                                                |
| Dependency service/report is unavailable                        | Collector emits `unknown`; gate fails closed                                                                             | Availability can block merge. Establish an authorized, bounded outage process rather than silently passing.                                                           |
| Sensitive data leaks through prompt/comment/artifact/log        | Synthetic test data, bounded fields, no secrets, minimum logging, prompt review                                          | Production adoption needs data classification, retention, regional, and incident controls outside this kit.                                                           |
| Author or release decision-maker self-approves                  | Ruleset requires distinct human approval and dismisses stale reviews                                                     | Small teams need a documented independent-review rota or cannot use this control as designed.                                                                         |
| Automation picker hides effective built-in capabilities         | Disposable canary, explicit tool inventory, no mutation calls, disable-on-failure                                        | Historical hosts retained mutation/shell capability after picker narrowing. Reviewer automations remain blocked unless the effective boundary is verified.            |

The `0.2.1` broad repository-reading profiles are deprecated and unsupported.
The `0.3.0` [public-packet mode](public-packet-review.md) moves native resolution
and runtime enforcement to a separate trusted host; it does not make an App
picker an enforcement boundary. A native zero-tool run can still fail because
the reviewer refuses, output is malformed, or evidence changed. Keep that
failure; never promote a capability-only result into a completed review.
The legacy App automation/assembler paths remain blocked unless independently
enforced. No CLI result, declaration, or synthetic fixture proves App isolation.

## Least privilege

- **Analysis:** `contents: read` and PR metadata read only; no secrets.
- **Publisher:** artifact/content read plus only the check/PR-summary write scopes
  required to publish validated results; it never runs PR code.
- **Disposition/revalidation:** existing Actions/check write scopes invalidate
  the gate, dispatch read-only Analysis, wait boundedly for its native run, and
  dispatch Publisher without waiting under its gate lock. They never execute PR
  code, add credentials, or approve exceptions themselves.
- **Public-packet specialists:** zero callable tools, including reads. The
  trusted host verifies native repository/PR/policy/artifact identity and
  complete zero-tool/zero-call telemetry, then checks freshness again.
  The operator verifies exports and uses deterministic wrapping/assembly.
- **Legacy App reviewers/assembler:** unsupported broad-tool paths, not a
  fallback. Keep automations and unsafe manual launches blocked.
- **Permission canary:** use only in a disposable synthetic repository. It calls
  no tool when any mutation capability is present and is disabled after the
  validation.

Review the actual workflow `permissions` blocks and App tool selections; prose
cannot grant or constrain access.

## Human accountability

An exception acceptance is a native GitHub PR comment authored by an authorized
release manager, bound to a finding and exact SHA, with a reason and expiry.
It does not equal PR approval. A different reviewer evaluates the code and the
repository ruleset requires both independent approval and a green gate.

Emergency bypass, if the organization permits one, must be a separately
authorized break-glass process with reason, time, actor, incident/reference,
and retrospective review. It is not provided by the kit.

## Claims boundary

AgentProof reports whether configured evidence and disposition rules passed for
one revision. Scanners and agents do not make legal or compliance
determinations. No provenance, compliance, security, privacy, or suitability
claim is universal.

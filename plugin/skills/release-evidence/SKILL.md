---
name: release-evidence
description: Collect, verify, assemble, and explain SHA-bound AgentProof release evidence while preserving the deterministic fail-closed gate.
---

# Release evidence

Use this skill for one pull request when asked to collect, reproduce, inspect,
assemble, or explain AgentProof evidence.

## Authority boundary

The deterministic evaluator and current native GitHub records are authoritative;
this skill is a read-only runbook. It may prepare local evidence and explain
results, but it must never:

- post or accept a disposition, approve a pull request, merge, push, tag, deploy,
  release, or bypass a required check;
- treat reviewer prose or Evidence Board state as gate input;
- turn missing, stale, malformed, or unavailable evidence into a pass;
- describe a finding, gate, or artifact as a compliance, legal, privacy,
  provenance, security, or release-suitability certification; or
- approve its own work or ask an automation identity to provide the independent
  human approval.

`AgentProof / gate: success` means only that configured evidence and disposition
rules succeeded for the named policy and exact commit. A separate human review
and repository protections still decide whether merge or release is available.

## Required inputs

Obtain all of these from GitHub or a trusted protected-base artifact. Do not
guess, abbreviate, or copy identity from model prose or the mutable canvas.

1. Repository in `OWNER/REPOSITORY` form, pull request number and URL.
2. Current base/head ref names, protected base SHA, and live PR head SHA.
3. Bounded PR body, author login, and author association for analysis metadata.
4. Protected policy path, schema version, policy version, protected base SHA,
   and canonical policy SHA-256.
5. Raw/final artifact name, source workflow/run URL, generation/evaluation
   timestamps, validity horizon, and canonical artifact SHA-256.
6. Complete current disposition-comment records, including comment ID/URL,
   native GitHub actor, permission, body, updated time, and active,
   edited-away, or deleted state.
7. For assembly, one final evidence document and one or more trusted
   `review-fragment` documents for the same immutable subject.

Never invent an actor permission, timestamp, workflow URL, finding, reviewer
note, or digest.

## Full-SHA and digest validation

- Accept a Git commit SHA only if it matches `^[0-9a-fA-F]{40}$`; normalize it
  to lowercase for comparison. Reject branch names, tags, abbreviated SHAs,
  merge refs, and 64-character SHA-256 values in commit-SHA fields.
- Require `baseSha != headSha`, `policy.baseSha == baseSha`, and every finding
  and reviewer-note `sourceSha == headSha`.
- A disposition is current only when its `boundHeadSha` equals the live
  40-character head SHA. Older SHAs are history and never effective.
- Resolve the base and head through GitHub immediately before analysis, after
  collection, and immediately before publishing, assembly, or display. Any head
  change invalidates the run and every earlier disposition.
- A SHA-256 must match `^[0-9a-fA-F]{64}$`. Use the trusted canonical verifier;
  do not substitute a raw-file hash, hand-edit an artifact, or invent a digest.
- Require the evidence repository, PR, base, head, schema, policy base, policy
  digest, and source workflow to match independently. Equality of one SHA alone
  is not sufficient.
- Do not parse an Actions workflow-run ID from a Check Run's `details_url`:
  GitHub may use `https://github.com/OWNER/REPO/runs/CHECK_ID`. Resolve the
  publisher from the genuine current-head check's `[Workflow run]` footer in
  `output.summary` and the final artifact's `workflowRunUrl`. Independently
  verify the expected GitHub Actions app, run repository/ID/name/path/event,
  artifact identity, subject SHAs, and canonical digest against native GitHub
  records and the protected workflow; matching links alone are insufficient.

## Deterministic workflow

### 1. Resolve and isolate

Resolve the live PR through GitHub. In the authoritative workflow, check out:

- trusted analyzer/evaluator and policy from the protected base SHA; and
- the untrusted subject from the exact head SHA.

Run subject analysis with no secrets, no persisted credentials, and read-only
repository/PR access. Never execute PR-controlled package scripts with a
privileged token. Write generated files only beneath `.agentproof/`.

### 2. Create exact analysis metadata

Create `.agentproof/analyze-metadata.json` with exactly this shape:

```json
{
  "schemaVersion": "1.0.0",
  "repository": "OWNER/REPOSITORY",
  "pullRequestNumber": 1,
  "pullRequestUrl": "https://github.com/OWNER/REPOSITORY/pull/1",
  "pullRequestBody": "BOUNDED_PR_BODY",
  "author": "GITHUB_LOGIN",
  "authorAssociation": "MEMBER",
  "baseRef": "main",
  "baseSha": "0123456789abcdef0123456789abcdef01234567",
  "headRef": "feature-branch",
  "headSha": "89abcdef0123456789abcdef0123456789abcdef",
  "appPath": "."
}
```

The two example SHAs are placeholders and must be replaced with independently
resolved full SHAs. Resolve `appPath` from the protected workflow's
`APPLICATION_PATH` setting; use `"."` for a root application or the reviewed
contained path for a nested application. Schema `1.0.0` also accepts the legacy
`samplePath` alias and rejects conflicting aliases. Do not trust the path from
PR-controlled content.

### 3. Analyze

The protected GitHub workflow invokes the CLI built from the trusted checkout
with this exact flag order:

```text
node trusted/packages/evidence-cli/dist/cli.js analyze --workspace "$GITHUB_WORKSPACE/subject" --metadata "$METADATA_PATH" --output "$RAW_EVIDENCE_PATH"
```

The package-script equivalent in a disposable local checkout is:

```text
npm run agentproof -- analyze --workspace . --metadata .agentproof/analyze-metadata.json --output .agentproof/raw-evidence.json
```

Validate `documentType: "raw"`, schema `1.0.0`, identity, every finding
`sourceSha`, diagnostics, workflow source, and canonical artifact digest.
Collector failure must produce `unknown` evidence or an operational error, never
pass.

### 4. Collect dispositions and evaluate protected policy

The publisher must obtain native GitHub comment state itself. For no comments,
create exactly:

```json
{
  "schemaVersion": "1.0.0",
  "evaluatedAt": "2026-09-02T10:00:00.000Z",
  "comments": []
}
```

For each comment, use the contract fields `commentId`, `commentUrl`, `actor`,
`actorPermission`, `body`, `recordedAt`, and `sourceState`; never infer actor or
permission from comment text. Set `evaluatedAt` to the actual RFC 3339
evaluation time.

The protected publisher evaluates with this exact invocation:

```text
node trusted/packages/evidence-cli/dist/cli.js evaluate --evidence "$RAW_EVIDENCE_PATH" --policy "$GITHUB_WORKSPACE/trusted/policy/release-policy.yml" --dispositions "$DISPOSITIONS_PATH" --output "$FINAL_EVIDENCE_PATH"
```

The package-script equivalent, where the policy path is the protected-base copy,
is:

```text
npm run agentproof -- evaluate --evidence .agentproof/raw-evidence.json --policy policy/release-policy.yml --dispositions .agentproof/dispositions.json --output .agentproof/final-evidence.json
```

Exit `0` means a valid successful gate, exit `2` means a valid blocking gate,
and exit `1` means an operational/validation error. Exit `2` must not be
converted to success. Require a valid final artifact even when the gate blocks.

### 5. Add advisory review fragments

Specialists review the same final evidence and immutable policy inputs. A
trusted review-fragment wrapper must validate their bounded input and create the
canonical fragment digest; never hand-forge a `review-fragment`. With the three
expected fragments, run:

```text
npm run agentproof -- assemble --fragments .agentproof/final-evidence.json .agentproof/test-review.json .agentproof/security-review.json .agentproof/policy-review.json --output .agentproof/assembled-evidence.json
```

`assemble` requires exactly one final document and at least one review fragment.
It exits `0` on valid assembly and `1` on rejection. Missing advisory fragments
do not become fabricated notes or passes.

### 6. Verify and present

1. Re-resolve the live head and reject stale output.
2. Validate `documentType: "final"`, schema version, all identity fields, policy
   binding, finding/note SHAs, disposition history, gate counts/conclusion,
   `validUntil`, workflow source, and canonical artifact digest.
3. Confirm every unresolved `fail`, `unknown`, or unaccepted exception remains
   in `gate.unresolvedFindingIds`.
4. Ask the Evidence Assembler to call `set_evidence` only after those checks,
   then verify the returned repository, PR, and full head SHA with
   `get_evidence`. The board remains a mutable copy.
5. Report the exact gate conclusion and blockers without recommending merge or
   release.

Comment creation/edit/deletion, a new commit, expiry, and the six-hour/manual
revalidation path must recollect current GitHub state and rerun trusted analysis.

For automatic refresh, verify the controller's exact native Analysis run ID
and attempt, then the explicitly dispatched Publisher run. The controller
requires REST API `2026-03-10` dispatch details, waits at most 20 minutes for
Analysis, rechecks the PR, and exits after dispatching Publisher; it does not
wait while holding Publisher's gate lock. A successful controller dispatch is
not a completed gate.

Owner-origin Analysis uses the native `workflow_run` ingress. Bot-origin
Analysis uses Publisher's `workflow_dispatch` ingress with `analysis_run_id`
and `analysis_run_attempt`; it is excluded from the completion ingress to avoid
duplicates. Independently verify the Publisher workflow ID/name/path, native
run ID/attempt/event/repository, default-branch ref and SHA, then the exact
successful Analysis and artifact identity. Never merely widen an accepted
event string, invent a completion event, infer an Analysis from the latest run,
or ignore changed attempts or PR body/head.

An external read-only consumer does not have authentic runner context or
necessarily access to dispatch inputs. It may reuse `validateNativePublisherRun`
with native records and an independently trusted workflow revision, run ID and
attempt. That verifies Publisher identity only, not completion, a passing gate,
or independently observed dispatch inputs. Do not synthesize an event or
`GITHUB_*` context to call the workflow-specific validator; keep unavailable
source-linkage evidence explicit.

If dispatch details are unavailable, a wait expires, or no validated Publisher
finishes, retain the blocking/pending result and escalate to an owner. The owner
may use a new default-branch Analysis dispatch for the current full head SHA;
this read-only skill must not dispatch it. Local controller tests do not prove
live comment/scheduled/expiry refresh, and deployment to a protected base
remains a separate human-controlled step.

## Finding and gate semantics

- `pass`: affirmative, parseable evidence satisfies the protected rule for this
  SHA. It is non-blocking and must not receive a disposition.
- `fail`: valid evidence demonstrates a rule violation. It blocks. Acceptance is
  possible only if the protected policy explicitly marks that finding
  exceptionable and also permits its state and severity; otherwise remediate on
  a new SHA.
- `unknown`: evidence is absent, malformed, stale, unreachable, or
  inconclusive. It blocks and is never an implicit pass. The same explicit
  policy eligibility checks apply before a human may consider an exception.
- `exception`: a bounded human exception disposition, not a pass. It is
  non-blocking only while a current, authorized, SHA-bound, unexpired acceptance
  remains effective; otherwise it blocks.

`request-remediation`, `reject`, malformed, unauthorized, stale, expired,
ineligible, edited-away, or deleted dispositions remain blocking.

The current protected policy requires at least `maintain` permission, a
20-character rationale, no more than 30 calendar days, an allowed state of
`fail`, `unknown`, or `exception`, severity no higher than `high`, and
`exceptionable: true` on the individual finding. Always re-read the policy from
the protected base instead of relying on this snapshot. Use the
`exception-review` skill only to draft exact text for explicit human submission.

## Stop conditions

Reject the artifact and stop before assembly or board loading when:

- a required input is missing or cannot be independently resolved;
- a SHA/digest has the wrong length or alphabet, identities disagree, the live
  head changed, or the policy did not come from the protected base;
- schema/version or canonical digest validation fails;
- the artifact source repository, workflow, run, name, or validity horizon
  cannot be verified;
- comment actor, permission, body, current state, rationale, expiry, or SHA
  cannot be verified;
- reviewer fragments are missing required fields, forged, stale, duplicated, or
  mixed across repository/PR/base/head/policy; or
- analysis would require secrets, write credentials, or broader permissions.

A missing, failed, timed-out, or inconclusive collector is different: preserve
it as `unknown`, complete deterministic evaluation when the document remains
valid, and publish/display only the blocking result. Never assemble around,
hide, or reinterpret that unknown.

Report `unknown` or the deterministic rejection and leave the existing board
untouched after a hard rejection. Do not accept an exception, approve, merge,
release, or make a certification claim while stopped.

## Least privilege and human escalation

- **This skill and specialists:** repository, PR, check, artifact, policy, and
  comment read only; local bounded artifact writes only. No GitHub mutation,
  secrets, push, approval, merge, deployment, or release tools.
- **Analysis workflow:** `contents: read` and `pull-requests: read`; no secrets
  or persisted credentials.
- **Trusted publisher:** only artifact/content reads and the bounded check/PR
  summary writes configured by the protected workflow; it never runs PR code.
- **Disposition/revalidation workflows:** read current PR/comment state and may
  invalidate the gate, wait for an exact read-only Analysis run, and dispatch
  trusted Publisher using their existing Actions/check scopes; they never
  decide or approve an exception.

Escalate test/authorization ambiguity to the Test Reviewer and code owner,
dependency/advisory ambiguity to the Security Reviewer and security owner,
policy meaning or exceptionability to the Policy Reviewer and policy owner,
mixed/stale artifacts to the Evidence Assembler and repository administrator,
and disposition risk/expiry to an authorized human release manager. A different
human performs independent PR review. If authoritative facts remain
unavailable, keep the gate blocking.

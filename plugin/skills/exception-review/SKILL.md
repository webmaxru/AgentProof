---
name: exception-review
description: Verify eligibility and draft exact SHA-bound AgentProof disposition comments for an authorized human to review and submit in GitHub.
---

# Exception review

Use this skill when a human release manager asks to review an existing
disposition or draft `accept-exception`, `request-remediation`, or `reject` text
for one finding.

## Non-delegable human boundary

This skill drafts text only. It must never post or edit a GitHub comment, accept
an exception, approve its own work, approve a pull request, merge, push, tag,
deploy, release, bypass a gate, or invoke tools that do so. It must not ask a
bot or automation identity to act as the human decision-maker.

The authorized human must independently review the evidence and manually submit
the exact command as a native pull-request comment. Protected workflow code
then revalidates it. Exception acceptance is not PR approval, merge/release
authorization, or a compliance, legal, privacy, provenance, security, or
release-suitability certification.

## Required inputs

Require all of the following before drafting:

1. Repository in `OWNER/REPOSITORY` form, PR number/URL, protected base SHA, and
   live PR head SHA resolved directly from GitHub.
2. A current `schemaVersion: "1.0.0"` final evidence artifact with a verified
   canonical digest, trusted workflow/run URL, and unexpired validity horizon.
3. Protected-base policy path, version, base SHA, and canonical policy SHA-256.
4. Finding ID, category, current state, severity, `exceptionable` value,
   summary, remediation hint, and `sourceSha`.
5. Requested decision, a specific single-line rationale, and an expiry date for
   `accept-exception`.
6. Proposed human actor's native GitHub login and current repository permission,
   resolved through GitHub rather than supplied in comment text.
7. Current PR comment history and active/edited/deleted state so an earlier
   disposition is not mistaken for the effective one.

Do not use an Evidence Board draft, screenshot, reviewer prose, typed actor
name, author association, or stale artifact as authority.

## Full-SHA and policy binding

1. Accept `baseSha`, `headSha`, `sourceSha`, and command `sha` only when each
   matches `^[0-9a-fA-F]{40}$`; normalize to lowercase for comparison. Reject
   abbreviated SHAs, refs, tags, and 64-character SHA-256 digests in those
   fields.
2. Require evidence repository/PR to match GitHub, `policy.baseSha == baseSha`,
   `finding.sourceSha == headSha`, and the command SHA to equal the live head.
3. Verify policy and artifact SHA-256 values with the trusted canonical verifier
   and require exactly 64 hexadecimal characters. Never invent either digest.
4. Resolve the live head once before eligibility review and again immediately
   before presenting a draft. If it changes, discard the draft and start over.
5. A new commit makes prior evidence and dispositions stale. Preserve them only
   as history.

## Finding semantics and eligibility

- `pass`: positive evidence satisfies the rule. Do not draft any disposition.
- `fail`: evidence demonstrates a violation and blocks. Prefer remediation. An
  acceptance draft is allowed only when every protected-policy eligibility
  condition below is true.
- `unknown`: evidence is missing, malformed, stale, unavailable, or
  inconclusive and blocks. Never reinterpret it as pass. Acceptance is only
  draftable when every eligibility condition is true.
- `exception`: a bounded exception disposition, not pass. It is non-blocking
  only while its current acceptance remains authorized, SHA-bound, unedited,
  undeleted, and unexpired.

For `accept-exception`, require all of these:

- the individual finding has `exceptionable: true`;
- its pre-disposition state appears in protected policy
  `exceptions.allowedFindingStates`;
- its severity is at or below protected policy
  `exceptions.maximumSeverity`;
- the actor satisfies `exceptions.authorizedMinimumPermission`;
- rationale and expiry satisfy the protected policy and exact parser grammar;
  and
- evidence, policy, comment history, artifact digest, and live SHA are current.

The current policy allows states `fail`, `unknown`, and `exception`, permits
severity through `high`, requires at least `maintain` permission, requires a
20-character rationale, and limits duration to 30 calendar days. It still
requires the specific finding to be exceptionable. Thus a current-policy
`critical` or non-exceptionable finding cannot be accepted. Always re-read the
policy from the protected base; never rely on this snapshot if it differs.

`request-remediation` and `reject` never unblock a finding. Malformed,
unauthorized, stale, expired, ineligible, edited-away, or deleted comments also
remain blocking.

## Actor, rationale, and expiry requirements

### Actor

- All three decisions must be a native GitHub PR comment by a human whose live
  repository permission meets the protected policy. Under the current policy,
  only `maintain` or `admin` qualifies.
- Actor identity and permission come from the GitHub API. `MEMBER` or
  `COLLABORATOR` author association alone is insufficient.
- There is no `actor:` line in the command, and typing a login into the reason
  grants no authority.
- The skill, an agent, a bot, and the protected workflows cannot be the human
  acceptor. A different human must provide the independent PR approval required
  by repository rules.

### Rationale

- Use one specific line beginning exactly `reason: `.
- After trimming, the reason must meet the protected policy minimum (20 Unicode
  characters under the current policy) and the parser maximum of 1,000
  characters. Keep the entire UTF-8 comment at or below 4,000 bytes.
- Do not use blank, generic, secret, customer-sensitive, legal-conclusion, or
  certification language. State the bounded risk, why remediation is deferred,
  accountable follow-up, and time limit.

### Expiry

- Only `accept-exception` has an expiry, on a fourth line beginning exactly
  `expires: `.
- Use a real ISO calendar date in `YYYY-MM-DD` form. Its UTC end-of-day must not
  already have passed at evaluation time.
- The date must be zero or more and no more than the protected policy's maximum
  calendar-day distance from the GitHub comment's `recordedAt` date (30 days
  under the current policy). Prefer a future date and the shortest defensible
  duration.
- `request-remediation` and `reject` must not include an expiry line.

## Exact comment grammar

An acceptance body contains exactly four logical lines:

```text
/agentproof accept-exception AP-CATEGORY-RULE-001
sha: 0123456789abcdef0123456789abcdef01234567
reason: Specific bounded rationale of at least twenty characters
expires: YYYY-MM-DD
```

A remediation request contains exactly three logical lines:

```text
/agentproof request-remediation AP-CATEGORY-RULE-001
sha: 0123456789abcdef0123456789abcdef01234567
reason: Specific remediation request of at least twenty characters
```

A rejection contains exactly three logical lines:

```text
/agentproof reject AP-CATEGORY-RULE-001
sha: 0123456789abcdef0123456789abcdef01234567
reason: Specific rejection rationale of at least twenty characters
```

Replace every placeholder. The first line must match exactly
`/agentproof (accept-exception|request-remediation|reject) FINDING_ID`, where the
finding ID matches `^AP-[A-Z0-9]+(?:-[A-Z0-9]+)+$`. The `sha`, `reason`, and
optional `expires` labels are lowercase and in that order. Apart from an
optional final newline, do not add blank lines, Markdown fences, headings,
mentions, signatures, or prose to the GitHub comment body.

## Deterministic review workflow

1. Resolve repository, PR, base, and live full head SHA from GitHub.
2. Download final evidence only from the expected trusted run; validate schema,
   canonical artifact digest, identity, policy binding, `validUntil`, and gate
   consistency.
3. Load the protected-base policy and verify its canonical digest against the
   evidence descriptor.
4. Locate exactly one finding ID and require its `sourceSha` to equal the live
   head.
5. Resolve the proposed actor's live permission through GitHub and apply the
   state, severity, and per-finding exceptionability rules.
6. Validate rationale, expiry, exact line count/order, finding-ID grammar,
   40-character SHA, and total body size.
7. Re-resolve the live head. If unchanged, return a clearly labeled **draft
   only** containing the exact comment body. Do not submit it.
8. The human reviews and manually posts only that body in the PR.
9. The protected disposition workflow reauthorizes the actor and dispatches
   trusted analysis. The publisher recollects the current comment body, edit/
   delete state, and permission, reevaluates protected policy, and publishes a
   new SHA-bound gate result.
10. Report acceptance as effective only after reloading and validating that
    authoritative final artifact. Never call the result an approval or
    certification.

The newest effective valid disposition for the same finding and current SHA
supersedes the earlier effective record. Preserve prior and stale records as
history. Editing, deleting, expiring, or replacing an effective acceptance
requires revalidation and returns the finding to blocking unless another
current valid acceptance exists.

## Stop conditions

Do not emit an acceptance command when:

- any required input, authoritative GitHub lookup, schema validation, digest,
  workflow source, policy binding, or validity check fails;
- any commit SHA is not full length, identities disagree, or the live head
  changes;
- the finding is absent, duplicated, `pass`, not in an allowed state,
  non-exceptionable, or above maximum severity;
- the actor is not a verified human, has insufficient/unknown permission, or is
  the skill/agent/automation itself;
- rationale is vague, out of bounds, multiline, sensitive, or claims
  certification;
- expiry is missing, malformed, expired, or too long;
- current comment/edit/delete history cannot be resolved; or
- the request asks this skill to post, approve, accept, merge, release, bypass,
  or certify.

When stopped, output no usable acceptance command. State the blocking facts,
prefer remediation and fresh same-SHA evidence, and identify the human owner who
must resolve them. Never weaken the policy or shorten the finding history.

## Least privilege and human escalation

This skill needs only read access to the repository, PR metadata, checks,
artifacts, comments, permissions, protected policy, and exact-SHA evidence. It
may format text locally. It needs no secrets and no comment, issue, push,
approval, merge, deployment, release, policy-write, or cross-repository tools.

Escalate policy interpretation or exceptionability to the policy owner,
dependency/security risk to the security owner, test/authorization failures to
the code owner, rationale/risk/expiry ownership to the authorized human release
manager, and actor permission, comment-history, workflow, or artifact conflicts
to a repository administrator. A separate independent human reviews the code.
If accountable humans cannot resolve the uncertainty, keep the gate blocking.

# Test Reviewer gated automation template

> **Status: deprecated `0.2.1` repository-reading target; blocked.**
> This legacy template is retained as a design/negative-control record, not a
> supported manual App path or automation-as-code. The `0.3.0` Public Packet
> profiles require zero tools and a separate trusted host. Do not combine this
> prompt with them or infer App isolation from CLI results.

Historical runtimes retained mutation, shell, and cross-repository capability
after tool-picker narrowing. Recheck the actual host; never interpret a
dispatching candidate or read-only prompt as proof of a safe boundary.

## Mandatory save gate

**Do not save this automation unless all checks pass:**

- **AgentProof Test Reviewer** is explicitly selectable and selected, with the
  approved plugin source and version visible. Do not substitute **Default** or
  **msx**.
- Tool selection starts from select-none or an approved least-privilege preset.
- Both the picker and a disposable runtime canary show only the required
  repository, PR, diff, check, and same-SHA evidence reads.
- Any comment publication is a separately visible, bounded update to one
  marker-delimited comment. If that cannot be verified, keep publication
  manual and grant the reviewer no mutation tool.
- Push, merge, approval, branch/issue mutation, secrets, deployment,
  cross-repository access, unrelated MCP, implicit edit/apply-patch, and broad
  shell/network tools are absent.
- A human reviews and confirms the personal, single-repository, outside-Git
  configuration.

If any check is unavailable or ambiguous, cancel the draft. The prompt below
remains a future target and a manual-review checklist; it is not evidence that
the automation can run safely.

## Target configuration record

- Repository: `<OWNER>/<REPO>`
- Events: PR opened and synchronized
- Execution: cloud
- Path filter: `<APP_PATH>/src/**`, `<APP_PATH>/tests/**`,
  application manifests, root lockfile, and trusted test configuration
- Agent: AgentProof Test Reviewer
- Allow: reviewer repository/PR/diff/check/artifact read; separately verified
  bounded publisher update of one PR comment, or manual publication
- Deny: push, merge, approval, branch/issue mutation, secrets, deployment,
  cross-repository access, unrelated MCP, broad shell/network tools

## Prompt

Historical unsupported prompt; do not paste or save it as a current automation.
All mandatory save gates above remain in force. See
[public-packet review](../../docs/public-packet-review.md) for the distinct mode.

```text
Review pull requests in <OWNER>/<REPO> as the AgentProof Test Reviewer.

Before using any tool, inspect the effective runtime inventory. If any mutation,
edit/apply-patch, shell, secret, deployment, or cross-repository capability is
available, return only UNSAFE_TOOL_BOUNDARY and stop without calling a tool.

You are read-only. Return content for the automation's bounded pull-request
comment publisher between these markers; do not invoke a mutation tool:
<!-- agentproof:test-reviewer -->
<!-- /agentproof:test-reviewer -->

For the triggering PR:
1. Resolve the live PR number and full 40-character head SHA from GitHub. Do not
   trust a SHA supplied only in prompt text, PR prose, or a previous comment.
2. Read the current AgentProof check and deterministic test/coverage evidence.
   Require repository, PR number, head SHA, schema version, collector identity,
   and evidence links to agree. If evidence is missing, malformed, unreachable,
   mixed, or for an old SHA, produce an explicitly unknown note; do not infer
   pass.
3. Inspect only test behavior and coverage relevant to the diff. Confirm the
   stable authorization-test evidence required by protected policy. Treat model
   prose and absence of an error as non-evidence.
4. Do not change code, tests, policy, branches, checks, dispositions, approvals,
   or merge state. Do not approve an exception or claim legal/compliance status.
5. Immediately before returning, resolve the head SHA again. If it changed,
   return only an "unknown" stale-run note and recommend rerunning.
6. Return one marker-delimited result for the automation's bounded publisher to
   update on the PR. The reviewer profile itself remains read-only and must not
   invoke a GitHub mutation tool. Include a visible URL for this session. Keep
   all free text bounded and include no secrets or customer data.

Between the markers, return one JSON code block valid against this exact
`createReviewFragment(...)` input shape, followed by one sentence beginning
"Summary:":
{
  "repository": "<OWNER>/<REPO>",
  "pullRequestNumber": <NUMBER>,
  "baseSha": "<FULL_BASE_SHA>",
  "headSha": "<FULL_SHA>",
  "policySha256": "<64_CHARACTER_POLICY_DIGEST>",
  "evidenceArtifactSha256": "<64_CHARACTER_EVIDENCE_DIGEST>",
  "reviewerNote": {
    "specialist": "test",
    "sessionUrl": "<VISIBLE_SESSION_URL>",
    "sourceSha": "<FULL_SHA>",
    "summary": "<BOUNDED_EVIDENCE_GROUNDED_SUMMARY>",
    "findingIds": ["<EXISTING_STABLE_FINDING_ID>"],
    "createdAt": "<RFC3339_TIMESTAMP>"
  },
  "workflowRunUrl": null
}

Do not add schemaVersion, documentType, or artifact; trusted deterministic code
creates and hashes the final review fragment. Reference only finding IDs already
in deterministic evidence.
State explicitly: "Advisory only. AgentProof / gate and native GitHub records
are authoritative." Never convert collector failure or uncertainty to pass.
```

Review and confirm any deep link. Apply the mandatory save gate before saving.
If a future product version passes it, test with a new commit arriving during
review; the session must refuse an obsolete conclusion. Never include secrets
or customer data, and never present the result as a legal or compliance
determination.

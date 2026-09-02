# Copilot App reviewer sessions and gated automation experiment

## Validated status — 2026-09-02

The supported AgentProof MVP is **manual use of the installed Test, Security,
and Policy Reviewer agents in separate Copilot App sessions**. No AgentProof
pull-request automation was saved or shown to run during this validation.

Validation used AgentProof `v0.1.0`, installed from the private
`msft-common-demos/AgentProof` repository. The new **Pull request** automation
flow exposed:

- `Opened` and `Synchronized` events;
- **Require write access**;
- cloud execution;
- path filters; and
- an Agent picker and a Tools picker.

The Agent picker offered only **Default** and **msx**, not the installed
AgentProof reviewers. The Tools picker started with **All tools selected**, and
the validated flow exposed no safe clear-all/select-none path. The draft was
cancelled, so no over-privileged automation was stored.

## Storage, confirmation, and authority boundary

A Copilot App automation, if a future experiment passes the gates below, is
**personal**, **single-repository scoped**, and **stored outside Git**. Files in
`templates/automations/` are versioned experimental inputs only; they do not
install, administer, or prove the existence of an automation.

Deep links may prefill an automation, plugin, or session flow. The current user
must review and confirm every configuration. Never describe a deep link as
silently creating, installing, or running anything.

GitHub checks, reviews, comments, artifacts, and repository rules remain the
auditable record and enforcement boundary. Reviewer output is advisory, not a
legal, security, privacy, residency, or compliance determination. Prompts,
sessions, comments, screenshots, and logs must contain no secrets or customer
data.

## Manual reviewer-session MVP

For each pull request:

1. Confirm AgentProof `v0.1.0` (or the exact reviewed replacement version) is
   installed from the approved source.
2. Start the installed AgentProof Test Reviewer, Security Reviewer, and Policy
   Reviewer manually as three independent sessions. Do not substitute
   **Default** or **msx** for a missing AgentProof reviewer.
3. Give each session only the repository and pull-request reference it needs.
   Have it resolve the live pull-request number and full head SHA from GitHub.
4. Keep each reviewer read-only. It may return a bounded review fragment, but it
   must not push, merge, approve, accept an exception, change policy, or publish
   through a mutation tool.
5. Treat absent, malformed, unavailable, mixed-SHA, or stale evidence as
   `unknown`. Preserve `pass`, `fail`, `unknown`, and `exception` as distinct
   evidence states.
6. A human may start the Evidence Assembler manually and decide whether to
   publish or act on current-SHA results. A new commit invalidates prior
   reviewer conclusions.

## Future automation target — do not save by default

The templates describe a possible future experiment:

| Target review              | Template                                     | Required custom agent        | Suggested path filter                     |
| -------------------------- | -------------------------------------------- | ---------------------------- | ----------------------------------------- |
| AgentProof Test Review     | `templates/automations/test-reviewer.md`     | AgentProof Test Reviewer     | application/tests/package test config     |
| AgentProof Security Review | `templates/automations/security-reviewer.md` | AgentProof Security Reviewer | manifests, lockfile, source, workflows    |
| AgentProof Policy Review   | `templates/automations/policy-reviewer.md`   | AgentProof Policy Reviewer   | policy, data-handling config, PR metadata |

**MUST NOT SAVE an AgentProof automation unless every item below is visibly
verified in the effective configuration:**

1. The exact installed custom AgentProof reviewer is selectable and selected;
   its plugin source and version are identifiable. **Default** and **msx** are
   not acceptable substitutes.
2. Tool selection can begin from select-none, use an approved least-privilege
   preset, or otherwise safely clear every unnecessary tool.
3. An effective-permission preview shows only repository, pull request, diff,
   check, and same-SHA evidence reads. If publication is part of the design, a
   separate bounded update to one marker-delimited PR comment must be explicit;
   otherwise keep publication manual.
4. Push, merge, approval, branch/issue mutation, workflow dispatch, secrets,
   deployment, cross-repository access, unrelated MCP, and broad shell/network
   tools are absent from the effective scope.
5. Repository, `Opened`/`Synchronized` events, **Require write access**, cloud
   execution, and path filters match the reviewed plan.
6. A human reviews and confirms the personal, outside-Git configuration and
   records owner, repository, product/plugin version, events, filters, effective
   tools, prompt commit, and review date in an approved inventory.

An **All tools selected** default without a trustworthy clear-all path or
effective-permission preview fails this gate. Cancel the draft.

Enterprise-managed settings may constrain plugins, marketplaces, MCP, models,
permissions, and sandbox behavior, but they do not prove the effective scope of
an individual automation.

## Required behavior for any future experiment

Each experimental prompt must:

1. resolve the live pull-request number and full head SHA;
2. read deterministic evidence tied to that SHA;
3. return `unknown` when evidence is absent, malformed, unavailable, obsolete,
   or mixed;
4. inspect only its specialty;
5. remain read-only and avoid code, policy, branch, check, disposition,
   approval, exception, and merge changes;
6. return one marker-delimited payload without invoking a mutation tool;
7. include the full head SHA, evidence links, bounded advisory findings, and a
   visible session URL; and
8. state that the result is advisory and native GitHub evidence is
   authoritative.

The target sessions do not imply native fan-out or aggregation. A human starts
the Evidence Assembler manually, and mixed-SHA input must fail closed.

## Deep-link placeholders

Only publish links generated by a current documented flow:

```text
Plugin install:       <PLUGIN_INSTALL_DEEP_LINK>
Manual test session:  <TEST_REVIEWER_SESSION_DEEP_LINK>
Manual security:      <SECURITY_REVIEWER_SESSION_DEEP_LINK>
Manual policy:        <POLICY_REVIEWER_SESSION_DEEP_LINK>
Sample PR:            https://github.com/<OWNER>/<REPO>/pull/<PR_NUMBER>
Assembler session:    <ASSEMBLER_SESSION_DEEP_LINK>
Remediation session:  <REMEDIATION_SESSION_DEEP_LINK>
Future automation:    <GATED_AUTOMATION_DRAFT_DEEP_LINK>
```

Label every link **review and confirm**. An automation draft link remains gated
and must be cancelled when the custom-agent or effective-tool checks fail.

## Validation if the product gap is resolved

Use a disposable repository and synthetic pull request:

1. Reproduce the picker checks before saving: exact custom AgentProof agent,
   approved source/version, select-none or reviewed preset, and explicit
   effective least-privilege scope.
2. Configure one candidate template at a time. Cancel immediately if any save
   gate is not met.
3. After a gated save, confirm only the intended events and paths start a
   session, and that the session names the current full head SHA.
4. Verify the reviewer cannot push, merge, approve, read secrets, deploy, access
   another repository, or use unrelated tools.
5. Push a new commit during review; the result must become `unknown` rather than
   publish an obsolete conclusion.
6. Remove evidence access; the result must be `unknown`, not `pass`.
7. Repeat independently for each target reviewer and manually verify
   mixed-SHA aggregation is rejected.
8. Delete the experiments after recording only non-sensitive validation
   evidence.

Do not infer from the templates or this plan that any automation is currently
live or known to run.

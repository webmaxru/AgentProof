# Copilot App automation setup

## Important storage and authority boundary

Copilot App cloud automations are **personal**, **single-repository scoped**,
and **stored outside Git**. The files in `templates/automations/` are versioned
prompts and setup records; they do not install or centrally administer a live
automation. Export the final configuration to an approved inventory if your
organization requires one.

Deep links may prefill an automation or plugin/session flow, but the current
user must review and confirm it. Never describe a deep link as silently
creating, installing, or running anything.

## Prerequisites

- Copilot App and cloud automations enabled for the automation owner.
- Owner has read/comment access to `<OWNER>/<REPO>`.
- The AgentProof plugin and agents are discoverable.
- `AgentProof / gate` produces same-SHA deterministic evidence.
- Prompts contain no secrets or customer content; automation sessions/logs may
  be visible to repository readers.

## Create three independent automations

Create one automation per template:

| Automation                 | Template                                     | Agent             | Suggested path filter                     |
| -------------------------- | -------------------------------------------- | ----------------- | ----------------------------------------- |
| AgentProof Test Review     | `templates/automations/test-reviewer.md`     | Test Reviewer     | application/tests/package test config     |
| AgentProof Security Review | `templates/automations/security-reviewer.md` | Security Reviewer | manifests, lockfile, source, workflows    |
| AgentProof Policy Review   | `templates/automations/policy-reviewer.md`   | Policy Reviewer   | policy, data-handling config, PR metadata |

For each automation:

1. Choose cloud execution and repository `<OWNER>/<REPO>`.
2. Select PR `opened` and `synchronize` events supported by the current App.
   Keep the default safety behavior that ignores trigger authors without
   repository write access.
3. Paste the corresponding prompt and replace its placeholders.
4. Select only repository/PR/diff/check/artifact **read** tools and the bounded
   PR-comment **write** tool needed to update one review comment.
5. Disable push, merge, branch creation, issue mutation, workflow dispatch,
   secrets, deployment, cross-repository access, unrelated MCP servers, and
   broad shell/network tools.
6. Save only after reviewing the generated configuration.
7. Record owner, repository, events, path filters, tools, prompt commit, and
   review date in the organization's approved inventory.

Centrally managed App settings may limit plugins, marketplaces, MCP, model
defaults, permissions, and sandbox behavior. They do not replace the
per-automation tool selection above.

## Required runtime behavior

Every prompt instructs its session to:

1. resolve the live PR number and full head SHA;
2. read deterministic evidence tied to that SHA;
3. stop with `unknown` if evidence is absent, malformed, obsolete, or mixed;
4. inspect only its specialty;
5. avoid changing code, policy, branches, checks, or approvals;
6. return one marker-delimited payload for the automation's bounded publisher
   to update, rather than add comment spam; the reviewer profile itself remains
   read-only;
7. include the head SHA, evidence links, bounded advisory findings, and visible
   session URL; and
8. state that the note is advisory and GitHub evidence/gate is authoritative.

The three automations do not fan out or coordinate one another. After they
finish, a human starts the Evidence Assembler manually. Do not claim the App
provides automation-as-code or native multi-agent aggregation here.

## Deep-link placeholders

If the field kit is distributed with current, generated deep links, record:

```text
Plugin install:       <PLUGIN_INSTALL_DEEP_LINK>
Test automation:      <TEST_AUTOMATION_DRAFT_DEEP_LINK>
Security automation:  <SECURITY_AUTOMATION_DRAFT_DEEP_LINK>
Policy automation:    <POLICY_AUTOMATION_DRAFT_DEEP_LINK>
Sample PR:            https://github.com/<OWNER>/<REPO>/pull/<PR_NUMBER>
Assembler session:    <ASSEMBLER_SESSION_DEEP_LINK>
Remediation session:  <REMEDIATION_SESSION_DEEP_LINK>
```

Generate links from the current Copilot App/documented flow rather than
inventing URL syntax. Label every link **review and confirm**.

## Validation

1. Open a disposable PR as a user with write access.
2. Confirm exactly three visible sessions start and each names the same current
   SHA.
3. Confirm each updates only its own marker-delimited comment.
4. Push a new commit while one session runs; it must refuse to publish old-SHA
   conclusions.
5. Remove access to an evidence artifact; the agent must report `unknown`, not
   pass.
6. Verify tool audit/configuration shows no push, merge, secret, or
   cross-repository capability.
7. Manually assemble only current-SHA fragments and verify mixed-SHA rejection.

## Operations

Because ownership is personal, nominate a backup process: recreate and
revalidate from the committed prompt when the owner changes roles or loses
access. Review configurations after App updates. Disable/delete all three
automations during cleanup; deleting repository files does not remove them.

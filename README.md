# AgentProof

> Every AI-assisted change earns commit-bound evidence and an explicit human
> decision before it can merge.

AgentProof is a model-neutral field kit for a synthetic expense-approval
repository. Deterministic collectors evaluate tests, dependency risk, and a
data-retention declaration for one pull-request head SHA. GitHub publishes the
required `AgentProof / gate` check. After that check completes, a user manually
starts three isolated, read-only Copilot App sessions to explain the evidence,
then runs the Evidence Assembler manually. A release manager decides whether to
remediate or accept an eligible, bounded exception.

The private automation lab also proved a fail-closed permission canary on
2026-09-03. Repository reviewer profiles appeared after project selection, and
PR opened/synchronized events ran. However, even after the automation picker was
reduced from 50 tools to 21 read-only GitHub operations, the runtime still
reported `functions.apply_patch`, `functions.bash`, and GitHub Actions tools that
could access external repositories. The canary performed no mutation and the
automation was disabled. Personal reviewer automations are therefore not part of
the supported MVP.

AgentProof produces evidence, not a legal, privacy, security, or regulatory
certification. The demo contains no customer data.

Reference implementation: <https://github.com/msft-common-demos/AgentProof>.
Files under `templates/` retain `<OWNER>/<REPO>` placeholders for reuse.

## Roles

| Role                                 | Responsibility                                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Developer or agent operator          | Opens the PR, declares known assistance, and remediates findings.                                                                           |
| Test, security, and policy reviewers | Manually start isolated, read-only sessions on the same SHA-bound facts and return advisory notes. They cannot approve exceptions or merge. |
| Release manager                      | Records an authorized, reasoned disposition for an eligible finding.                                                                        |
| Independent reviewer                 | Reviews the resulting code and approves the PR; must not be the author or release decision-maker.                                           |
| Repository administrator             | Protects workflows and policy, configures the ruleset, and scopes App/session access.                                                       |
| Field practitioner                   | Installs the kit and adapts its synthetic policy to a customer-approved use case.                                                           |

One person may fill several operational roles outside production, but the demo
uses a separate account or team for independent approval.

## Architecture at a glance

```text
untrusted PR head
      |
      | read-only token; no secrets
      v
deterministic collectors ----> raw evidence for head SHA
      |                               |
      +-------------------------------+
                                      v
protected-base evaluator + policy --> AgentProof / gate
                                      |
                    +-----------------+-----------------+
                    |                                   |
       manual read-only App sessions          authorized PR comment
                    |                                   |
                    +----> manual Evidence Assembler <--+
                                  |
                                  v
                             Evidence Board
                             (mutable view)

Authoritative record: GitHub commit, check, PR comments/reviews, and evidence artifact
```

The disposable automation permission canary is validation evidence, not an
enforcement component. Its latest result failed closed and the trigger is
disabled.

The write-capable publisher runs trusted default/base-branch code and does not
execute PR-controlled code. See [architecture](docs/architecture.md),
[evidence contract](docs/evidence-contract.md), and
[threat model](docs/governance-and-threat-model.md).

## Prerequisites

- Node.js 22 or later and npm.
- Git.
- A private GitHub.com repository, represented below as `<OWNER>/<REPO>`, with
  GitHub Actions and repository rulesets (or equivalent branch protection).
- GitHub Copilot App/CLI access with cloud sessions, plugins, canvas
  extensions, and installed-agent or deep-link session launch for the intended
  users.
- Permission to manage repository Actions and rules, plus a distinct reviewer
  account or team such as `<RELEASE_REVIEWER_OR_TEAM>`.
- Only synthetic, non-secret demo data.

Product surfaces and plan entitlements change. Recheck the current
[GitHub Copilot App documentation](https://docs.github.com/en/copilot/how-tos/github-copilot-app)
before a customer deployment or recording.

## Install and verify

```bash
git clone https://github.com/msft-common-demos/AgentProof.git
cd AgentProof
npm ci
npm run check
```

Useful focused commands:

```bash
npm run build
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run agentproof -- --help
```

Do not use a production repository until the policy, permissions, data
handling, and exception model have been reviewed by the customer's accountable
owners.

## Repository setup

1. Push the safe default branch and keep Actions disabled until every workflow
   and action pin has been reviewed.
2. Replace the demonstration owner in `.github/CODEOWNERS` with
   `<RELEASE_REVIEWER_OR_TEAM>`.
3. Review `policy/release-policy.yml`; a PR is evaluated against protected base
   policy rather than policy weakened by that same PR.
4. Enable the workflows and open a harmless PR once so the
   PR-triggered `AgentProof Analysis` and `AgentProof Publish` workflows run and
   the `AgentProof / gate` check becomes selectable.
5. Create a ruleset for `<DEFAULT_BRANCH>` that requires:
   - pull requests;
   - `AgentProof / gate`;
   - at least one approval from someone other than the author/release
     decision-maker;
   - stale approval dismissal;
   - code-owner review for workflows, policy, plugin, and evidence code;
   - resolved conversations; and
   - no bypass except a documented break-glass group.
6. Limit Actions to approved, SHA-pinned actions and retain the default
   read-only workflow token unless an individual workflow explicitly needs
   more.

Exact instructions and acceptance tests are in
[GitHub setup](docs/github-setup.md).

## Copilot App reviewer setup

The working MVP uses manually started reviewer sessions; it does not depend on
personal PR automations. Use the supported marketplace flow confirmed by the
live validation:

```text
copilot plugin marketplace add msft-common-demos/AgentProof
copilot plugin install agentproof@agentproof-marketplace
```

The marketplace flow was live-validated through AgentProof v0.2.0. The packaged
v0.2.1 reviewer profiles add an explicit runtime tool-boundary stop. Plugin
installation and every deep-link launch still require the user's authorized
confirmation. A direct repository install from
`msft-common-demos/AgentProof:plugin` also worked, but that flow is deprecated
and is not setup guidance.

After `AgentProof Analysis` and `AgentProof Publish` produce the check, artifact,
and PR summary for the current head SHA:

1. Manually start three separate, isolated sessions with the installed Test
   Reviewer, Security Reviewer, and Policy Reviewer agents, or use their deep
   links.
2. Review and confirm each launch. Grant only repository, PR, check, and artifact
   read tools. If the UI defaults to **All tools** and cannot be safely reduced,
   cancel rather than save or launch an over-privileged configuration.
3. Confirm that every result names the full current head SHA.
4. Manually run the Evidence Assembler after all three reviewers finish; reject
   mixed-SHA inputs before loading the mutable Evidence Board.

The checked-in reviewer prompts are gated setup inputs, not active reviewer
automations:

- [Test Reviewer prompt](templates/automations/test-reviewer.md)
- [Security Reviewer prompt](templates/automations/security-reviewer.md)
- [Policy Reviewer prompt](templates/automations/policy-reviewer.md)
- [Automation Permission Canary](templates/automations/permission-canary.md)

On 2026-09-02, the private live repository
`msft-common-demos/AgentProof` successfully ran the PR-triggered deterministic
Analysis/Publish path and produced the SHA-bound `AgentProof / gate`, artifact,
and PR summary. The marketplace flow installed AgentProof v0.2.0 and its two
skills.

On 2026-09-03, a separate private
[`AgentProof-Automation-Lab`](https://github.com/msft-common-demos/AgentProof-Automation-Lab)
project exposed the repository Test, Security, and Policy reviewers in the
automation picker. A disposable PR #1 candidate fired for both opened and
synchronized events. The picker was manually narrowed from 50 tools to these 21
read-only operations: issue/PR reads and searches, repository file/code/ref
reads, Actions workflow/log reads, label reads, and code-scanning-alert reads.
The resulting session still reported `functions.apply_patch`, `functions.bash`,
and GitHub Actions tools with external-repository capability. It returned
`UNSAFE_TOOL_BOUNDARY`, made no PR review or inline comment, created no commit,
and was disabled. AgentProof therefore does not claim live personal reviewer
automations.

Treat [automation setup](docs/automation-setup.md) and
[enterprise settings](docs/enterprise-settings-example.md) as validated
permission-gate and product-feedback references. App deep links may prefill a
supported flow, but they never silently install a plugin, create an automation,
or start a session.

## End-to-end workflow

1. Open or synchronize a PR, which triggers the GitHub Actions analysis and
   publish path. Keep exactly one origin classification in the PR template:
   `github-attributed`, `self-declared`, or `unknown`. This is not universal
   model provenance.
2. `AgentProof Analysis` executes the untrusted subject in an ephemeral runner
   with no secrets and read-only repository/PR access. It emits normalized raw
   evidence even when a finding blocks.
3. `AgentProof Publish` validates repository, PR, workflow, schema, base SHA,
   and live head SHA; applies protected-base policy; and publishes one
   `AgentProof / gate` check plus one marker-delimited PR summary.
4. After the deterministic check completes, a user manually starts three
   visible, isolated, read-only specialist sessions with the installed agents or
   confirmed deep links. Each resolves the current head SHA, stays within its
   specialty, refuses stale/mixed evidence, and returns one advisory result.
5. The user runs the Evidence Assembler manually after all three finish. It
   rejects mixed SHAs and loads one document into the Evidence Board.
6. A human chooses remediation or, for an exceptionable finding only, records a
   bounded exception on the PR.
7. A remediation commit creates a new head SHA. Earlier dispositions, evidence,
   and stale approvals no longer satisfy the new revision.
8. The PR-triggered Actions evidence reruns. Before relying on specialist advice
   for the new revision, manually start fresh reviewer sessions and assemble
   only their same-SHA results. Record any still-needed exception against the
   new SHA.
9. A different human approves. The ruleset exposes merge only when both the
   gate and independent review are satisfied.

The canvas can be edited or cleared at any time. It coordinates review; it is
not an immutable ledger, signature, or approval. GitHub remains authoritative.

## Reproduce the synthetic risky PR

Use a disposable branch in the synthetic repository only:

```bash
git switch <DEFAULT_BRANCH>
git pull --ff-only
git switch -c demo/unsafe-change
git apply --check demo/unsafe-change.patch
git apply demo/unsafe-change.patch
npm install --package-lock-only --ignore-scripts
git add sample-repo/package.json sample-repo/tests/expenses.integration.test.ts sample-repo/config/data-handling.yml package-lock.json
git commit -m "Create synthetic unsafe AgentProof scenario"
git push -u origin demo/unsafe-change
```

Open a draft PR and set the origin declaration to `self-declared` with declared
tool `Claude-assisted`. The patch is intentionally unsafe: never merge it to a
real application branch. It pins a vulnerable runtime dependency, removes the
stable evidence marker from the existing non-approver behavioral test, and
removes a required retention field. Confirm the live collector produces the
expected findings; if the advisory service or dependency metadata changed, stop
and repair the demo rather than present the synthetic fixture as a scan.

Follow the [runbook](demo/runbook.md) for disposition, real remediation,
new-SHA invalidation, rerun, and independent review.

## Evidence states

| State       | Meaning                                                               | Default gate effect                                               |
| ----------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `pass`      | Positive, valid evidence satisfies the checked rule.                  | Non-blocking                                                      |
| `fail`      | Evidence violates the rule.                                           | Blocking; remediate unless policy explicitly permits an exception |
| `unknown`   | Required evidence is absent, malformed, unavailable, or inconclusive. | Blocking; never silently treated as pass                          |
| `exception` | Policy requires an explicit disposition before proceeding.            | Blocking until a valid authorized acceptance exists               |

The gate fails closed for unresolved `fail`, `unknown`, or `exception`
findings. Critical or policy-marked non-exceptionable findings cannot be
accepted.

The checked-in demo policy requires a passing test suite, at least 80% lines,
functions, branches, and statements coverage, the stable non-approver
authorization test, no production dependency above `moderate`, a complete
retention declaration of at most 30 days, and a declared origin. Test and
dependency findings are non-exceptionable. The default exception policy
requires at least repository `maintain`, a 20-character rationale, and an expiry
no more than 30 days away. Always read protected-base policy rather than relying
on this summary.

## Human review and exception command

Prefer remediation. If protected-base policy marks a finding exceptionable, an
authorized release manager posts this exact command as a **PR comment**:

```text
/agentproof accept-exception <FINDING_ID>
sha: <40_CHARACTER_HEAD_SHA>
reason: <specific rationale meeting the configured minimum length>
expires: <YYYY-MM-DD>
```

The disposition workflow rejects malformed commands, issue-only comments,
unauthorized actors, stale SHAs, ineligible findings, insufficient rationale,
invalid/overlong expiry, and conflicting data. Editing, deleting, or allowing
an acceptance to expire causes revalidation and can return the gate to red.
The [exception record template](templates/exception-record.yml) is a planning
aid; the native GitHub PR comment is the authoritative submitted decision.

Exception acceptance does not replace independent code review and does not
declare compliance.

## Success measures

Measure a baseline and a trial; do not report targets as achieved results.

- Time from PR open to complete same-SHA evidence.
- Human review minutes per PR.
- Material findings found before merge.
- Percentage of `unknown`/`exception` findings explicitly dispositioned.
- Rework after first evidence review.
- Percentage of merges with a valid final-SHA evidence artifact and independent
  approval.
- Rate of stale-SHA or unauthorized disposition attempts correctly rejected.

## Governance and data boundaries

- Synthetic application, identities, policy, and findings only.
- Never place secrets, customer content, tenant URLs, or sensitive source text
  in prompts, canvas state, comments, fixtures, or screenshots.
- Reviewer agents advise; deterministic code computes the gate.
- Analysis receives no secrets and no write token. Write-capable workflows run
  trusted code and validate live GitHub state.
- Evidence is commit-bound and policy-bound, but artifact retention is finite.
- GitHub checks, commits, comments, reviews, and artifacts are authoritative;
  the Evidence Board is mutable.
- No compliance, security, provenance, authorship, or suitability claim is
  universal. Accountable humans interpret evidence in their own context.

## Limitations

- This prototype covers one GitHub repository and a small synthetic policy.
- The working MVP has no live personal reviewer automations. Its three reviewer
  sessions and Evidence Assembler are manually started after deterministic
  checks complete.
- A disabled private-lab permission canary proves PR automation dispatch and the
  current unsafe effective tool boundary; it is not a reviewer result or
  automation-as-code.
- Automation prompt templates remain blocked setup/product-feedback inputs until
  host-injected mutation tools can be removed and verified.
- Deep links and installed-agent launches require user review and confirmation.
- External tool/model origin may be self-declared or unknown.
- npm advisory availability, runner/network health, and report quality may
  produce `unknown`.
- A green gate proves only that the configured rules were satisfied for the
  identified SHA and evidence validity window.
- The canvas is mutable and cannot serve as a locked audit snapshot.
- GitHub plan, organization, ruleset, App, and preview-feature availability can
  differ.
- No automatic merge, release, legal interpretation, or exception approval is
  provided.

## Troubleshooting

- **Check is missing:** run a PR once, confirm Actions are enabled, then add the
  exact check name `AgentProof / gate` to the ruleset.
- **Gate says stale:** compare the PR's current 40-character head SHA with the
  evidence and comment; rerun and re-record the decision for the new SHA.
- **Collector is `unknown`:** inspect the workflow log and machine-readable
  report; do not convert tool/network failure into pass.
- **Reviewer is absent from the PR automation picker:** select the repository
  project first and confirm the profile exists on its default branch. If it
  remains absent, start a manual installed-agent session or confirmed deep link.
- **Automation still exposes built-in mutation tools:** disable it immediately.
  The 2026-09-03 canary still saw `functions.apply_patch` and `functions.bash`
  after every selectable mutation tool was removed. Prompt instructions are not
  a permission boundary.
- **Manual reviewer has the wrong SHA:** discard its output and start a fresh
  session only after the current deterministic check completes.
- **Plugin/canvas appears cached:** remove the development install, reinstall
  the current plugin version, and verify the built extension entry.
- **Mixed-SHA assembly:** discard old fragments and rerun every specialist
  against the live head.

## Adaptation, demo, and cleanup

- Customer policy and permission adaptation:
  [customer adaptation guide](templates/customer-adaptation-guide.md)
- Exact competition sequence: [storyboard](demo/storyboard.md) and
  [runbook](demo/runbook.md)
- Clearly labeled continuity assets: [fallback guidance](demo/fallback/README.md)
- Remove the manual sessions, plugin, ruleset, branches, artifacts, disabled
  permission canary, and synthetic repositories by following
  [cleanup](docs/cleanup.md).

## Provenance and license

Original additions, research inputs, generated scaffolds, dependency licenses,
and media restrictions are recorded in
[starting assets](provenance/starting-assets.md) and
[dependency licenses](provenance/dependency-licenses.md). AgentProof is
licensed under [MIT](LICENSE).

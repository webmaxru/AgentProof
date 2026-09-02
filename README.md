# AgentProof

> Every AI-assisted change earns commit-bound evidence and an explicit human
> decision before it can merge.

AgentProof is a model-neutral field kit for a synthetic expense-approval
repository. Deterministic collectors evaluate tests, dependency risk, and a
data-retention declaration for one pull-request head SHA. GitHub publishes the
required `AgentProof / gate` check; specialist Copilot App sessions explain the
evidence; a release manager decides whether to remediate or accept an eligible,
bounded exception.

AgentProof produces evidence, not a legal, privacy, security, or regulatory
certification. The demo contains no customer data.

## Roles

| Role                                 | Responsibility                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Developer or agent operator          | Opens the PR, declares known assistance, and remediates findings.                                             |
| Test, security, and policy reviewers | Read the same SHA-bound facts and publish advisory specialist notes. They cannot approve exceptions or merge. |
| Release manager                      | Records an authorized, reasoned disposition for an eligible finding.                                          |
| Independent reviewer                 | Reviews the resulting code and approves the PR; must not be the author or automation owner.                   |
| Repository administrator             | Protects workflows and policy, configures the ruleset, and scopes App/automation access.                      |
| Field practitioner                   | Installs the kit and adapts its synthetic policy to a customer-approved use case.                             |

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
          specialist App sessions            authorized PR comment
                    |                                   |
                    +----------> Evidence Board <-------+
                                  (mutable view)

Authoritative record: GitHub commit, check, PR comments/reviews, and evidence artifact
```

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
  extensions, and automations enabled for the intended users.
- Permission to manage repository Actions and rules, plus a distinct reviewer
  account or team such as `<RELEASE_REVIEWER_OR_TEAM>`.
- Only synthetic, non-secret demo data.

Product surfaces and plan entitlements change. Recheck the current
[GitHub Copilot App documentation](https://docs.github.com/en/copilot/how-tos/github-copilot-app)
before a customer deployment or recording.

## Install and verify

```bash
git clone https://github.com/<OWNER>/<REPO>.git
cd <REPO>
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
   `AgentProof / gate` check becomes selectable.
5. Create a ruleset for `<DEFAULT_BRANCH>` that requires:
   - pull requests;
   - `AgentProof / gate`;
   - at least one approval from someone other than the author/automation owner;
   - stale approval dismissal;
   - code-owner review for workflows, policy, plugin, and evidence code;
   - resolved conversations; and
   - no bypass except a documented break-glass group.
6. Limit Actions to approved, SHA-pinned actions and retain the default
   read-only workflow token unless an individual workflow explicitly needs
   more.

Exact instructions and acceptance tests are in
[GitHub setup](docs/github-setup.md).

## Copilot App and automation setup

Install the local/repository plugin through the Copilot App, then verify that
the Test Reviewer, Security Reviewer, Policy Reviewer, Evidence Assembler, two
skills, and Evidence Board are discoverable.

```text
copilot plugin install ./plugin
```

For a cached development install, uninstall `agentproof` and reinstall the
local path. Plugin installation—whether initiated by command, marketplace, or
deep link—still requires the user's authorized confirmation.

Create **three separate** PR-triggered cloud automations from:

- [Test Reviewer prompt](templates/automations/test-reviewer.md)
- [Security Reviewer prompt](templates/automations/security-reviewer.md)
- [Policy Reviewer prompt](templates/automations/policy-reviewer.md)

Scope each to `<OWNER>/<REPO>`, PR opened/synchronized events, and only the read
and PR-comment tools listed in the template. Cloud automations are personal,
stored outside Git, and not installed by these Markdown files. Repository
templates are reviewable setup inputs only. App deep links prefill supported
flows but require the user to inspect and confirm the action; they never
silently install a plugin, create an automation, or start a session.

Follow [automation setup](docs/automation-setup.md). Use
[enterprise settings](docs/enterprise-settings-example.md) only as an example:
centrally managed App settings and each automation's selected tool scope are
separate control layers.

## End-to-end workflow

1. Open or synchronize a PR. Keep exactly one origin classification in the PR
   template: `github-attributed`, `self-declared`, or `unknown`. This is not
   universal model provenance.
2. `AgentProof Analysis` executes the untrusted subject in an ephemeral runner
   with no secrets and read-only repository/PR access. It emits normalized raw
   evidence even when a finding blocks.
3. `AgentProof Publish` validates repository, PR, workflow, schema, base SHA,
   and live head SHA; applies protected-base policy; and publishes one
   `AgentProof / gate` check plus one marker-delimited PR summary.
4. The three personal App automations open visible, isolated specialist
   sessions. Each resolves the current head SHA, stays within its specialty,
   refuses stale/mixed evidence, and posts one advisory result.
5. Run the Evidence Assembler manually after all three finish. It rejects mixed
   SHAs and loads one document into the Evidence Board.
6. A human chooses remediation or, for an exceptionable finding only, records a
   bounded exception on the PR.
7. A remediation commit creates a new head SHA. Earlier dispositions, evidence,
   and stale approvals no longer satisfy the new revision.
8. Evidence reruns. Record any still-needed exception against the new SHA.
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
- App cloud automations are personal, single-repository scoped, and stored
  outside Git; templates do not provide automation-as-code or central history.
- Deep links require confirmation.
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
- **Automation did not start:** verify its owner still has access, the personal
  automation is enabled, the repository/event/path filter matches, and the
  trigger author has write access where that safety default applies.
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
- Remove the personal automations, plugin, ruleset, branches, artifacts, and
  synthetic repository by following [cleanup](docs/cleanup.md).

## Provenance and license

Original additions, research inputs, generated scaffolds, dependency licenses,
and media restrictions are recorded in
[starting assets](provenance/starting-assets.md) and
[dependency licenses](provenance/dependency-licenses.md). AgentProof is
licensed under [MIT](LICENSE).

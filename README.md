# AgentProof

> Commit-bound evidence, explicit human decisions, and independent review for
> AI-assisted changes.

AgentProof is a reusable release-evidence kit, not an application. Deterministic
collectors produce evidence for one pull-request head SHA. A trusted evaluator
applies protected-base policy and publishes `AgentProof / gate`. Read-only
specialists explain the evidence; accountable humans decide whether to remediate
or accept an eligible exception. Independent code review remains a separate
requirement enforced by the target repository's rules.

The Experience is built around the Evidence Board canvas: it is the release
control room, not a side panel. It turns the same SHA-bound evidence into a
clear, decision-ready narrative that an engineering lead and a business owner
can both understand in under a minute.

Concrete application, demo, and hackathon resources live in the
[reference implementation](https://github.com/webmaxru/agentproof-demo).

AgentProof reports bounded evidence, not a legal, privacy, security, regulatory,
authorship, or release-suitability certification.

## Packaged capabilities

| Component                                          | Capability                                                                                                                                   |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/evidence-core`                           | Versioned contracts, canonical digests, policy evaluation, disposition validation, and same-SHA assembly.                                    |
| `packages/evidence-cli`                            | Trusted Vitest/coverage collection, root-lockfile npm audit, retention declarations, origin parsing, and analyze/evaluate/assemble commands. |
| `templates/github-workflows` and `.github/scripts` | Deployable read-only analysis, trusted publication, authorized-comment processing, and revalidation.                                         |
| `plugin`                                           | Test, security, and policy reviewers; Evidence Assembler; two skills; mutable Evidence Board.                                                |
| `policy`                                           | Schemas and a starting policy to adapt on the protected base, never through the PR being evaluated.                                          |
| `templates` and `docs`                             | Integration, least-privilege, exception, independent-review, and adoption guidance.                                                          |

Synthetic fixtures exercise contract and failure behavior. They are not live
scanner results or evidence that a target repository's controls are deployed.
Only toolkit CI is active here. The application-gate workflows are templates to
install deliberately in a consuming repository.

## How it works

```text
untrusted PR head
      |
      v
read-only deterministic analysis --> raw evidence for the full head SHA
                                             |
protected-base policy and evaluator --------+
                                             v
                                    AgentProof / gate
                                      |            |
                            read-only reviewers   human PR disposition
                                      |
                            manual Evidence Assembler
                                      |
                              mutable Evidence Board

GitHub rules require both a satisfactory gate and independent human review.
GitHub checks, comments, reviews, artifacts, and repository rules are authoritative.
```

Analysis may execute untrusted test/application code, so it runs without secrets
or write credentials. The write-capable publisher never executes PR code. A new
head SHA invalidates prior evidence and dispositions; stale approval dismissal
must also be enabled in the target repository.

See [architecture](docs/architecture.md), [evidence contract](docs/evidence-contract.md),
and [governance and threat model](docs/governance-and-threat-model.md).

## Install and verify the kit

Requires Node.js 22 or later, npm, Git, and access to this repository:

```bash
git clone https://github.com/webmaxru/AgentProof.git
cd AgentProof
npm ci --ignore-scripts
npm run check
npm run test:integration
npm run agentproof -- --help
```

These commands check the toolkit, not a consuming application's GitHub controls.
Toolkit protection uses the separate
[CI-only ruleset payload](.github/rulesets/agentproof-toolkit.json), with
independent code-owner review and no bypass. Application adoption retains
[both required checks](.github/rulesets/agentproof.json); CI-only toolkit
protection must not replace an application's evidence gate.
For application integration, follow [GitHub setup](docs/github-setup.md) and
the [CLI contract](packages/evidence-cli/README.md). Start with synthetic,
non-secret content in a disposable target repository.

The workflow defaults to an application at the repository root. A shared
protected setting selects a nested application when needed. The trusted
collector uses `tests/**/*.test.ts` and `src/**/*.ts`, not the PR's npm test
script or Vitest configuration. Audit always uses the repository-root lockfile.
Review these assumptions before adapting an existing application.

As of 2026-10-01, this public toolkit repository has native default-branch
protection requiring strict CI, independent code-owner review, stale-review
dismissal, last-push approval, resolved threads, and no bypass. Its Actions
settings require the four reviewed full-SHA action pins, read-only default
workflow tokens, and no automated PR approval. A distinct human code owner is
still required; see [safe onboarding](docs/github-setup.md#1-check-prerequisites-and-enforcement-entitlement).
The exact-run automatic-refresh repair remains a reviewable proposal until
humans deploy it to a protected base and verify the live path. Neither public
visibility nor local passing tests complete that rollout.

## Install the Copilot plugin

```text
copilot plugin marketplace add webmaxru/AgentProof
copilot plugin install agentproof@agentproof-marketplace
```

Review and confirm the approved source and version. For local development,
`copilot --plugin-dir ./plugin` loads the checkout. See the
[plugin guide](plugin/README.md) for cache updates, builds, and canvas actions.
Installation alone does not establish a safe reviewer runtime.
Until this migration is human-reviewed and merged, the default-branch
marketplace can still describe the previous package. To evaluate the proposed
kit before then, use an explicitly reviewed migration checkout with
`--plugin-dir`; do not present it as a migrated default-branch install.

After current-SHA deterministic evidence exists, manually start separate Test,
Security, and Policy Reviewer sessions with only the necessary same-repository
read tools. Then run the Evidence Assembler manually. Do not substitute a
general-purpose, mutation-capable agent for a read-only reviewer.

**Automated specialist reviewers remain blocked** whenever the effective runtime
exposes mutation, shell, secrets, deployment, or cross-repository capabilities.
A narrowed tool picker or read-only prompt does not prove enforcement. The
[automation templates](docs/automation-setup.md) are gated setup inputs, not
deployed controls. Cancel unsafe manual launches as well.

## Evidence and human decisions

| State       | Meaning                                                      | Gate effect                                           |
| ----------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| `pass`      | Valid positive evidence satisfies the protected rule.        | Non-blocking.                                         |
| `fail`      | Valid evidence violates the rule.                            | Blocking unless an eligible human exception is valid. |
| `unknown`   | Evidence is absent, malformed, unavailable, or inconclusive. | Blocking; never silently converted to pass.           |
| `exception` | An explicit policy-governed disposition is required.         | Blocking without a current authorized acceptance.     |

The starting policy requires a passing suite, a stable authorization-test marker,
at least 80% lines/functions/branches/statements coverage, production dependency
severity no higher than `moderate`, a complete retention declaration with at most
30 days, and declared assistance origin. **Test and dependency rules are
non-exceptionable.** Adapt the application-specific test identity deliberately;
do not weaken controls to manufacture a green result.

Prefer remediation. Only when protected-base policy permits it may an authorized
human post this PR comment:

```text
/agentproof accept-exception <FINDING_ID>
sha: <40_CHARACTER_HEAD_SHA>
reason: <specific rationale meeting the protected minimum>
expires: <YYYY-MM-DD>
```

The evaluator checks eligibility, actor permission, rationale, expiry, comment
state, and the exact SHA. Editing, deleting, expiring, or superseding a decision
can return the gate to blocking. An exception is neither a pass nor independent
PR approval. Agents must not accept exceptions, approve, merge, or release.

The Evidence Board can draft commands but cannot submit decisions. Its state is
mutable coordination data, not an audit ledger or a signature.

## Adoption boundaries

- Protect workflows, scripts, policy, contracts, and tooling with code-owner
  review and required checks on the target branch.
- Verify plan entitlements before claiming ruleset enforcement. Private
  repositories without the necessary entitlement may run checks but cannot
  enforce the required gate or independent review.
- Validate red-gate and missing-review blocking separately with distinct human
  identities. A local test pass does not prove either live control.
- Keep secrets, customer data, tenant links, and private evidence out of
  prompts, fixtures, logs, screenshots, and canvas state.
- Treat network/tool failure as `unknown`; artifact retention is finite.
- Record integration results for the actual target, full SHA, and reviewed
  tooling version. Historical trials are not transferable validation.

Use the [customer adaptation guide](templates/customer-adaptation-guide.md),
[enterprise settings example](docs/enterprise-settings-example.md), and
[removal guide](docs/cleanup.md). No automated merge or release is provided.

## License

AgentProof is licensed under [MIT](LICENSE). Direct dependencies and the
license-review procedure are documented in
[dependency licenses](docs/dependency-licenses.md).

# GitHub repository integration

Use a disposable target with synthetic, non-secret content first. `<OWNER>/<REPO>`
always means the consuming application repository, not the plugin source.
Replace `<DEFAULT_BRANCH>`, `<RELEASE_REVIEWER_OR_TEAM>`, and any approved
`<BREAK_GLASS_TEAM>` with the target's reviewed values.

## 1. Check prerequisites and enforcement entitlement

Requires Node.js 22+, npm, GitHub Actions, and a GitHub plan that can enforce
required checks and independent code-owner review for the target's visibility.
Inspect **Settings > Rules > Rulesets** before claiming enforced governance.

An API response such as `403: Upgrade to GitHub Pro or make this repository
public` is a deployment blocker for that control, not a successful setup. Keep
the repository private unless its owner explicitly authorizes disclosure.
Obtain the required plan or another approved enforcement mechanism; do not
weaken the gate, grant a bypass, or label an unenforced check as protection.

The PR author cannot provide independent review. The supplied `CODEOWNERS`
entry identifies a toolkit maintainer, not an independent reviewer for an
author-owned target PR. Configure a distinct person or team and verify that
GitHub recognizes them as a valid code owner with the necessary repository
access. An exception decision and independent approval are separate controls.

## 2. Integrate a reviewed toolkit revision

Keep Actions disabled while reviewing the initial integration. Pin the toolkit
to a reviewed full commit and record it in the target's integration record.
For an existing application, merge these files rather than overwriting its
manifests, source, tests, ownership rules, or existing workflows:

- `packages/evidence-core/` and `packages/evidence-cli/`;
- the four `templates/github-workflows/*.yml` files copied into the target's
  `.github/workflows/` under their existing filenames, plus `.github/scripts/`
  and `.github/rulesets/`;
- `policy/release-policy.yml` and its schema;
- the root `tsconfig.base.json` needed by the two package builds, adapting
  their `extends` paths if the application already owns that filename;
- the origin block from `.github/pull_request_template.md`; and
- protected-path ownership rules from `.github/CODEOWNERS`.

The Copilot plugin is installed separately; it is not necessary to copy its
canvas workspace into the application. Preserve the application's own root
`package.json` and add the two evidence packages to its npm workspaces, for example:

```json
{
  "workspaces": ["packages/*"],
  "scripts": {
    "agentproof": "node packages/evidence-cli/dist/cli.js",
    "build:evidence": "npm run build --workspace @agentproof/evidence-core --workspace @agentproof/evidence-cli"
  }
}
```

This is a fragment to merge, not a replacement manifest. Keep the application's
runtime dependencies in its manifest. Regenerate and commit the **root**
`package-lock.json` after manifest/workspace changes:

```bash
npm install --package-lock-only --ignore-scripts
npm ci --ignore-scripts
npm run build --workspace @agentproof/evidence-core --workspace @agentproof/evidence-cli
```

The CLI declares its own `@vitest/coverage-v8` development dependency; no
application fixture supplies it. The protected install must include development
dependencies. The kit's only active workflow is CI; copying the four templates
is an explicit deployment step, not something plugin installation performs.
Maintain the application's own build, lint, typecheck, and test
commands as well. If copying the toolkit's CI or ESLint configuration, add the
application's TS projects/scripts explicitly; workspace-only toolkit checks do
not automatically typecheck an app at the root.

## 3. Configure the application layout on the protected base

`--workspace` is always the repository root containing the committed lockfile.
The single shared `APPLICATION_PATH` setting in
`.github/scripts/workflow-helpers.mjs` selects the application:

```js
export const APPLICATION_PATH = ".";
```

For a nested application, use a contained relative path such as `"services/api"`.
The resolver writes this as `appPath`, and the publisher checks it against the
same protected setting. Do not take it from PR text, dispatch inputs, repository
variables, or a file in the PR checkout. Update the protected resolver and
publisher together, then recollect evidence. Metadata schema `1.0.0` still
accepts the legacy `samplePath` alias; conflicting aliases are rejected.

Default collector assumptions:

| Surface                      | Protected behavior                                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test files                   | `tests/**/*.test.ts`, relative to the application.                                                                                                               |
| Covered files                | `src/**/*.ts`, including `src/server.ts`.                                                                                                                        |
| Retention declaration        | `<APPLICATION_PATH>/config/data-handling.yml`.                                                                                                                   |
| Dependency audit             | Root `package.json` and root `package-lock.json`, including workspace production dependencies; not just the selected app.                                        |
| Tool/dependency installation | Trusted base checkout only, with `npm ci --ignore-scripts`. No installation from the PR.                                                                         |
| Test invocation              | Generated trusted Vitest configuration; PR npm scripts and Vitest configuration are not run.                                                                     |
| Staging                      | A fresh temporary directory outside the subject checkout; only the selected app tree and root `tsconfig.base.json` are copied, with trusted dependencies linked. |

For another test/source layout, adapt `generatedVitestConfig` in
`packages/evidence-cli/src/collector-workspace.ts` on the protected base.
Review include/exclude patterns as policy-relevant inputs. Application-specific
aliases, setup files, loaders, environments, or sibling workspace imports are
not auto-discovered; add and test a deliberate trusted adapter before relying on
the collector. Do not copy arbitrary executable configuration from the PR.

PR tests still execute untrusted code; a trusted runner is not a sandbox.
Lifecycle scripts remain disabled, so dependencies needing installation hooks or
new packages absent from the trusted checkout can produce `unknown`. A missing
app, out-of-repository symlink, missing report/provider, or unusable root audit
report must also remain `unknown`, not pass. Keep generated output under
`.agentproof/`; the collector's temporary staging directory is cleaned afterward.

## 4. Adapt policy and declaration deliberately

Review the starting policy with accountable owners. Keep test, authorization,
coverage, and dependency findings non-exceptionable. Define a stable behavioral
test ID for the target and bind the corresponding `requiredTests[].testId`.
For example, a real denial-path test may use:

```text
denies a non-approver [AP-ID:authorization.non-approver-denied]
```

A marker is not a substitute for assertions that exercise the actual control.
Absent or failing required tests must block. The starting coverage thresholds
are 80% for lines, functions, branches, and statements.

Add an application-owned declaration with reviewed values:

```yaml
schemaVersion: 1.0.0
classification: synthetic
retentionDays: 30
deletionMethod: automatic-expiry
owner: <ACCOUNTABLE_TEAM>
```

This declares handling; it does not prove deletion occurs. Keep protected policy
separate from PR-controlled declarations. The publisher evaluates the PR using
the policy at its protected base SHA, records that digest, and ignores policy
relaxations introduced by the same PR.

During an existing integration's layout migration, the old base may still
analyze the old path and block the migration PR. Do not manufacture an exception
for non-exceptionable findings or change the check to pass. Have the repository
owners review a staged migration under their existing change-control process.

## 5. Inspect and enable workflows

Before enabling Actions:

1. Review every trigger, job permission, and full-SHA third-party action pin.
2. Keep the default workflow token read-only and disallow Actions PR approval.
3. Confirm untrusted analysis receives no secrets or write token and that
   write-capable code never executes the PR checkout.
4. Protect workflows, scripts, policy, evidence packages, and any copied plugin
   with independent code-owner review.
5. Review contributor/fork eligibility, approved Actions, and artifact retention.

When using the Actions REST API, disable execution with `{"enabled": false}`
alone. Combining `enabled: false` with `allowed_actions` returns HTTP 409:
`You can't specify allowed_actions unless enabled is true.`

For an **empty target repository**, finish the review before publishing any
workflow-bearing commit, then configure these endpoints in order:

1. `PUT /repos/<OWNER>/<REPO>/actions/permissions/workflow`: set
   `default_workflow_permissions: "read"` and
   `can_approve_pull_request_reviews: false`.
2. `PUT /repos/<OWNER>/<REPO>/actions/permissions`: set `enabled: true`,
   `allowed_actions: "selected"`, and `sha_pinning_required: true`.
3. `PUT /repos/<OWNER>/<REPO>/actions/permissions/selected-actions`: set
   `github_owned_allowed: false`, `verified_allowed: false`, and
   `patterns_allowed` to the exact reviewed action references, each pinned to a
   full commit SHA.
4. Read back the effective settings and selected-action list before pushing the
   reviewed baseline. A failed API request is not a partially successful setup.

Do not apply this empty-repository sequence blindly to an existing integration.
Inventory its current workflows, triggers, and allowlist, and arrange an
owner-approved rollout that cannot execute unreviewed code during intermediate
configuration states.

| Workflow                 | Trigger                                            | Writes                                                     |
| ------------------------ | -------------------------------------------------- | ---------------------------------------------------------- |
| `AgentProof Analysis`    | Eligible PR opened/synchronized; trusted dispatch  | Raw artifact, no repository mutation.                      |
| `AgentProof Publish`     | Successful analysis workflow completion            | Validated check, marker-delimited summary, final artifact. |
| `AgentProof Disposition` | PR comment create/edit/delete; PR metadata refresh | Invalidates and dispatches current-head analysis.          |
| `AgentProof Revalidate`  | Every six hours or manual dispatch                 | Dispatches current open-PR analysis.                       |

Automatic untrusted execution is limited to `OWNER`, `MEMBER`, and
`COLLABORATOR` author associations. Inspect the actual protected workflow before
using manual dispatch for another contributor. `Analysis: success` means a raw
document was produced; it does **not** mean the gate or collectors passed.

## 6. Seed the check and configure required review

Open a harmless target PR after integration reaches its protected default
branch. Inspect the exact check `AgentProof / gate` and download
`agentproof-evidence-pr-<PR_NUMBER>-<FULL_HEAD_SHA>`. Verify repository, PR, full
base/head SHAs, protected policy digest, findings, and artifact digest.

Check Run and Actions workflow-run IDs are different. GitHub may rewrite the
check's `details_url` to `https://github.com/OWNER/REPO/runs/CHECK_ID`; do not use
that ID with the Actions workflow-run API. Resolve the publisher from the
`[Workflow run]` footer in the genuine current-head check's `output.summary`
and the final artifact's `workflowRunUrl`, not from `details_url`. Independently
verify the expected GitHub Actions app, run repository/ID/name/path/event,
artifact identity, subject SHAs, and canonical digest against native GitHub
records and the protected workflow. A URL match alone is not provenance.

Create an active ruleset for `<DEFAULT_BRANCH>` requiring PRs, the exact check,
at least one independent approval, code-owner review, stale approval dismissal,
resolved conversations, and protection against deletion/force-push. Allow no
bypass unless an accountable owner has approved a separate break-glass process.
Do not select a similarly named workflow job instead of the published Check Run.

A green gate with missing independent review must remain blocked. Approval with
a red gate must also remain blocked. When plan entitlement or a separate human
identity is unavailable, record those cases as **blocked/not verified**.

## 7. Target validation record

Local toolkit tests cover contract behavior and root/nested collector layouts.
They do not establish live GitHub enforcement, App permissions, or human actions.
Historical validation on a different repository, host, version, or SHA is not
evidence for this installation.

Keep a non-sensitive record in the target's approved GitHub issue or PR:

```text
Target: <OWNER>/<REPO>
Toolkit commit: <FULL_TOOLKIT_COMMIT_SHA>
Application path and trusted test/coverage globs: <VALUES>
Base/head SHAs: <FULL_BASE_SHA> / <FULL_HEAD_SHA>
Node/npm/plugin/host versions: <VERSIONS>
Exact commands, exit codes, Check Run and artifact references: <RECORDS>
Setup deviations: <PATHS, BUILD/DEPENDENCY REQUIREMENTS, PLAN LIMITATIONS>
Human-control results and outstanding owners: <VERIFIED, FAILED, BLOCKED, NOT RUN>
```

Exercise disposable PRs independently:

1. Passing behavior, dependency, coverage, declaration, and origin evidence.
2. Failing tests, missing stable ID, low coverage, adverse dependency evidence,
   incomplete declaration, and unavailable/malformed collectors.
3. A PR that tries to relax its own policy while violating protected-base rules.
4. Malformed, unauthorized, stale, expired, edited, and deleted dispositions.
5. A valid **human-submitted** eligible exception for the exact head SHA.
6. A new commit invalidating previous evidence, dispositions, and approvals.
7. Red-gate and missing-independent-review enforcement as separate cases.
8. Overlapping runs unable to publish success for an obsolete head.
9. Effective reviewer tools excluding mutation, shell, and cross-repository
   capabilities; otherwise keep reviewer automations disabled.

Do not ask an agent to impersonate the human actor in cases 5-7. Leave missing
cases explicit instead of claiming complete live human-control validation.
A protected release environment is an optional, separately validated post-merge
control, not a substitute for PR review or this check.

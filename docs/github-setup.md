# GitHub repository setup

Use a private, synthetic test repository first. Replace every placeholder:

- `<OWNER>/<REPO>`: target repository.
- `<DEFAULT_BRANCH>`: normally `main`.
- `<RELEASE_REVIEWER_OR_TEAM>`: independent code owner/reviewer.
- `<BREAK_GLASS_TEAM>`: optional, tightly controlled ruleset bypass actor.

## 1. Push and inspect the protected base

```bash
git remote add origin https://github.com/<OWNER>/<REPO>.git
git push -u origin <DEFAULT_BRANCH>
```

Before enabling Actions:

1. Inspect every `.github/workflows/*.yml` permission and trigger.
2. Verify every third-party action is pinned to a reviewed full commit SHA.
3. Confirm untrusted analysis receives no secrets/write token.
4. Confirm write-capable publisher/disposition code never executes PR code.
5. Replace the demonstration identity in `.github/CODEOWNERS` with
   `<RELEASE_REVIEWER_OR_TEAM>`.
6. Protect `.github/workflows/`, `.github/scripts/`, `policy/`,
   `packages/evidence-core/`, `packages/evidence-cli/`, and `plugin/`.

## 2. Configure Actions

In **Settings → Actions → General**:

- allow only actions approved by the organization;
- keep workflow permissions read-only by default;
- do not allow Actions to approve pull requests;
- review fork/private-repository execution policy;
- retain logs/artifacts according to approved policy; and
- never add customer or production secrets to this synthetic repository.

The checked-in workflows request job-specific permissions. Organization policy
may further restrict them.

Expected flow:

| Workflow                 | Trigger                                            | Writes                                           |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------ |
| `AgentProof Analysis`    | PR opened/synchronized; trusted manual dispatch    | Raw artifact only; repository/PR read            |
| `AgentProof Publish`     | Successful analysis completion                     | Required check, one PR summary, final artifact   |
| `AgentProof Disposition` | PR comment create/edit/delete; PR metadata refresh | Invalidates and dispatches current-head analysis |
| `AgentProof Revalidate`  | Every six hours/manual                             | Dispatches analysis for current open PRs         |

## 3. Seed the stable check

Open a harmless PR after Actions are enabled. Wait for the check named exactly:

```text
AgentProof / gate
```

Do not configure a similarly named workflow job as the required check. Inspect
the Check Run summary and download
`agentproof-evidence-pr-<pullRequestNumber>-<headSha>` to confirm it names the
current repository, PR, base policy, and full head SHA.

## 4. Create the ruleset

Open:

```text
https://github.com/<OWNER>/<REPO>/settings/rules
```

Create an active branch ruleset targeting `<DEFAULT_BRANCH>`:

- require a pull request before merge;
- require at least one approval;
- dismiss stale approvals on new commits;
- require review from Code Owners;
- require all conversations resolved;
- require `AgentProof / gate`;
- block force pushes and deletion;
- restrict bypass to `<BREAK_GLASS_TEAM>` if the organization has an approved
  emergency process; otherwise allow no bypass.

Ensure the author, automation owner, and bot cannot satisfy the independent
approval. GitHub plan/organization options vary; equivalent protected-branch
controls are acceptable only if they enforce the same tested behavior.

## 5. Verify policy integrity

Submit a test PR that modifies both risky code and
`policy/release-policy.yml`. Confirm the check applies the policy from the PR's
protected base SHA, records its digest, and does not let the PR relax its own
gate. Confirm protected paths request the configured code owner.

## 6. Acceptance tests

Run these against disposable PRs:

1. Unsafe PR produces dependency `fail`, required authorization-test-marker
   `fail`, and retention `unknown`.
2. Malformed and unauthorized exception comments do not move the gate.
3. A valid comment applies only to an eligible finding and exact current SHA.
4. A remediation commit makes old evidence, dispositions, and approval stale.
5. Editing, deleting, or expiring acceptance returns the gate to blocking.
6. Green gate without independent approval cannot merge.
7. Approval with a red gate cannot merge.
8. Overlapping runs cannot publish a green result for an obsolete SHA.

Record non-sensitive screenshots only after hiding account notifications and
unrelated repository data. GitHub records are authoritative; screenshots are
demonstration media.

## Optional protected release environment

A protected environment can add a final post-merge human release approval.
Keep it distinct from PR approval and `AgentProof / gate`. It is optional and
must not be described as part of the working MVP unless tested on the target
GitHub plan.

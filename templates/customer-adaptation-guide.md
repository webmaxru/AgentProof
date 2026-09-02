# Customer adaptation guide

Do not copy the synthetic policy into production unchanged. AgentProof is a
workflow pattern; accountable customer owners must define the rules, data
boundary, permissions, retention, and evidence that are appropriate to one
repository class.

## 1. Define the bounded use case

| Decision                                | Customer-approved value |
| --------------------------------------- | ----------------------- |
| Repository class and owners             | `<VALUE>`               |
| Change/release boundary                 | `<VALUE>`               |
| Data classification and prohibited data | `<VALUE>`               |
| Regulatory/legal interpretation owner   | `<PERSON_OR_TEAM>`      |
| Release manager(s)                      | `<PERSON_OR_TEAM>`      |
| Independent reviewer(s)                 | `<PERSON_OR_TEAM>`      |
| Automation owner and backup             | `<PERSON_OR_TEAM>`      |
| Evidence/log/artifact retention         | `<VALUE>`               |
| Recovery and break-glass process        | `<REFERENCE>`           |

Exclude customer data from the first trial. If later evidence contains source,
logs, vulnerability details, or personal data, complete the customer's data
classification, residency, access, retention, deletion, and incident reviews
before enabling it.

## 2. Adapt protected policy

For every rule record:

| Field                      | Question                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------- |
| Stable ID                  | Will the same rule retain identity across commits and versions?                     |
| Positive evidence          | What exact machine-readable result earns `pass`?                                    |
| `fail` condition           | What observed fact violates the rule?                                               |
| `unknown` condition        | Which missing/tool/network/schema states must block?                                |
| Severity                   | Who approved the mapping and review cadence?                                        |
| Exceptionable              | Can a human ever accept it? Critical controls should normally be non-exceptionable. |
| Authorized actor           | Which repository permission/team is required?                                       |
| Rationale                  | Minimum useful content without exposing sensitive data?                             |
| Maximum expiry             | How long may risk remain before fresh review?                                       |
| Remediation/evidence owner | Who acts and who verifies?                                                          |

Keep policy on the protected base branch, validate it against schema, record its
digest, and prevent a PR from evaluating itself against a weakened policy.
Passing means only that these configured rules passed for the identified SHA.

## 3. Replace synthetic collectors deliberately

- Use machine-readable reports with tool/version/time/source identifiers.
- Preserve exit codes and advisory/rule IDs.
- Turn absence, parse failure, stale data, and service failure into `unknown`.
- Bound retained source excerpts; prefer references/digests over full content.
- Test clean, failing, unavailable, malformed, and tampered cases.
- Do not equate a scanner result with legal, privacy, security, residency, or
  compliance certification.

## 4. Set least privilege

Review the actual GitHub workflow permissions and each live personal
automation's selected tools. Maintain the split:

- untrusted PR execution: no secrets and read-only;
- trusted publisher: only required check/comment writes and no PR execution;
- specialist automations: repository/PR/check/evidence read plus one bounded
  comment write;
- no agent push, merge, approval, exception acceptance, secret access,
  deployment, or cross-repository access.

Enterprise-managed App settings and per-automation tool scope are separate.
Automations are personal and stored outside Git; define ownership transfer and
periodic review.

## 5. Design human decisions

Prefer remediation. For any exceptionable rule, define authorized actors,
minimum rationale, maximum duration, evidence visibility, conflicting-decision
handling, and periodic revalidation. Bind every decision to finding ID and full
head SHA. A different person must independently approve the PR.

Canvas controls may draft a command but cannot silently accept or become the
authoritative approval. GitHub remains the system of record.

## 6. Pilot and measure

Run on disposable/synthetic PRs first:

- red gate and missing independent review block separately;
- unauthorized, malformed, stale, overlong, edited, deleted, and expired
  decisions remain blocking;
- a new commit invalidates decisions and approvals;
- tool outage becomes `unknown`;
- mixed/tampered evidence is rejected; and
- no sensitive content reaches prompts, comments, artifacts, or screenshots.

Capture baseline and trial values for evidence latency, human review time,
pre-merge findings, explicitly dispositioned unknowns, rework, complete
final-SHA evidence, and rejected stale/unauthorized decisions. Do not call a
target an achieved outcome.

## 7. Production readiness decision

Obtain named approval from repository/platform, security, privacy/legal/data,
and release owners as applicable. Record remaining risks, support ownership,
retention/deletion, monitoring, product-version dependencies, rollback, and
training. No adaptation makes AgentProof's compliance or provenance claims
universal.

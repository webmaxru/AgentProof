# Enterprise settings example

This is a **non-universal example**, not an exported policy, guaranteed product
schema, or compliance baseline. Names and availability vary by GitHub plan and
the current Copilot App. An enterprise administrator must translate the intent
into approved live settings.

## Layer 1: centrally managed App guardrails

| Area                 | Example intent                                                                                                         | Verification evidence                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Plugins/marketplaces | Allow the reviewed AgentProof source/version only; block unapproved marketplaces.                                      | Admin settings screenshot/export plus installed plugin version. |
| MCP                  | Deny by default; allow only approved servers with reviewed data boundaries. AgentProof MVP needs no customer-data MCP. | Effective MCP allowlist and user test.                          |
| Models/BYOK          | Use organization-approved defaults/providers; do not treat model selection as evidence provenance.                     | Effective model policy, without keys.                           |
| Permissions          | Require confirmation for privileged operations and preserve least privilege.                                           | Effective App permission behavior.                              |
| Sandbox/network      | Prefer isolated cloud execution and approved egress; keep untrusted PR analysis secret-free.                           | Test session and network policy.                                |
| Data/retention       | Apply approved session/log retention and regional handling for the intended data class.                                | Enterprise policy reference.                                    |
| Plugin distribution  | Publish through an approved internal path and document owner/support/version.                                          | Marketplace entry or controlled install record.                 |

Do not put tokens, tenant URLs, provider keys, customer identifiers, or private
policy values in this repository or screenshots.

## Layer 2: each personal automation

Central settings do not automatically prove least privilege for an automation.
For each of the three AgentProof automations separately record:

```yaml
owner: <AUTOMATION_OWNER>
repository: <OWNER>/<REPO>
events: [pull_request_opened, pull_request_synchronized]
execution: cloud
allowed_reads:
  - repository contents
  - pull request metadata and diff
  - checks and same-SHA evidence artifacts
allowed_writes:
  - update one marker-delimited pull request review comment
denied:
  - push or branch mutation
  - merge or approval
  - issue mutation
  - secret access
  - deployment
  - cross-repository access
  - unrelated MCP and broad shell/network tools
prompt_source: templates/automations/<REVIEWER>.md@<COMMIT_SHA>
reviewed_at: <YYYY-MM-DD>
reviewer: <ADMIN_OR_SECURITY_REVIEWER>
```

This YAML is an inventory example only; it does not create an automation.
Automations are personal and stored outside Git.

## Separation-of-duty example

- Developer/agent operator opens and remediates the PR.
- Automation owner operates read/comment-only specialist sessions.
- Release manager may accept a policy-eligible bounded exception.
- A different code owner/reviewer approves the PR.
- Repository administrator manages rules and emergency bypass.

If the organization cannot keep the author/automation owner separate from the
independent reviewer, it must redesign the control rather than claim
independence.

## Validation before rollout

1. Confirm the effective enterprise settings using a non-production account.
2. Install the exact reviewed plugin version through a confirmed flow.
3. Inspect all three live personal automation configurations.
4. Prove an automation cannot push, merge, read secrets, or access another
   repository.
5. Prove the ruleset blocks red-gate and missing-review cases independently.
6. Review data classification, retention, incident response, accessibility,
   legal, and regional requirements with accountable owners.
7. Revalidate after product, model, plugin, prompt, permission, or owner change.

Passing this example does not establish universal security or compliance.

# AgentProof

AgentProof turns AI-assisted code from any model into a governed release
decision. On each pull request, deterministic collectors produce test,
dependency, and policy evidence bound to the exact head commit. Three
least-privilege GitHub Copilot App sessions review the same evidence as test,
security, and policy specialists. A mutable Evidence Board coordinates their
results; GitHub commits, checks, comments, reviews, and retained artifacts
remain authoritative.

Unresolved failures, unknowns, and exceptions block `AgentProof / gate`.
Eligible exceptions require an authorized, reasoned, expiring PR comment tied
to the current SHA. Any remediation commit invalidates the prior decision, and
repository rules still require independent human approval before merge.

The reusable kit includes an installable plugin, policy and evidence contracts,
automation prompts, setup and cleanup guides, templates, and a wholly synthetic
expense-approval scenario. It provides evidence—not universal provenance,
security assurance, or compliance certification.

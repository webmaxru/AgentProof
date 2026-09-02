# AgentProof

AgentProof is a model-neutral, SHA-bound release-evidence kit. PR-triggered
GitHub Actions deterministically publish `AgentProof / gate`, an artifact, and a
PR summary. That path succeeded in the private live repository on 2026-09-02,
and the plugin installed through its `agentproof-marketplace`.

The working MVP then requires a user to manually start three isolated, read-only
reviewer sessions through installed agents or confirmed deep links and manually
run the Evidence Assembler. The resulting Evidence Board is mutable; GitHub
records remain authoritative. No live personal reviewer automations are
claimed—the App picker did not expose the agents and defaulted to All tools, so
setup was canceled. Automation templates are future setup/product feedback.

`pass`, `fail`, `unknown`, and `exception` remain distinct. Unresolved findings
block; a new SHA invalidates prior evidence. Independent human approval is still
required. This is evidence, not provenance, security, or compliance
certification.

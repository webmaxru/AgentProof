# Scenario-specific comparison with Claude Code

The motivating, anonymized field scenario involved an application built with
Claude assistance whose team then sought independent release validation.
Claude Code and GitHub Copilot can both edit code, use MCP-based tools, and
participate in GitHub workflows; AgentProof does not claim superior code
generation or that Claude cannot implement a comparable workflow.

In the working MVP, PR-triggered GitHub Actions—not model judgment—compute the
SHA-bound `AgentProof / gate`, artifact, and PR summary. A user then manually
starts three isolated, read-only Copilot App reviewer sessions through installed
agents or confirmed deep links and manually runs the Evidence Assembler. Their
advice and mutable canvas stay in one GitHub-centered workspace, while native
GitHub records remain authoritative and a different human still approves.

AgentProof does not claim three live personal reviewer automations. On
2026-09-02, the App automation picker did not expose the installed reviewers and
defaulted to All tools, so setup was canceled; the prompt templates are future
setup/product feedback. The Claude-assisted PR is `self-declared` unless
verified platform attribution exists and is governed like Copilot-assisted,
local-model, or human-written code. This is not a universal provenance,
compliance, security, or code-quality claim.

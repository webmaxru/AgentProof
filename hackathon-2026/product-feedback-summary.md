# Bonus product feedback: effective permissions must match the picker

## Copy-ready feedback

We successfully selected AgentProof repository reviewer profiles in the GitHub
Copilot App automation picker and triggered them on pull-request opened and
synchronized events. The picker initially exposed 50 tools. We manually reduced
the selection to 21 read-only GitHub operations. At runtime, the session still
reported mutation-capable `apply_patch`, shell, and broader Actions tools,
including access outside the intended repository boundary.

AgentProof's permission canary returned `UNSAFE_TOOL_BOUNDARY`, made no review,
comment, commit, or repository change, and the automation was disabled.

For enterprise adoption, the App should provide:

1. a **select-none** control and administrator-approved least-privilege presets;
2. a pre-save **effective permission preview** that includes implicit/bundled
   tools, MCP/network scope, repository scope, and denied capabilities;
3. runtime enforcement that exactly matches that preview; and
4. versioned, administrator-visible automation configuration and ownership.

The safe default should be no capabilities. Prompt instructions are not a
permission boundary.

## Evidence

Full reproduction steps, impact, workaround, and related proposals are in
[`docs/product-feedback.md`](../docs/product-feedback.md).

This feedback describes one reproduced product behavior in a private synthetic
lab. It is not a claim that every tenant, release, or configuration behaves the
same way.

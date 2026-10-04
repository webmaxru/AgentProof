# Reviewer sessions and automation permission gates

AgentProof's `0.3.0` specialists use a separately enforced
[tool-free public-evidence-packet host](public-packet-review.md). The legacy
repository-reading manual App procedure and `0.2.1` profiles are deprecated and
unsupported. Packet-mode CLI results do not prove App isolation. The committed
automation templates are **blocked setup inputs**, not deployed reviewer
automations or automation-as-code.

Historical trials could select custom reviewers and dispatch PR events while
still exposing mutation, shell, and cross-repository tools despite a narrowed
picker. Those results establish a limitation, not a safe current installation.
Do not configure automated specialists until the actual target runtime can
exclude those capabilities.

## Public-packet host setup

1. Review the exact toolkit host code, plugin source, profile and native CLI versions.
2. Wait for deterministic evidence for the current full PR head SHA.
3. Independently resolve native public evidence/policy in the trusted host and
   obtain operator approval for the exact bounded public synthetic content.
4. Use only the explicitly named Public Packet specialist with zero tools.
   Native exclusions and native complete zero-tool/zero-call observations are
   mandatory; a picker or model self-report is not enough.
5. Stop if any callable tool, unsupported runtime, refusal, or missing native
   observation remains. Do not grant read tools to repair a tool-free rejection.
6. Preserve `pass`, `fail`, `unknown`, and `exception`. Missing, stale,
   malformed, or mixed-SHA evidence cannot support a pass.
7. The separate operator verifies public exports and current identity before
   protected wrapping/assembly and board loading. Do not use the legacy
   broad-tool assembler as an isolation shortcut. A new commit requires new
   evidence and review.

The plugin cannot approve, accept an exception, merge, or release. The Evidence
Board is mutable coordination state. GitHub checks, comments, reviews,
artifacts, and repository rules are authoritative.

## Automation save gate

The following legacy read-tool gates remain mandatory for any future,
separately designed App route. They are not sufficient to enable the new
zero-tool profiles, and CLI packet tests cannot satisfy them. No automation is
created or enabled by this repair; keep all unverified candidates blocked.

The files under `templates/automations/` describe a future target. Do not save
or enable a specialist automation unless every condition is verified:

- The exact reviewed custom agent, source, and version are identifiable.
- Tools can start from select-none or a reviewed least-privilege preset.
- Both permission preview and effective runtime expose only required,
  same-repository reads, with no implicit mutation or shell tools.
- Push, merge, approval, disposition, issue/branch mutation, workflow dispatch,
  secrets, deployment, unrelated MCP/network, and cross-repository access are
  absent.
- Events, author eligibility, repository, and path filters match the approved
  design.
- A human reviews the personal configuration and its outside-Git ownership,
  source revision, effective tools, validation date, and retention record.

An **All tools** default fails the gate. A narrowed picker also fails when host
built-ins exceed its apparent scope. Enterprise settings do not by themselves
prove an individual session's permissions.

Reviewer publication must remain separate: the reviewer returns a fragment
without calling mutation tools. Any future bounded publisher needs its own
explicitly reviewed design; do not grant the reviewer comment-write access.

## Permission-canary procedure

This is the legacy App negative-control procedure, not a packet-mode launcher.
Historical failures remain failures. A new profile/version needs separately
authorized target-host validation, not repeated retries until it says safe.

Use [the canary template](../templates/automations/permission-canary.md) only in a
disposable, synthetic target:

1. Select the intended custom profile and inspect its source/version.
2. Remove every mutation-capable selectable tool; record the effective scope.
3. Make the first instruction inspect available capability names without using
   tools. Any forbidden capability requires `UNSAFE_TOOL_BOUNDARY` and a stop.
4. If approved for testing, exercise the intended events and a new head SHA.
5. Confirm no comment, review, inline comment, commit, or other mutation occurred.
6. Disable any failed candidate. Retain only approved non-sensitive records.

A dispatching canary is not a working reviewer. Do not promote an unsafe canary
to a specialist automation. For a future fixed runtime, separately validate
each reviewer's stale-head behavior, unavailable-evidence `unknown` behavior,
and mixed-SHA assembly rejection before adoption.

## Confirmation and validation records

Deep links may prefill a supported draft or launch; they never silently install,
configure, or execute anything. Label generated links **review and confirm**.
Use only documented current flows, scoped to `OWNER/REPO`.

Record target, toolkit/plugin/host versions, full head SHA, effective tool names,
actual result, and remaining blockers in approved GitHub records. Do not copy
secrets, customer data, tenant links, or private evidence into prompts, canvas
state, fixtures, or logs. Never treat reviewer output as a legal or compliance
determination.

# AgentProof Copilot plugin

AgentProof packages three tool-free public-packet specialist profiles, a legacy
coordination profile, two release-evidence skills, and the Evidence Board canvas.
Deterministic repository code computes the gate; the plugin helps people inspect
and coordinate the evidence.

## Components

- `test-reviewer`: public-packet test and coverage notes; zero tools.
- `security-reviewer`: public-packet dependency notes; no scan or source/diff access.
- `policy-reviewer`: public-packet policy/provenance notes, not certification.
- `evidence-assembler`: legacy broad-tool coordination profile, unsupported without separately enforced host isolation; not part of packet mode.
- `release-evidence`: fail-closed evidence collection and review runbook.
- `exception-review`: strict, human-submitted disposition command runbook.
- `evidence-board`: mutable coordination canvas with five schema-validated actions.

The `0.3.0` specialists are named **AgentProof Public Packet
Test/Security/Policy Reviewer**, declare `tools: []`, and stop with
`UNSAFE_TOOL_BOUNDARY` if any callable tool is exposed or the boundary is
uncertain. The old `0.2.1` `read`/`search`/`github/*` mode is deprecated, not a
supported read-only runtime. The legacy assembler still declares broad tools;
do not mistake it for a narrowly scoped canvas-only agent.

Use the [trusted-host packet integration](../docs/public-packet-review.md) for
native source resolution, fixed CLI exclusions, native zero-tool/zero-call
verification, and freshness checks. The reviewer never fetches or self-attests
these facts. Profile installation alone does not activate this host integration,
prove App isolation, or satisfy any automation save gate. Live validation of the
revised profiles remains separate; unit fixtures are not native live proof.

## Install

For a live development load from the repository root:

```text
copilot --plugin-dir ./plugin
```

To install the published private repository marketplace:

```text
copilot plugin marketplace add webmaxru/AgentProof
copilot plugin install agentproof@agentproof-marketplace
```

Marketplace installs are cached; run `copilot plugin marketplace update
agentproof-marketplace` and `copilot plugin update agentproof` when validating a
new published version. Direct repository installs currently work but are
deprecated. Development `--plugin-dir` loads are live and take effect in the
next session.

The Evidence Board is the product hero. It is the decision surface that makes the
same-SHA release story visible, reviewable, and easy to explain in a live demo.
The canvas is the clearest artifact for judges and enterprise buyers because it
translates technical evidence into a release conversation they can read in
seconds.

The marketplace follows the default branch. Before the migration PR is merged
by a human, use the reviewed migration checkout with `--plugin-dir` rather than
claiming the default-branch install already contains these changes.

## Evidence Board actions

The canvas type is `agentproof-evidence-board`.

- `set_evidence(document)` validates and loads one evidence document.
- `get_evidence()` returns the currently loaded document and mutable board state.
- `select_finding({ "id": "..." })` selects an existing finding.
- `draft_disposition(input)` creates an exact PR comment command bound to the current head SHA.
- `clear_evidence()` clears the current board.

`set_evidence` accepts only `schemaVersion: "1.0.0"` / `documentType: "final"`, verifies the canonical artifact SHA-256, and rejects mismatched base-policy SHAs, finding/reviewer-note SHAs, mixed PR scopes, inconsistent gates, and older evidence updates. Historical dispositions may reference an older SHA so the board can show them as **stale**; they are never treated as effective.

The board cannot post a comment, approve, merge, or change the authoritative gate. GitHub checks, comments, reviews, artifacts, and commit SHAs remain authoritative.

The board opens empty unless an evidence document or an existing repository/PR
scope is supplied. The optional `useSample: true` input loads
`artifacts/contract-fixture.json`, a labeled **SYNTHETIC CONTRACT FIXTURE** using
`OWNER/REPO` placeholders and invented identities. It exercises all four states;
it is not a scan, live GitHub result, or release decision.

## Build and test

The runnable output is committed because plugin consumers do not install build dependencies:

```text
npm run --workspace @agentproof/evidence-board build
npm run --workspace @agentproof/evidence-board test
```

The build uses Node's built-in TypeScript type stripping and requires Node 22 or newer. A normal repository typecheck can also use `tsc -p plugin/extensions/evidence-board/tsconfig.json --noEmit` when the workspace TypeScript toolchain is installed.

## Runtime assumptions

The canvas adapter in `src/extension.ts` targets the Copilot SDK bundled with the September 2026 Copilot CLI/App:

- extensions register with `joinSession({ canvases: [createCanvas(...)] })`;
- the host resolves `@github/copilot-sdk/extension`, so it is intentionally not an npm dependency;
- the plugin manifest points at `extensions/`, whose immediate
  `evidence-board/` child contains the required `extension.mjs`;
- the build emits a root discovery wrapper that imports the same reviewed
  `dist/` runtime exercised by isolated tests;
- action handlers return raw values and throw `CanvasError` for structured failures;
- each canvas instance serves a tokenized URL from an ephemeral server bound only to `127.0.0.1`;
- durable mutable board state is stored under the session workspace's ignored `.agentproof/evidence-board/` directory and keyed by repository plus PR, never by panel instance ID.

The canvas API is experimental. SDK-specific registration and provider wiring stay in `src/extension.ts`; validation, projections, and reducer transitions have no SDK dependency and are unit-tested independently.

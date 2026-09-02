# AgentProof Copilot plugin

AgentProof packages four read-only reviewer profiles, two release-evidence skills, and the Evidence Board canvas. Deterministic repository code computes the gate; the plugin helps people inspect and coordinate the evidence.

## Components

- `test-reviewer`: reviews normalized test and coverage evidence.
- `security-reviewer`: reviews normalized dependency findings and the relevant diff.
- `policy-reviewer`: maps evidence to the protected policy without claiming certification.
- `evidence-assembler`: verifies one repository/PR/SHA/policy scope and loads the canvas.
- `release-evidence`: fail-closed evidence collection and review runbook.
- `exception-review`: strict, human-submitted disposition command runbook.
- `evidence-board`: mutable coordination canvas with five schema-validated actions.

All reviewer agents omit shell, edit, push, merge, approval, and GitHub mutation tools. The assembler additionally receives only the canvas discovery/open/action tools.

## Install

For a live development load from the repository root:

```text
copilot --plugin-dir ./plugin
```

To exercise the repository marketplace:

```text
copilot plugin marketplace add .
copilot plugin marketplace browse agentproof-marketplace
copilot plugin install agentproof@agentproof-marketplace
```

After publishing the private repository, install the plugin subdirectory with:

```text
copilot plugin install OWNER/REPOSITORY:plugin
```

Repository installs are cached; run `copilot plugin update agentproof` or reinstall when validating unpublished changes. Directory-sourced marketplace and `--plugin-dir` loads are live and take effect in the next session.

## Evidence Board actions

The canvas type is `agentproof-evidence-board`.

- `set_evidence(document)` validates and loads one evidence document.
- `get_evidence()` returns the currently loaded document and mutable board state.
- `select_finding({ "id": "..." })` selects an existing finding.
- `draft_disposition(input)` creates an exact PR comment command bound to the current head SHA.
- `clear_evidence()` clears the current board.

`set_evidence` accepts only `schemaVersion: "1.0.0"` / `documentType: "final"`, verifies the canonical artifact SHA-256, and rejects mismatched base-policy SHAs, finding/reviewer-note SHAs, mixed PR scopes, inconsistent gates, and older evidence updates. Historical dispositions may reference an older SHA so the board can show them as **stale**; they are never treated as effective.

The board cannot post a comment, approve, merge, or change the authoritative gate. GitHub checks, comments, reviews, artifacts, and commit SHAs remain authoritative.

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
- a plugin extension path names a directory containing `extension.mjs`, so the manifest points at `dist/`;
- action handlers return raw values and throw `CanvasError` for structured failures;
- each canvas instance serves a tokenized URL from an ephemeral server bound only to `127.0.0.1`;
- durable mutable board state is stored under the session workspace's ignored `.agentproof/evidence-board/` directory and keyed by repository plus PR, never by panel instance ID.

The canvas API is experimental. SDK-specific registration and provider wiring stay in `src/extension.ts`; validation, projections, and reducer transitions have no SDK dependency and are unit-tested independently.

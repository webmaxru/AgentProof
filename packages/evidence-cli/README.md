# `@agentproof/evidence-cli`

`--workspace` names the subject repository root. The application defaults to that
root; `appPath` selects a contained subdirectory. `npm audit` always reads the
repository-root `package.json` and `package-lock.json`, including workspace
production dependencies, regardless of the selected application.

## Analyze metadata

Workflow mode requires these identity fields:

```json
{
  "schemaVersion": "1.0.0",
  "repository": "OWNER/REPO",
  "pullRequestNumber": 1,
  "baseSha": "1111111111111111111111111111111111111111",
  "headSha": "2222222222222222222222222222222222222222",
  "appPath": "."
}
```

The SHAs are synthetic placeholders. Resolve actual identity from GitHub.
`appPath` is optional and defaults to `"."`; a nested example is `"services/api"`.
Schema `1.0.0` retains `samplePath` as a deprecated input alias. Either field is
accepted; if both are supplied, their values must match. New integrations should
use `appPath`. Existing integrations that relied on an implicit nested default
must now specify their path explicitly.

`pullRequestBody` defaults to `""`, producing unknown origin evidence. Optional
bounded audit fields are `pullRequestUrl`, `author`, `authorAssociation`,
`baseRef`, and `headRef`. Unknown properties, traversal, absolute paths, and
conflicting aliases are rejected. The machine-readable contract is
`schemas/analyze-metadata-v1.schema.json`; runtime validation also enforces
cross-field equality and distinct base/head SHAs.

Report mode requires `generatedAt`, `workflowRunUrl`, `origin`, `tools`, and
`sources`. Sources contain Vitest `reportPath`, `coveragePath`, and `command`;
npm-audit `reportPath` and `command`; and data-retention `declarationPath`.
Paths are repository-relative or `null`; commands contain `exitCode` and `error`.
Report mode does not run tools or turn supplied fixtures into live evidence.

## Trusted collection

Workflow mode resolves npm, Vitest, and the coverage provider from the trusted
CLI installation. It never runs subject npm scripts, loads the subject's Vitest
configuration, or installs subject dependencies. npm audit runs with
`--ignore-scripts --omit=dev --audit-level=high --json` at the repository root.

The selected application tree is copied into a fresh temporary directory outside
the subject checkout, with trusted dependencies linked. Subject dependency
directories, symlinks, Git metadata, generated output, and coverage are excluded.
Root `tsconfig.base.json` is copied when present. Staging is removed after
collection; the subject tree and tooling remain unchanged, and requested JSON
output may be written under the subject's `.agentproof/` directory.

The generated trusted configuration runs `tests/**/*.test.ts` in a Node
environment and measures all `src/**/*.ts`, including `src/server.ts`. It does
not infer aliases, setup hooks, environments, or sibling workspace imports from
the PR. Adapt `generatedVitestConfig` on the protected base for another layout
and test the adapter before adopting it. The declaration is read from
`<appPath>/config/data-handling.yml`.

The trusted checkout must be installed from its protected lockfile with
development dependencies, including this package's `@vitest/coverage-v8`.
Subject dependencies unavailable in that trusted installation produce a blocking
result, not an install. A nested standalone lockfile is not a substitute for the
root lockfile that audit consumes.

Missing tools, invalid application locations, absent/malformed reports, and
collector failures produce `unknown` findings with error diagnostics. `analyze`
still hashes and writes a valid raw artifact. Invalid top-level identity
metadata is a CLI error. A trusted runner does not make untrusted tests safe;
execute workflow-mode analysis only in an isolated, no-secret, read-only runner.

The deployable workflow templates use a single protected `APPLICATION_PATH` in
`.github/scripts/workflow-helpers.mjs` for metadata generation and publication
validation. See [application integration](../../docs/github-setup.md).

## Commands and exit codes

```text
agentproof analyze --workspace <repository-root> --metadata <json> --output <json>
agentproof evaluate --evidence <json> --policy <yml> --dispositions <json> --output <json>
agentproof assemble --fragments <final.json> <review.json...> --output <json>
```

Successful analysis/assembly exits `0`; evaluation exits `0` for a successful
gate and `2` for a valid blocking result. Input or engine errors exit `1`.
Analysis success is not a gate pass. Always evaluate with protected-base policy,
preserve all four finding states, and keep independent human review separate.

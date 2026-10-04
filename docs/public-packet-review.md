# Tool-free public-evidence-packet review

Version `0.3.0` replaces the three specialist profiles with explicitly named
**AgentProof Public Packet Test/Security/Policy Reviewer** profiles. Their mode
is `public-evidence-packet-v1`, and each declares `tools: []`. Repository and
plugin copies are identical. The `0.2.1` broad `read`, `search`, `github/*`
repository-reading mode is **deprecated and unsupported**, not silently
reinterpreted as a safe runtime.

This is a trusted-host integration for bounded, operator-approved **public
synthetic** evidence. It is not an App isolation fix, automation configuration,
new scanner, public transcript publisher, approval, or release mechanism.
Installing these profiles does not activate the integration or prove isolation.

## Responsibility split

| Component                 | Responsibility                                                                                                                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trusted source resolver   | Independently GET native public repository/PR identity, protected default ref, current gate, publisher and artifact records, PR-base policy bytes, and current disposition state.                  |
| Trusted native runner     | Pin the reviewed CLI executable bytes/version; stage only the selected profile in a fresh isolated working directory/home; exclude all tools; capture and verify native execution.                 |
| Tool-free specialist      | Explain only supplied normalized findings. Return advisory fragment **input**, never a tool call, native proof, canonical fragment, finding change, or human decision.                             |
| Separate operator/wrapper | Preserve the original run, publish only an approved public export if authorized, independently verify that export and freshness, then use protected `createReviewFragment` and `assembleEvidence`. |

The model cannot fetch GitHub, read local files, independently hash artifacts,
re-resolve a live SHA, inspect secrets, or prove runtime isolation. Those tasks
are deliberately removed from its instructions, not waived. If any actual
callable function exists or the model cannot establish that none exist, its
first instruction still requires `UNSAFE_TOOL_BOUNDARY`. Names mentioned in
ordinary prose are not callable function definitions.

## Host API and prerequisites

The helpers are `.github/scripts/public-review-packet.mjs` and
`.github/scripts/public-review-runtime.mjs`. Load them and evidence-core from a
reviewed trusted toolkit checkout, never from the PR being reviewed. Build
evidence-core first:

```text
npm run build --workspace @agentproof/evidence-core
```

`resolvePublicReviewSource({ repository, pullRequestNumber, evidenceInput })`
accepts candidate final JSON from the existing artifact-capture pipeline.
Candidate fields are comparisons, not authority: the helper independently
checks canonical content against the native gate's exact digest, native final
artifact identity, full base/head SHAs, protected policy bytes, and publisher
identity. It returns `publicContent`, its canonical `publicContentSha256`,
`observedAt`, and a native freshness snapshot.

The native archive digest is recorded, **not** a claim that this helper
downloaded or rehashed ZIP bytes. Keep the existing trusted download/archive
verification step. The resolver does not reconstruct unavailable dispatch
inputs or claim to rerun collectors. A public repository alone does not prove
that its content is non-sensitive or synthetic.

After the responsible operator has reviewed that exact public content,
`reviewPublicPacket(options)` requires:

| Option                                             | Required host input                                                                                                                                                                                                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repository`, `pullRequestNumber`, `evidenceInput` | The same immutable candidate subject used for native resolution. Forks, private repositories, missing PR-body digest binding, and incomplete collections are rejected.                                                                                           |
| `dataClassification`                               | Exactly `public-synthetic`, from the trusted operator, not reviewer prose.                                                                                                                                                                                       |
| `approvedPublicContentSha256`                      | Canonical digest of the exact content the operator approved for model input. Do not automatically substitute a newly computed digest for approval.                                                                                                               |
| `specialist`                                       | Exactly `test`, `security`, or `policy`.                                                                                                                                                                                                                         |
| `sessionId`                                        | A fresh UUIDv4; never resume or reuse an earlier candidate.                                                                                                                                                                                                      |
| `sessionUrl`, `transcriptAuthor`                   | An already existing public comment on this PR, owned by the named human operator, containing `<!-- agentproof-public-session:<sessionId> -->`. It is an operator-export reference, not an invented native App/cloud session URL. This helper does not create it. |
| `executable`, `executableSha256`                   | Absolute path and reviewed byte digest of the native CLI executable. No arbitrary launch flags, inherited plugins, provider hooks, or alternate runner are supplied through packet JSON.                                                                         |
| `captureDirectory`                                 | A new absolute, host-owned capture path whose parent already exists. Do not commit it, reuse it, or point it at historical evidence.                                                                                                                             |

The source resolver defaults to `githubRequest` using the trusted host's
already provisioned read credential. It issues **GET only**, with a fixed
same-repository API prefix. The native child receives only the host-provisioned
`COPILOT_GITHUB_TOKEN` for inference authentication, not `GITHUB_TOKEN`,
`GH_TOKEN`, provider overrides, telemetry destinations, or instruction paths.
The helper neither reads a credential store nor changes accounts or permissions.
Do not include any credential in options, packets, output, fixtures, or logs.
Missing inference authentication blocks before a native model call; there is no
interactive-login fallback.

An operator-host integration can use these exported functions programmatically;
there is deliberately no reviewer-invocable tool, workflow, automation, or
one-command publisher. Test-only dependency injection represents trusted host
code, never serialized reviewer-supplied evidence.

## Native enforcement and observations

The adapter currently recognizes CLI `1.0.92-3` and one complete JSONL model
call. Another version or event shape is blocked pending adapter review and
target-specific validation. Version recognition and unit fixtures are not live
validation of this profile/version combination.

Both native `content` and `transformedContent` are required. The sole recognized
transformation is an exact `<current_datetime>` marker containing a millisecond
RFC 3339 timestamp with offset, two line feeds, and the unchanged public request.
Its instant must equal the native user event timestamp and fall within the
host-captured process start/completion window. No substring matching, missing-field
default, custom-instruction expansion, attachment, or arbitrary wrapper is accepted.
This native protocol clock is not reviewer-supplied evidence or an identity claim.

The runner uses both `tools: []` and the native
`--available-tools view --excluded-tools view` intersection. The result must be
empty; `view` is not granted. Shell/write permissions are also denied. Built-in
MCPs, inherited instructions, remote access/export, automatic updates, and
interactive questions are disabled. A fresh isolated home and workspace avoid
loading personal settings, plugins, and checkout context. The runner resolves the
physical workspace path before checking every ancestor for a `.git` directory or
worktree file, then launches with that same resolved path. A junction or symlink
into a checkout subdirectory cannot bypass this check. No source tree is
copied into that workspace. The native token is marked secret for child
environment stripping and output redaction.

The host independently rejects:

- any tool execution/request, MCP server, extension, built-in edit request,
  resumed session, unsupported event, or incomplete/extra model call;
- missing native initialization, model completion, or usage-checkpoint data;
- any per-model inventory other than explicit numeric `tool_count: 0`,
  `tools: []`, and numeric `tools_truncated: 0`, including a second unsafe model;
- mismatched native user input/session/model identity, inventories unrelated to
  the completed model call, multiple answers, malformed
  JSONL, nonzero process/result exit, timeout, truncated output, or changed
  staged profile/executable bytes;
- `UNSAFE_TOOL_BOUNDARY`, `PUBLIC_PACKET_REJECTED`, malformed output, stale
  native state, or missing evidence, even when native tool counts are zero.

The model's own `effectiveTools: []` or `toolCalls: 0` is never proof. The
native verifier consumes process output captured directly by the trusted
runner. Its parsing function alone cannot authenticate an arbitrary supplied
file, and a hash is not a signature.

Requests are limited to 24,000 UTF-8 bytes after JSON escaping, with an additional
30,000-character conservative native command-line quoting bound. JSON `@`
characters are escaped before launch to prevent native file-mention expansion
without changing the approved values.
The mode includes normalized final evidence and protected policy only: no
arbitrary source/diff fetches or extra context files. Oversized input is rejected,
not truncated or silently changed. Test reviews cover `test` findings, Security
reviews cover `security`, and Policy covers `policy` and `provenance`.
An empty scope or one that cannot fit the existing 50-ID/1,000-character
reviewer-note contract blocks before launch rather than omitting findings.

## Output, failures, and assembly

The host uses evidence-core parsing, canonical hashing,
`createReviewFragment(...)`, and `assembleEvidence(...)` to validate the
reviewer's closed input. Those temporary validations cannot alter the source
document. Every scoped finding ID must appear once and the note must state
`AP-FINDING-ID: pass|fail|unknown|exception` with its exact recorded state.
Session link, timestamp, specialist, full SHAs, and both digests must match.
Either refusal marker blocks the entire answer, even alongside otherwise valid
JSON or in the trailing `Summary:` sentence. Parsed JSON strings are checked too,
so Unicode escapes cannot hide `UNSAFE_TOOL_BOUNDARY` or `PUBLIC_PACKET_REJECTED`.

Success returns `status: advisory-input-verified-not-published`, `input`, the
public request/answer, and native verification details. It does **not** return a
published fragment, update the Evidence Board, post a comment, approve, accept
an exception, merge, or release. Native repository/PR/ref/gate/run/artifact state
is re-read before releasing the input, including a final PR read.

Each run creates a new capture directory using non-overwriting writes.
`runtime-receipt.json` records native success or a blocking error;
`review-verification.json` separately records advisory/freshness verification
when native verification completed. Native zero-tool success is not advisory
success. Keep the original request, native stream and refused output; never
retry to obtain a preferred answer, relabel a refusal, or replace old evidence
with newly named fixtures.

Raw native streams can include diagnostic context and hidden reasoning. Keep
them local with approved restricted retention; never copy them wholesale into
prompts, canvas state, public transcripts, fixtures, or a PR. Export only the
approved public user input, final answer, and minimal native metadata/hashes.
Do not log credentials or private evidence. The runner removes its temporary
runtime home/workspace, not the immutable capture.

The separate existing host orchestration must append the actual public review
to the correctly bound export, independently verify native author/body/session
and current source identity, then call protected fragment creation and assembly.
Repeat freshness checks immediately before publication, assembly, or board
loading. A seed export is not a completed review transcript. Never rebind an
older export or fragment to a new head or artifact.

## Deployment status and limitations

Automations remain blocked under every existing
[save/picker/effective-tool/human-confirmation gate](automation-setup.md).
CLI results do not establish App isolation. The legacy repository-reading
profiles and automation prompts cannot be combined with this zero-tool mode.
The Evidence Assembler's legacy broad-tool profile is not part of this route;
use deterministic assembly and a separately authorized operator for the board.

Focused tests use explicitly synthetic native fixtures and stub execution,
never live model calls. Live validation of the revised Test, Security and
Policy profiles, actual target-host enforcement, exported transcripts, and any
recording remain separate operator-owned work. Earlier Security results and
Test/Policy refusals retain their original identities and outcomes.
This bounded repair does not establish overall project or demo readiness.

```text
npm run test:review-packet
npm run --workspace @agentproof/evidence-core test -- tests/assembly.test.ts
npm run check
npm run test:integration
```

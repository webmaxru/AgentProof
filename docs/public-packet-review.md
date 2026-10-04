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

## Experimental protocol-3 state-only observation

`.github/scripts/public-review-protocol.mjs` exports
`observeCopilotProtocol3State(options)`. This is a **separate experimental
state-only adapter**, not a fallback from the JSONL verifier, a working review
runner, or an App isolation fix. It has no `session.send`, resume, tool-execute,
model selection, review input, or publishing route. The legacy verifier, its
refusals, and the failed single `f2eab435` canary remain unchanged. In that
canary, explicit disabled MCP entries were inactive facts, not an empty MCP
inventory; missing initialization/selection proof and `UNSAFE_TOOL_BOUNDARY`
independently blocked review.

The reviewed wire contract is the public
[`github/copilot-sdk` snapshot `ef04633cc84e4ba8e79888a39259ca276f5de732`](https://github.com/github/copilot-sdk/tree/ef04633cc84e4ba8e79888a39259ca276f5de732/nodejs/src),
paired with CLI `1.0.92-3` and released SDK `1.0.17-preview.3`.
`client.ts`, `types.ts`, `generated/rpc.ts`, and
`generated/session-events.ts` define the inspected calls and schemas.
The SDK's `connect` handshake is version-pinned, not a promise of a stable
cross-version protocol. The host implements only the default UTF-8
`Content-Length` stdio framing used by `vscode-jsonrpc` `8.2.1`; it adds no SDK
dependency, SDK patch, TCP connection, global installation, or plugin.

The pinned `TaskKind` declaration is the closed union `"agent" | "shell" |
"client"`; `ConnectResult.taskKinds` is an optional array of those values.
The host accepts that published type, with the existing frame/cumulative byte
bounds, rather than requiring an empty advertisement or inventing a uniqueness
constraint. Null, non-arrays, malformed elements, and unknown values block.
Outgoing `supportedTaskKinds: []` remains unchanged. Returned task-kind
metadata is neither a model tool inventory nor permission to create/run tasks:
no task, model-send, or resume RPC is available.

Only these host-owned inputs are accepted:

| Option                           | Required value                                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `executable`, `executableSha256` | Absolute path and independently reviewed exact native executable digest; native connect/status must also report CLI `1.0.92-3`, protocol `3`. |
| `profileSha256`, `specialist`    | Independently pinned full bytes of the current `0.3.0` public profile and `test`, `security`, or `policy`.                                    |
| `sessionId`, `expectedLogin`     | Fresh UUIDv4 and exact expected public GitHub login, independently authenticated by the trusted launcher.                                     |
| `captureDirectory`               | New absolute host-owned directory outside every physical Git ancestor; parent must exist. Existing captures are never overwritten.            |

The trusted launcher supplies only `COPILOT_GITHUB_TOKEN` in the child
environment, not in JSON, arguments, prompts, captures, or logs. The fixed
`--auth-token-env` argument names that variable, never its value.
The launcher must verify saved-native GitHub identity immediately before the
authorized observation; the adapter additionally requires explicit native
authentication/host/login before session creation and after its state reads.
It neither reads a credential store nor changes accounts. No repository
package scripts should run with that credential.

The fixed headless/stdio launch retains the empty allow/exclude intersection,
shell/write denials, disabled built-in MCPs, no automatic login/update,
secret-environment marking, no inherited instructions, and no remote/export
route. Session creation additionally disables config discovery, file hooks,
skills, session-store/embedding-cache persistence, memory, infinite sessions,
host Git operations, and extension requests. An isolated home and physically
resolved outside-checkout workspace contain only the staged public profile.
The inline custom agent uses its exact public authored body, empty tools/MCPs/
skills, and `infer: false`; no model/provider override is supplied.
Removing the system message's environment-context section does not replace
guardrails or establish that a future composed prompt is safe.

The host registers native event/reverse-request handlers before the first RPC,
then connects/authenticates, creates one fresh session, and calls documented
`session.tools.initializeAndValidate`. That method can be a no-op:
`session.tools.getCurrentMetadata` returning `null` still blocks. It reads
`session.agent.getCurrent`, `session.agent.list` with public authored prompt
metadata, `session.extensions.list`, `session.mcp.list`, initialized tool
metadata, and `session.skills.list` twice without a turn. Exact selected
identity/public body bytes, explicit empty initialized catalog/skills,
unchanged state, and explicit disabled/absent extension and MCP state are
required. Missing MCP host state, active/pending/failed/auth-required servers,
missing fields, cursor/truncation fields, or unsupported shapes block. Explicit
disabled servers remain recorded as disabled, never erased or relabeled.
An empty extension list is a native response, not an assumption.

This is **catalog-only initialization evidence**. The public SDK does not
guarantee the per-model `tool_count`, `tools`, and `tools_truncated` proof
required for a reviewer turn. Opaque internal prompt-cache baselines are not
inspected or promoted into such proof. There is no user/clock envelope to
verify because this API cannot send a user message. Even a fully observed
state-only run returns `state-only-observed-review-blocked`,
`modelInventoryStatus: unknown`, and `reviewStatus: blocked`.
Unknown instruction expansion, missing model inventory/truncation, or either
model refusal must still block any future review adapter. Every assistant,
model, user, tool, permission, elicitation, or unsupported event blocks this
state-only run; an apparent answer never makes it a review success.

The directly owned `ChildProcess` has one 180-second monotonic deadline,
8 KiB header bound, 4 MiB frame and cumulative stdout-plus-stderr ceiling
before JSON parsing, 24,000-byte outgoing frame limit, at most 32 sequential
requests, at most 128 notifications, and **zero** permitted reverse requests.
Unknown/duplicate/unmatched frames, malformed UTF-8/JSON, partial frames,
native RPC errors, any stderr, or nonzero exit fail closed without retry or
handshake downgrade. Shutdown acknowledges the documented void result, then
the host closes stdin and observes actual native exit **and** stream closure
before removing its owned runtime directory. A requested kill is not exit
proof. Deadline expiry blocks; if exit or stream closure is unconfirmed, the
host retains that directory instead of falsely reporting cleanup.

Cleanup snapshots the created directory's physical path and filesystem identity
before launch. After verified native exit/stream closure, a fixed, credential-free
Node filesystem helper rechecks that exact identity, rejects links/replacements,
and removes only that owned directory. Its cwd is outside the deletion target;
it uses the trusted host's Node executable and an empty environment, with no
inherited `NODE_OPTIONS`, `NODE_PATH`, authentication, or plugin configuration.
The helper's actual exit and stream closure must also be observed before removal
is reported. Recursive `fs.rm` is not abortable in-process, so the helper has a
kill timeout limited to the transport's **remaining original monotonic deadline**;
expiry is failure, never a new cleanup deadline or a successful requested kill.

The first removal error is retained as `firstErrorCode`, alongside every attempt,
its remaining budget, path-verification result, and observed helper lifecycle.
Only Windows `EBUSY`, `ENOTEMPTY`, or `EPERM` from a verified removal may trigger
one retry, after 100 ms and another identity check, within that same remaining
budget. These are a narrow subset of the
[documented Node `fs.rm` retry errors](https://nodejs.org/api/fs.html#fspromisesrmpath-options).
Built-in removal retries are disabled. Other errors, unverified lifecycle/path,
unknown error codes, and exhausted budgets explicitly block cleanup. Error
messages, arbitrary keys/strings, and full paths are not persisted. A recovered
cleanup is recorded as `removed-after-retry`; it does not clear an earlier native
observation failure. Historical receipts with discarded filesystem error codes
remain unchanged; their original codes cannot be recovered or inferred.

`protocol-state-receipt.json` contains only allowlisted state/status metadata,
observed event/RPC counts, host/native identities and timestamps, and hashes.
Raw stdio, authored/native prompt payloads, full MCP host config, and native
error text are not written to the capture. Stream hash byte counts distinguish
a bounded prefix from a complete observed stream after a limit violation.
Native-owned temporary files are removed only after confirmed exit; the
receipt is immutable. The synthetic public-schema fixtures and real Node
stdio lifecycle fixture are **not** live Copilot evidence.

A separately authorized trusted host may invoke
`await observeCopilotProtocol3State({ executable, executableSha256,
profileSha256, specialist, sessionId, expectedLogin, captureDirectory })`.
Do not add a request/prompt/evidence field or follow it with a model call.
Unit success alone does not authorize even this state-only native observation,
and a state-only result does not establish live review compatibility.

### Connect-only diagnostics

`observeCopilotProtocol3Connect(options)` uses the same pinned executable/profile,
sealed launch flags/environment, physical workspace checks, byte limits, deadline,
and exit-before-cleanup rule. Its transport permits **exactly one `connect`
request** and forbids every other RPC, including status, authentication, session
creation, shutdown, or a second connect. After that response it closes stdin and
awaits native exit; a rejection still aborts the owned process and remains blocked.
There is no status/authentication/session/model follow-up even when connect is
accepted. It shares the narrowly scoped cleanup rules above.

Both experimental paths record a connect projection capped at 4 KiB. It contains
result/error presence, fixed allowlisted key names and value types, counts of
redacted keys, safe numeric protocol/error codes, a pinned-version-match boolean,
taskKinds presence/type/count (never its elements), and fixed predicate names
that failed. Version strings are included only when they match the bounded
numeric `major.minor.patch[-build]` syntax; arbitrary prerelease/build strings,
private/malformed keys, native error messages/data, and unknown values are not
copied. Exact wire-frame byte counts and SHA-256 include the received header and
JSON bytes, not a reconstructed serialization. Malformed frames still fail the
existing transport checks; missing diagnostics are not safe defaults.

The connect-only capture is `protocol-connect-receipt.json`, identified by
`experimental-protocol-3-connect-diagnostics-v1`. The connect guard
requires the closed expected result shape, `ok: true`, protocol `3`, the
exact pinned version, and absent or valid published `TaskKind[]` metadata. An accepted
diagnostic connection returns `connect-only-observed-review-blocked`, not
initialized-state, authentication, profile-selection, model-inventory, or live
review proof. Every real connect-only observation requires its own explicit
authorization; earlier failed receipts remain immutable and are not reconstructed
from byte counts or replaced by new diagnostics.

The original `3447373` diagnostics-only observation remains a failure: it
matched the pinned protocol/version and returned a two-entry taskKinds array,
but failed the then-empty-only predicate. Its elements were not exported or
established. The subsequent contract correction validates new observations
against the published type; it does not reinterpret that failure as success.

### Auth-only diagnostics

`observeCopilotProtocol3Auth(options)` is a separate diagnostic API with the
same pinned executable/profile, sealed flags/environment, physical workspace,
limits, original deadline, and fixed-target cleanup. Its transport permits only
the ordered prefix `connect` -> `status.get` -> `auth.getStatus`, then stops.
Connect parameters remain the fixed empty supported-task-kind declaration and
disabled telemetry forwarding; status/auth parameters must be empty objects.
Repeated, skipped, additional, or credential-bearing requests are rejected.
An earlier failed guard stops the prefix immediately. A healthy incomplete
prefix cannot be reported as complete. No session creation, shutdown RPC,
model/user/tool/task operation, auth mutation, or permission flow is available.
Native notifications and reverse requests also block this diagnostic route.

The pinned public `client.ts` sends root `auth.getStatus` and returns
[`GetAuthStatusResponse` from `types.ts`](https://github.com/github/copilot-sdk/blob/ef04633cc84e4ba8e79888a39259ca276f5de732/nodejs/src/types.ts).
That interface requires `isAuthenticated: boolean`; `login`, `host`, `authType`,
and `statusMessage` are optional. Its explicit auth-type union is `"user" |
"env" | "gh-cli" | "hmac" | "api-key" | "token"`. This is not the separate
session-scoped authentication schema. The **unchanged** host guard is stronger:
it requires all identity/source fields, `isAuthenticated: true`, an exact expected
login, one of its two allowed public GitHub host strings, and source `env` or
`token`. Public optionality or a documented additional source does not satisfy
those requirements and never authorizes a fallback.

`protocol-auth-receipt.json` uses adapter
`experimental-protocol-3-auth-diagnostics-v1`. Its `authStatus` projection is
capped at 4 KiB and records exact frame bytes/hash, result/error presence, fixed
key names/types, redacted extra-key counts, missing guard/public required keys,
and individual failed predicates. The actual `isAuthenticated` boolean is
included only when correctly typed. Login, host, and auth type are represented
only by presence/type and exact-match or set-membership booleans. The documented
auth-type set is explicitly identified as available; membership is separate from
the unchanged allowed-source check. Neither raw matched nor mismatched account,
host, or source strings are persisted. Status-message fields and error messages/
data are omitted entirely; only a bounded numeric native error code may remain.
Unknown/malformed private keys are counted, never echoed.

The prelaunch credential guard and existing one-use saved-native launcher
channel remain unchanged. Only a separately authorized trusted launcher may
reuse its existing approved credential transiently in `COPILOT_GITHUB_TOKEN`;
inherited `GH_TOKEN`/`GITHUB_TOKEN` are not substitutes. This API cannot acquire,
refresh, save, switch, or repair credentials. An accepted diagnostic result is
`auth-only-observed-review-blocked`, not a session/profile/initialization or
model-inventory proof. A missing/mismatched native authentication or identity
remains a genuine blocker. Each real observation requires separate authorization,
and no corrected native retry or model turn follows it.

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

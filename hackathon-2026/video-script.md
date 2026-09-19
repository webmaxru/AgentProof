# AgentProof video script: the exception that cannot follow the code

**Picture lock:** 1:56 (116 seconds). **Hard maximum:** 2:00, including every
slate, transition, freeze, and fade. The four-second reserve is not outro time.
This is the project owner's duration requirement, not a claim about a verified
event upload limit.

**Spoken copy:** 234 words, about 121 words/minute across the complete cut.
The fastest scene averages 135 words/minute. Record conversationally, with
deliberate pauses; do not speed up the voice to fit.

**Audience:** release leads and reviewers on engineering teams using Copilot.
**One promise:** know whether the evidence and human decision apply to the
exact code under review. **One memorable proof:** an exception can be unexpired
and still be stale because the commit changed.

**Status:** this is a production-ready script, not proof that its source shots
have been captured. The matching MP4 is a silent **PRECOMPUTED / NOT LIVE**
storyboard. A final product recording and the presenter's voiceover remain
outstanding.

## Read this before recording

- A and B are editorial names for **two real, different, full PR head SHAs**.
  They are not substitute identifiers in a command, artifact, or check.
- This is an edited recording of a synthetic scenario, not a claim that CI,
  human decisions, and reviews finish in 116 seconds. Show
  `Recorded synthetic scenario | workflow waits omitted`.
- The first ten seconds preview the result. The following shots explain it.
  Label earlier A footage `A: before fixes`; label B footage `B: current head`.
  Do not make nonchronological edits look like a continuous live interaction.
- The gate for A need not be green. Its eligible retention exception can be
  accepted while non-exceptionable test/dependency failures still block.
- On B, complete the fixes and fresh collection first. The A-bound exception
  must still be **unexpired at capture**, but recorded as `stale` and
  ineffective for B. If it expired first, it does not prove this hook.
- The later B-bound exception must be a **separate, genuine authorized human
  decision**. Its resulting finding is `exception`, not `pass`.
- No agent accepts an exception, approves, merges, or releases. Do not stage
  those actions just to obtain a satisfying ending.
- The default ending shows a green gate **with independent approval still
  required**. An actual approval is not necessary for this version of the
  film. Never invent an approval or imply that a green gate permits merging.

The operational preparation is in [the recording guide](video-recording-guide.md)
and [runbook](demo/runbook.md). [The strategy note](video-strategy.md) explains
the editorial research and the five-category rubric mapping.

## 0:00-0:10 | The opening, frame by frame

There is no greeting, presenter introduction, event logo, animated title,
architecture diagram, or terminal installation sequence.

| Time          | Exact picture and edit                                                                                                                                                                                   | Narration and delivery                                                                               | Viewer takeaway                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 0:00.0-0:01.5 | Start on the real A-bound retention exception: the SHA, reason, and future expiry are legible. Small label: `Decision for A`. No green whole-PR badge.                                                   | **"The code changed."** Matter-of-fact, not alarmist.                                                | A decision is attached to a particular version.     |
| 0:01.5-0:02.3 | Hard cut to the actual B commit header. A thin editorial outline identifies the full new SHA. Label: `New commit: B`. Do not type a fake hash or animate a fake push.                                    | Brief pause after "changed."                                                                         | Something material changed; the identifiers differ. |
| 0:02.3-0:05.1 | Show a simple comparison using crops from those two real records: `Decision: A` and `Current code: B`. The source SHA text stays intact.                                                                 | **"Should the old exception still count?"** Emphasize "still"; leave the question open for one beat. | The audience can predict the control's answer.      |
| 0:05.1-0:07.2 | Point once to the genuine A expiry. Overlay: `Not expired at capture`. The shot log must substantiate the capture time and expiry.                                                                       | **"Watch: it hasn't expired,"** with emphasis on "hasn't."                                           | This is not just an expired permission.             |
| 0:07.2-0:09.5 | Cut to B's completed authoritative evidence/check result showing the A disposition's `stale` status. Magnify the actual result, not a recreated badge. Add `Wrong commit`, separate from the product UI. | **"but AgentProof marks it stale."** Land on "stale" as the result appears.                          | The hook pays off visibly before ten seconds.       |
| 0:09.5-0:10.0 | Hold the result; park the cursor outside the evidence. A small product identifier can remain in the corner.                                                                                              | Silence.                                                                                             | The viewer has time to understand the surprise.     |

The opening's full spoken copy is exactly:

> The code changed. Should the old exception still count? Watch: it hasn't expired, but AgentProof marks it stale.

Do not add dramatic breach imagery, a fabricated incident, a loss estimate, or
an implication that ordinary GitHub checks ignore commits. This is a concrete
demonstration of AgentProof's policy-bound exception lifecycle.

## 0:10-0:23 | Make the customer recognize the problem

**Voiceover**

> For release leads on teams using Copilot, fast-moving code raises a question: does this evidence match what we're shipping? AgentProof brings that evidence and the human decision together.

**Picture**

- 0:10-0:14: stay on actual B evidence. Add one restrained lower-third:
  `For release leads on teams using Copilot`.
- 0:14-0:19: move from the current head field to its evidence artifact and
  disposition. Show one connection at a time, not a dashboard full of tiny text.
- 0:19-0:23: open the actual Evidence Board, if available, on this same B
  document. Retain its authority warning. Otherwise stay in the check summary;
  a board animation is not necessary to explain the customer value.

**Main overlay:** `Evidence for the code you are reviewing`.

**Delivery:** address one release lead, not "all enterprises." Stress
"this evidence" and "what we're shipping." The pain is checking relevance,
not a speculative disaster.

**Must not imply:** measured productivity gains, proven demand, or a new
GitHub feature that did not exist before AgentProof.

## 0:23-0:39 | Prove that something was built

**Voiceover**

> Here's our working prototype on a synthetic expense app. Test and dependency failures block the gate. Missing retention information stays unknown. Protected base policy sets the rules, not the proposed change.

**Picture**

- 0:23-0:26: show the real synthetic expense-app PR and completed A check.
  Label this return to earlier footage `A: before fixes`.
- 0:26-0:31: magnify the actual test and dependency findings marked `fail`.
  Keep `AgentProof / gate` and its `failure` conclusion in the crop.
- 0:31-0:35: highlight the raw missing-retention finding, `unknown`.
  Use the **raw pre-disposition evidence** if A's final document already
  projects the accepted finding as `exception`; label the snapshot accurately.
- 0:35-0:39: show the protected policy identity/base revision in the
  authoritative result. The overlay says `Rules come from the protected base`.
  Do not scroll through YAML or imply the PR's proposed policy is authoritative.

**Delivery:** put the stress on "working," "unknown," and "not the proposed
change." Leave a short hold on the finding states.

**Visible proof beats a feature list:** use results emitted by the actual
collectors. A unit-test pass alone is not a recorded integration run.

## 0:39-0:52 | Explain the distinctive connection

**Voiceover**

> Not another scanner: evidence, policy, and a human decision, bound to the exact commit. This exception names A, a reason, and an expiry. It cannot cover B.

**Picture**

- 0:39-0:44: show the actual A acceptance record, enlarged enough to read
  `sha`, `reason`, and `expires`. A compact editorial heading:
  `A bounded human decision`.
- 0:44-0:48: place the current B SHA beside the original A SHA. Use the same
  A/B labels and colors as the opening, with text labels so color is not
  required for understanding.
- 0:48-0:52: return to B's actual `stale` disposition and unresolved gate.
  Overlay: `A's exception cannot satisfy B's gate`.

**Delivery:** pause after "exact commit." Say "A" and "B"; do not read
40-character identifiers aloud. Let the picture carry the binding evidence.

**Differentiation boundary:** the novelty claim is the integrated evidence,
protected policy, explicit disposition, and review workflow. GitHub already
associates checks with commits and can dismiss stale approvals.

## 0:52-1:09 | A second surprise: green is not approval

**Voiceover**

> Fresh checks verify the fixes. A new, authorized exception covers only commit B; retention still hasn't passed. The gate turns green. An independent human must still approve the code. Green evidence is not permission to merge.

**Picture**

- 0:52-0:54: B's completed evidence shows the remediated test and dependency
  findings as `pass`. Keep the B head visible.
- 0:54-1:00.3: show the **already recorded real human** B-bound retention
  disposition and the resulting `exception` state. The original missing fact
  is not relabeled as a successful test.
- 1:00.3-1:02.3: show the real green `AgentProof / gate`, its B binding, and the
  matching final artifact reference. Do not show a fixture as a GitHub result.
- 1:02.3-1:09: pull back to the real PR merge/review requirements: approval
  still required. Overlay: `Gate satisfied != human approval`.
  No clicking Approve, Merge, or a bypass action for the camera.

**State vocabulary:** `pass`, `fail`, `unknown`, and `exception` all retain
their own labels. `stale` describes the old disposition, not a fifth finding
state.

**Delivery:** pause between "green" and "An independent human." That
contrast is the second visible payoff, not a defensive disclaimer.

**Source gate:** use this exact narration only if genuine A and B decisions,
B evidence, and the configured review requirement have been verified. If the
independent review has already occurred, show that actual record and replace
"must still approve" with "still reviews and approves"; do not recreate a
pending-review screenshot.

## 1:09-1:25 | Make the implementation path credible

**Voiceover**

> This works with GitHub Actions and repository rules. Specialist reviewers are advisory; their launches and evidence assembly are manual. GitHub records, not the editable board, govern the release. We build on GitHub's existing checks and reviews.

**Picture**

- 1:09-1:12.5: show the completed Actions publication and the **live configured**
  required-check/review rules. The checked-in ruleset template alone is not
  evidence that the demo repository enforces it.
- 1:12.5-1:17.2: show a sanitized manual reviewer/assembler entry point, with
  `Manual, advisory, read-only` visible. Do not run a reviewer with mutation
  tools or suggest this film contains three autonomous live reviews.
- 1:17.2-1:25: show the Evidence Board's authority warning, then return to the
  actual GitHub result. If the board is unavailable, use a clearly editorial
  boundary card instead: `Board: coordination | GitHub: records and rules`.

**Small persistent limit line for this scene:**
`Prototype | bounded evidence, not certification | manual specialist workflow`.

**Delivery:** calm and precise. This is how a team could adopt the prototype,
not a claim of production readiness.

**Do not hide the host limitation:** the automatic-reviewer permission canary
stopped at `UNSAFE_TOOL_BOUNDARY` and remains disabled. Explain that in the
supporting packet; do not spend the final emotional beat on a broken-runtime
tour or imply the limitation has been resolved.

## 1:25-1:43 | State Microsoft's opportunity and a testable next step

**Voiceover**

> For Microsoft, the opportunity is more confident Copilot adoption and less time chasing release evidence. Next, pilot with two engineering teams: compare review effort and verify that stale decisions stay blocked. Those are goals, not measured results.

**Picture**

- 1:25-1:32.5: one clean editorial card, not a simulated customer testimonial:
  `Microsoft opportunity: confidence in Copilot workflows`.
- 1:32.5-1:35.5: replace it with
  `PROPOSED PILOT | 2 engineering teams | compare reviewer effort`.
- 1:35.5-1:43: add one safety measure:
  `Verify stale decisions stay blocked`.
  Keep `Not yet measured` visible. No fabricated charts or account counts.

**Delivery:** warm up on "opportunity," then become concrete on "compare"
and "verify." Say "pilot" as a proposed next step, not an existing deployment.

**Business logic:** less evidence chasing could help teams adopt GitHub and
Copilot with accountable review. Revenue, adoption, retention, satisfaction,
and time savings have **not** been measured for this prototype.

The proposed pilot design and evidence gaps are in
[the five-category matrix](winning-criteria-matrix.md).

## 1:43-1:56 | Close the loop, not the feature list

**Voiceover**

> Agents can accelerate the work. People still own the decision. AgentProof: the code can change, but trust must be earned again.

**Picture**

- 1:43-1:47: return to the real B evidence plus the human-review requirement.
  No new UI surface or new feature.
- 1:47-1:52: retain that image behind two concise editorial lines:
  `Current evidence.` and `Accountable humans.`
- 1:52-1:56: finish on `AgentProof` and
  `When the code changes, the evidence must keep up.`
  The final image is already part of the 116 seconds. No appended credits.

**Delivery:** unhurried. Pause after "work" and "decision." The final
reference to trust is the story's metaphor for bounded evidence and human
accountability, not a certification claim.

## Clean voiceover and editing assets

- [Voiceover text](assets/agentproof-voiceover.txt): narration only, one
  paragraph per scene, for a teleprompter or recording booth.
- [Timed captions](assets/agentproof-silent-draft.srt): complete spoken copy
  with rehearsal timings. Retime against the actual voice recording.
- [Timeline](assets/video-timeline.json): machine-readable scene boundaries,
  caption cues, and exact narration.
- [Storyboard](demo/storyboard.md): the single-page edit decision list.
- [Silent draft](assets/agentproof-silent-draft.mp4): 1:56 cue cards, **not**
  product footage. Every frame is labeled `PRECOMPUTED / NOT LIVE`.

If the voiceover is slow, first remove a redundant supporting phrase from
scene 6 and regenerate the matching transcript/captions. Never rush the hook,
cut the stale-state hold, remove the human boundary, or exceed 2:00. Update
this script and the timeline together; the media checker verifies the match.

## When source footage is missing

Do not read the main script over imaginary checks or approvals.

| Missing proof                                   | Honest response                                                                                                                                                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| An unexpired A decision that becomes stale on B | Obtain a genuine authorized synthetic-demo record before capture, or show the actual deterministic stale-SHA test and label it `SYNTHETIC TEST / NOT AN INTEGRATION RUN`. Do not claim a recorded human exception.         |
| An authorized B exception                       | Keep the gate red and say: "Fresh checks verify the fixes. Retention remains unknown. The release stays blocked until the required evidence or an eligible human decision is recorded." Do not manufacture a green ending. |
| A live independent-review requirement           | Show the repository configuration step as pending. Remove any claim that this repository currently blocks merge for missing approval.                                                                                      |
| A safe advisory-session runtime                 | Omit those session screens. Retain the manual/advisory limitation and disclose `UNSAFE_TOOL_BOUNDARY`; deterministic evidence does not need a pretend reviewer conversation.                                               |
| Any actual product footage                      | Use the labeled animatic only for rehearsal. It is not the final demonstration for the "Make Something" criterion.                                                                                                         |

These substitutions require a revised timed voice track and captions. They are
not permission to leave mismatched narration in the master. Do not mix records
from unrelated PRs or different SHAs to manufacture a single successful story.

## Director's cut list

Remove greetings, team biographies, logo stings, installation steps, typing,
CI waiting, three separate agent tours, whole JSON/YAML files, long hash
read-outs, competitive takedowns, and unmeasured ROI figures. Keep the actual
stale result, the distinct exception state, the human boundary, the named
customer, and Microsoft's proposed value.

The final upload is ready only after the
[recording checklist](recording-checklist.md) is complete. A strong script
cannot substitute for real evidence or guarantee a judging result.

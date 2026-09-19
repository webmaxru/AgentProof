# Recording guide: a 1:56 AgentProof story

Produce a **recorded demonstration with later voiceover**, not a purported
two-minute live execution of CI and human review. The project owner's hard
ceiling is **2:00**; picture lock is **1:56**, including the ending.

Use [the script](video-script.md) for exact words and detailed shots,
[the storyboard](demo/storyboard.md) for the edit list, and
[the runbook](demo/runbook.md) for evidence prerequisites. The checked-in
silent MP4 is a labeled storyboard only; it is not a product recording.

## 1. What to deliver

| Deliverable                          | Purpose and status                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| `agentproof-recorded-master.mp4`     | Final real-product cut with the presenter's voiceover; **not yet captured**.        |
| `agentproof-recorded-master.srt`     | Full narration, retimed against the final recorded voice.                           |
| Completed sanitized shot log         | Records which real source supports each claim and whether a substitution was used.  |
| Privacy review                       | Confirms the actual export contains no prohibited information or personal UI.       |
| `assets/agentproof-silent-draft.mp4` | Existing 116-second precomputed rehearsal aid; **not a substitute for the master**. |
| `assets/agentproof-voiceover.txt`    | Clean 234-word voice track, ready for the presenter to read.                        |

Do not overwrite the labeled animatic with an unlabeled master. Retain clear
filenames and provenance. Keep raw desktop footage and non-shareable source
records only in approved local/internal storage, never in this packet.

## 2. Prepare one coherent evidence story

Use one disposable **synthetic** PR, two different real full head SHAs, and
the protected base policy. Nothing in this guide authorizes an agent to make
an exception decision, approve a PR, merge, or release.

| Source                        | State that must genuinely exist                                                                                                       | Why it is needed                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| A: before fixes               | Real non-exceptionable test/dependency failures; raw retention evidence is `unknown`.                                                 | Shows collectors, not a static product concept.                                   |
| A: human decision             | An authorized human independently chose an eligible retention exception, with full A SHA, specific rationale, and a permitted expiry. | Provides the actual bounded decision for the hook. A's whole gate can remain red. |
| B: fixes and stale A decision | Real remediation creates B. Fresh collection shows fixed findings passing; the old A exception is unexpired but `stale` for B.        | Proves commit mismatch, not merely elapsed time.                                  |
| B: new human decision         | If genuinely justified, the authorized human makes a separate B-bound retention decision. Final finding remains `exception`.          | Allows the truthful green-gate sequence without pretending retention passed.      |
| B: current authority          | Check, artifact, policy identity, and live PR head agree; configured GitHub rules still require independent approval.                 | Proves the distinction between evidence success and human approval.               |

If the records do not exist, **capture is not ready**. Either the authorized
people perform genuine work in the synthetic scenario, or use the explicitly
labeled alternative script in [video-script.md](video-script.md). Do not
simulate human comments, spoof identities, or manufacture GitHub screenshots.

Do not seek an unnecessary exception in a real customer repository just for
the film. A narrow synthetic exercise is sufficient.

## 3. Prepare the working surfaces

You need six logical surfaces, not a thirteen-tab feature tour:

1. A's exception record and completed evidence, with the raw unknown snapshot.
2. B's actual commit/diff and the stale A disposition in completed B evidence.
3. B's fresh evidence and genuine B-bound human disposition.
4. The current GitHub check, artifact, and PR review requirement.
5. The actual rules plus an optional safe manual reviewer/assembler surface.
6. The two editorial value/closing frames in [slides/outline.md](slides/outline.md).

The Evidence Board is useful but optional footage. If shown, load the right
document and retain its mutable-coordination/GitHub-authority warning.
All reviewer launches and evidence assembly are manual. Inspect their
actual tool grants first; do not launch a mutation-capable reviewer to obtain
video. The permission-canary automation remains disabled.

Keep a private approved evidence reference outside the submission tree.
The shareable shot log contains only synthetic SHAs, sanitized record labels,
capture time/expiry, and non-sensitive descriptions, not private URLs or
private source data.

## 4. Set up a clean capture

**Picture:** 1920x1080, 16:9, 30 fps. Use the same theme throughout. Capture an
approved application/window region rather than the entire desktop. Increase
zoom until state labels and the full SHA remain readable in a 1280x720 preview.

**Composition:** leave about 80 px safe margin in the 1080p master. Keep a
caption-safe band near the bottom; move a caption if it would cover the SHA,
expiry, or result. Use roughly 40-48 px captions and 48-64 px editorial
headings. These are editing recommendations, not event requirements.

**Privacy:** hide unrelated tabs, notifications, bookmarks, avatars, email,
chat, calendar, tenant identifiers, customer data, tokens, terminals with
environment variables, and authentication dialogs. Do not capture them and
assume later blur will make the raw recording safe to share.

**Cursor:** move deliberately, point once, and park it outside the result.
Avoid circles, repeated selections, and noisy click highlights.

**Sound:** capture clean room audio for voiceover later; turn off UI sounds.
No music is required. If music is used, it must be authorized and remain well
below the voice. Do not spend the first seconds on a sound-logo.

## 5. Record source takes, not a fragile single performance

Record 3-5 seconds of handles before and after each useful state. Workflow
waiting happens outside the final edit; the film must disclose that waits
are omitted.

| Take                     | Capture                                                                                                             | Avoid                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **H1: hook**             | A decision fields; B head; actual B `stale` result; future A expiry with capture timestamp recorded in the log.     | A green gate invented for A; a record that had already expired; mixing unrelated PRs.              |
| **P1: product proof**    | A raw/final findings; failure gate; protected base-policy identity; B fixes and fresh passing findings.             | Showing projected `exception` while saying the same final finding is `unknown`.                    |
| **H2: human boundary**   | Genuine B decision, distinct `exception` state, green B gate, remaining independent-review requirement.             | Clicking approval or merge for a take; a fake green check; narration that says retention passed.   |
| **F1: feasibility**      | Actual rules/configuration, completed Actions publication, optional read-only entry point, board authority warning. | Presenting checked-in configuration as already deployed; pretending manual sessions are automatic. |
| **V1: value and ending** | Clearly editorial proposed-pilot card, then real B evidence/human boundary and the closing title.                   | Fabricated customer logos, saved-hours charts, research counts, or production badges.              |

The human actions should be completed by the relevant humans on their own
merits. Capture the resulting records; do not film a staged "agent approves"
or ask an agent to submit the disposition.

If a new push changes B during recording, stop. That is a new head, not the
one in the script. Recollect and revalidate; never edit around the mismatch.

## 6. Assemble the first ten seconds first

Make this mini-cut before polishing the rest:

1. Real A exception, then real B head.
2. Ask whether the old exception still counts.
3. Establish the expiry has not arrived at capture.
4. Show the actual stale disposition by about 0:08.
5. Hold, then name the release lead.

Show it to a person unfamiliar with the project. Ask them what changed and
why the exception no longer applies. If they only remember a red badge,
enlarge the A/B binding and simplify the overlay. Do not add more jargon.

Do not call this an experimentally validated attention test. It is a
qualitative clarity check.

## 7. Voiceover session

Read [the clean voiceover](assets/agentproof-voiceover.txt) in eight takes.
Record lossless audio, preferably 48 kHz, with a consistent mic distance and
quiet room. Make one natural take and one slightly more deliberate take.

The script has 234 words. Allow the planned visual holds; individual scenes
average about 97-135 words/minute. A real read-through is still required:
word counts do not guarantee the presenter's timing.

- Hook: curious and calm. Stress "still" and "hasn't expired."
- Customer: speak to a release lead, not a general AI audience.
- Proof: stress `unknown`, `exact commit`, and `cannot cover B`.
- Human boundary: pause after "green"; emphasize "not permission to merge."
- Value: explicitly say "opportunity," "pilot," and "not measured results."
- Ending: slow down rather than raising the volume.

Use the storyboard's timings as the edit budget, not a metronome that forces
unnatural speech. If a take runs long, trim redundant words and update the
script/timeline/captions together. Never remove a truth qualifier to save time.

## 8. Edit and caption

Use hard cuts and restrained zooms. One focus per shot; never ask the audience
to read a whole JSON file while listening to unrelated narration.

Keep `Recorded synthetic scenario | workflow waits omitted` visible on
product footage. Label A and B consistently. Full SHAs remain in the
underlying evidence even when the editorial label uses a single letter.

The supplied SRT contains **all spoken words**, with rehearsal timing. Retime
it to the actual voice; do not submit captions that anticipate or trail the
speech. Use at most two lines, good contrast, and position them clear of
evidence fields.

Editorial overlays must look editorial: use an outline, callout, or lower-third.
Never paint over a real status to change its meaning. If an earlier run or
fixture is substituted, follow [the fallback rules](fallback/README.md) and
keep its `PRECOMPUTED / NOT LIVE` label visible throughout.

For the value card, use `PROPOSED PILOT` and `Not yet measured`. For the close,
return to evidence and human accountability. The disabled canary belongs in
the supporting limitations, not a last-second feature or failure tour.

## 9. Export and verify the actual file

Recommended master: MP4 with H.264 video, yuv420p, constant 30 fps, fast-start,
and AAC voice audio. Target 116 seconds. Check the authenticated upload form
for its current container, size, caption, and accessibility requirements;
do not rely on the earlier unverified five-minute/100 MB assumptions.

On Windows, inspect the exported file:

```powershell
ffprobe -v error -show_entries format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate -of json '.\agentproof-recorded-master.mp4'
```

Reject an export over **120 seconds**, including any encoder-added tail.
Watch the actual exported file end to end with sound, then preview at 720p.
Check the first ten seconds, every source transition, SHA/expiry readability,
audio intelligibility, captions, privacy, and final frame. Do not validate
only the editing timeline or the silent rehearsal video.

## 10. Sign off honestly

Complete [the checklist](recording-checklist.md) and the
[sanitized shot log](assets/agentproof-shot-log.template.md).
If the master or voiceover is not recorded, state that plainly. If the
business pilot has not happened, retain the hypothesis language. No clip,
badge, or script can make an unmeasured outcome real.

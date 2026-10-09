# AgentProof challenge submission

This directory is the ready-to-submit package for the **FY27 GitHub Copilot
App Enterprise Challenge**.

## Submission identity

**Title:** AgentProof: Evidence Before Approval

**Tagline:** Every AI-assisted change earns commit-bound evidence and an
explicit human decision before it can merge.

**Repository:** <https://github.com/msft-common-demos/AgentProof>

**Demo record:** <https://github.com/msft-common-demos/AgentProof/pull/2>

## Copy-ready project summary

> Enterprise customers want AI speed without losing release accountability.
> AgentProof is a repeatable GitHub Copilot App workflow for release leads
> reviewing AI-assisted changes. A pull request triggers no-secret deterministic
> collectors for tests, dependencies, data handling, and origin. Policy is
> loaded from the protected base revision, so the proposed change cannot weaken
> its own rules. Manually launched read-only Copilot specialist sessions explain
> the same commit-bound evidence; the Evidence Board turns pass, fail, unknown,
> and exception states into one decision view. GitHub checks, artifacts,
> comments, reviews, and rules remain authoritative. If the code changes,
> earlier evidence and human dispositions become stale. Agents can propose
> remediation, but only authorized humans may record bounded exceptions or
> approve. The reusable kit includes code, prompts, reviewer profiles,
> templates, governance guidance, tests, a canvas extension, and an adoption
> path for account teams. It is evidence, not a legal or compliance
> determination.

The summary is under the official 150-word limit.

## Official requirements

The authenticated challenge page was reviewed on **2026-10-08**. The exact
requirements and scoring are captured in
[official-requirements.md](official-requirements.md).

Required deliverables:

1. A project summary of at most 150 words.
2. A demo video of at most 3 minutes.
3. A repository containing the workflow assets.
4. A README covering roles, prerequisites, governance, the human-in-the-loop
   model, and success measures where applicable.

Submission deadline: **October 9, 2026 at 11:59 PM Pacific Time**.

## Final assets

| Asset                                         | Purpose                                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `assets/agentproof-submission-master.mp4`     | Narrated 2:44 demonstration with a 67-second live Canvas walkthrough plus staged synthetic context. |
| `assets/agentproof-submission-master.srt`     | Timed captions for the narrated master.                                                             |
| `assets/agentproof-form-submission-deck.pptx` | Three-slide architecture/workflow deck matching the form requirement.                               |
| `assets/agentproof-submission-deck.pptx`      | Eight-slide optional supporting deck built from the complete visual story.                          |
| `assets/agentproof-canvas-live.webm`          | Source recording of the running Evidence Board Canvas interaction.                                  |
| `assets/stills-final/*.png`                   | Eight 1920x1080 submission stills suitable for thumbnails, slides, or form uploads.                 |
| `video-script.md`                             | Exact narration and on-screen proof plan.                                                           |
| `winning-criteria-matrix.md`                  | Direct mapping to every scored criterion and the bonus.                                             |
| `product-feedback-summary.md`                 | Copy-ready bonus feedback grounded in a reproduced product limitation.                              |
| `official-requirements.md`                    | Sourced challenge rules, dates, deliverables, and scoring.                                          |

The video uses a validated GitHub record from PR #2. Its middle section is a
recorded walkthrough of the running Evidence Board Canvas; surrounding
explanatory frames are staged. Every segment is visibly labeled as synthetic
or staged. It does not fabricate a customer, approval, exception, merge, or
release.

## Memorable scenario

The main character is a release lead at an enterprise adopting AI-assisted
development.

The customer ask is simple:

> "AI can help us create changes faster. How do I know the exact commit in
> front of me earned the right evidence, under the right policy, and still
> requires the right human decision?"

AgentProof answers with one control loop:

```text
pull request head SHA
  -> no-secret deterministic evidence
  -> protected-base policy
  -> read-only Copilot specialist context
  -> Evidence Board
  -> human remediation or bounded exception
  -> independent approval
```

The key proof is not better code generation. It is that evidence and human
decisions are bound to the full pull-request head SHA. When the code changes,
the old evidence does not silently follow it.

## Real enterprise signal

The project began from an approved internal challenge research pack. The
anonymized pack identified:

- two direct enterprise release-validation cases;
- adjacent AI-governance signals across nine accounts; and
- traceable legal/compliance evidence needs across five accounts.

These counts support the problem statement, not a claim that those customers
validated or purchased AgentProof. No customer names, quotes, tenant links, or
private evidence are included.

## Reproduce the media

From the repository root on Windows:

```powershell
node hackathon-2026\assets\record_canvas_walkthrough.mjs
python hackathon-2026\assets\render_submission.py --render
node hackathon-2026\assets\generate_submission_deck.mjs
python hackathon-2026\assets\render_form_deck.py
node hackathon-2026\assets\generate_form_deck.mjs
python hackathon-2026\assets\render_submission.py --check
```

The renderer requires Pillow, FFmpeg/FFprobe, and Windows System.Speech. The
deck generator requires `pptxgenjs`; install it without changing the project
manifest:

```powershell
npm install --no-save --package-lock=false pptxgenjs
```

## Final submission checklist

- [x] Exact official scoring and dates captured.
- [x] Project summary is at most 150 words.
- [x] Narrated demo is below 3 minutes.
- [x] Repository, setup, roles, governance, review model, and measures exist.
- [x] Competitive differentiation is explicit and bounded.
- [x] Product feedback is included for the five-point bonus.
- [x] Video, captions, deck, stills, scripts, and reproducible generators exist.
- [x] No customer data, secrets, tenant links, private evidence, fabricated
      approval, or fabricated release action is present.

Before upload, the presenter should watch the complete master once, verify
audio level on headphones, and use the copy-ready summary above without adding
claims that are not in the repository evidence.

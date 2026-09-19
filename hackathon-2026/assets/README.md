# Two-minute rehearsal assets

**These files do not contain a recorded product demonstration.** The MP4 is
a silent, generated cue-card animatic with a persistent
`PRECOMPUTED / NOT LIVE - STORYBOARD ONLY` banner.

| Asset                                   | Purpose                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `agentproof-silent-draft.mp4`           | Exactly 116 seconds, 1920x1080, 30 fps, no audio. Eight storyboard cards, not GitHub/App footage. |
| `agentproof-silent-draft.srt`           | All 234 spoken words with rehearsal cue timings. Retime to the presenter's actual recorded voice. |
| `agentproof-voiceover.txt`              | Clean read-through copy, one paragraph per scene.                                                 |
| `agentproof-silent-draft.manifest.txt`  | Duration/frame facts, timeline/video SHA-256, and explicit limitations.                           |
| `stills/00.png` through `stills/07.png` | Eight full-resolution, persistently labeled cue cards.                                            |
| `video-timeline.json`                   | Canonical narration cues and timing; source for the media assets.                                 |
| `render_draft.py`                       | Local-only renderer and validator; does not read GitHub or capture the desktop.                   |
| `test_render_draft.py`                  | Timing, narration, subtitle, and label regression checks.                                         |
| `agentproof-shot-log.template.md`       | Sanitized source log for the genuine final recording; currently only a template.                  |

The main script and timeline must agree. `--validate` checks that relationship,
all scene boundaries, per-scene speech budget, caption ordering, two-line
caption length, and caption reading rate. `--check` also decodes/counts frames
and checks the actual MP4 duration, format, absence of audio, generated text,
and manifest digests.

## Regenerate on Windows

Use Python 3.10+, the optional media dependency declared in
`requirements-media.txt`, FFmpeg/FFprobe on PATH, and the existing Windows
Segoe UI fonts. These are media-production tools, not application runtime
dependencies. No cloud service or text-to-speech upload is used.

From the repository root:

```powershell
python 'hackathon-2026\assets\render_draft.py' --validate
python -B -m unittest discover -s 'hackathon-2026\assets' -p 'test_render_draft.py'
python 'hackathon-2026\assets\render_draft.py' --render
python 'hackathon-2026\assets\render_draft.py' --check
```

If Pillow is missing, install the declared optional dependency:

```powershell
python -m pip install -r 'hackathon-2026\assets\requirements-media.txt'
```

The renderer overwrites its named draft, transcript, captions, manifest, and
numbered stills. It does not alter product code, collect evidence, launch
reviewers, or make human decisions.

For submission, record the actual product shots described in
[the script](../video-script.md), add the presenter's voiceover, complete the
shot log/privacy review, and export a **separately named** master. The
1:56 animatic meets the timing target but not the real-footage requirement.

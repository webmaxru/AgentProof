# Final challenge media

The checked-in master is a narrated, staged demonstration built only from
synthetic data and the validated historical record for PR #2. Every frame
carries `STAGED DEMO | SYNTHETIC DATA`.

| Asset                                       | Purpose                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| `agentproof-submission-master.mp4`          | Final 164-second, 1920x1080, 30 fps narrated video.                      |
| `agentproof-canvas-live.webm`               | Recorded 1920x1080 Evidence Board Canvas walkthrough used in the master. |
| `agentproof-submission-master.srt`          | Upload-ready captions synchronized to the eight scenes.                  |
| `agentproof-form-submission-deck.pptx`      | Three-slide deck built for the Microsoft Forms requirement.              |
| `agentproof-submission-deck.pptx`           | Optional eight-slide 16:9 supporting presentation.                       |
| `stills-final/`                             | Full-resolution source frames and submission thumbnails.                 |
| `agentproof-submission-voiceover.txt`       | Clean narration script.                                                  |
| `agentproof-submission-master.manifest.txt` | Duration, format, and SHA-256 verification record.                       |
| `submission-timeline.json`                  | Canonical timing, narration, headings, and visual types.                 |
| `render_submission.py`                      | Deterministic still, caption, narration, video, and manifest generator.  |
| `generate_submission_deck.mjs`              | PowerPoint generator using the final frames.                             |

## Regenerate on Windows

Use Python 3.10+, Pillow, FFmpeg/FFprobe, PowerShell, Windows speech
synthesis, and the Segoe UI fonts included with Windows. Install the temporary
deck dependency without changing repository manifests:

```powershell
npm install --no-save --package-lock=false pptxgenjs
```

Then run:

```powershell
python hackathon-2026\assets\render_submission.py --validate
node hackathon-2026\assets\record_canvas_walkthrough.mjs
python hackathon-2026\assets\render_submission.py --render
node hackathon-2026\assets\generate_submission_deck.mjs
python hackathon-2026\assets\render_form_deck.py
node hackathon-2026\assets\generate_form_deck.mjs
python -B -m unittest discover -s hackathon-2026\assets -p test_render_submission.py
```

No media is uploaded to a speech or rendering service. The local voice is a
production convenience, not a claim that the sequence was captured live.
GitHub checks, comments, reviews, artifacts, and repository rules remain the
auditable record and enforcement boundary.

import copy
import json
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import render_draft as draft


class TimelineTests(unittest.TestCase):
    def setUp(self):
        self.timeline = json.loads(draft.TIMELINE.read_text(encoding="utf-8"))

    def test_approved_timing_and_word_count(self):
        self.assertEqual(draft.validate(self.timeline), 234)
        draft.check_script(self.timeline)
        self.assertEqual(self.timeline["scenes"][-1]["end"], 116)

    def test_timeline_gap_is_rejected(self):
        self.timeline["scenes"][1]["start"] += 1
        with self.assertRaisesRegex(ValueError, "contiguous"):
            draft.validate(self.timeline)

    def test_over_limit_is_rejected(self):
        self.timeline["scenes"][-1]["end"] = 121
        with self.assertRaisesRegex(ValueError, "two-minute"):
            draft.validate(self.timeline)

    def test_shortened_final_scene_is_rejected(self):
        self.timeline["scenes"][-1]["end"] = 115
        self.timeline["scenes"][-1]["cues"][-1]["end"] = 114.9
        with self.assertRaisesRegex(ValueError, "declared duration"):
            draft.validate(self.timeline)

    def test_caption_overlap_is_rejected(self):
        self.timeline["scenes"][0]["cues"][1]["start"] = 1
        with self.assertRaisesRegex(ValueError, "overlap"):
            draft.validate(self.timeline)

    def test_nonfinite_caption_time_is_rejected(self):
        self.timeline["scenes"][0]["cues"][0]["end"] = float("nan")
        with self.assertRaisesRegex(ValueError, "finite"):
            draft.validate(self.timeline)

    def test_missing_label_is_rejected(self):
        self.timeline["label"] = "Live demo"
        with self.assertRaisesRegex(ValueError, "persistent"):
            draft.validate(self.timeline)

    def test_unreadable_caption_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "two 42-character"):
            draft.caption_lines("A" * 43)
        self.timeline["scenes"][0]["cues"][0]["end"] = 0.1
        with self.assertRaisesRegex(ValueError, "characters/second"):
            draft.validate(self.timeline)

    def test_rushed_narration_is_rejected(self):
        scene = self.timeline["scenes"][0]
        scene["cues"] = [{"start": 0, "end": 10, "text": " ".join(["a"] * 30)}]
        with self.assertRaisesRegex(ValueError, "145 wpm"):
            draft.validate(self.timeline)

    def test_duplicate_scene_is_rejected(self):
        duplicate = copy.deepcopy(self.timeline["scenes"][0])
        self.timeline["scenes"].append(duplicate)
        with self.assertRaisesRegex(ValueError, "unique"):
            draft.validate(self.timeline)

    def test_srt_preserves_every_spoken_word(self):
        srt = draft.subtitle_text(self.timeline)
        lines = [
            line for line in srt.splitlines()
            if line and not line.isdigit() and "-->" not in line
        ]
        self.assertEqual(" ".join(lines), " ".join(draft.voiceover_text(self.timeline).split()))
        self.assertIn("00:00:00,000 --> 00:00:01,500", srt)
        self.assertIn("00:01:52,600 --> 00:01:55,500", srt)

    def test_encoded_duration_is_checked_not_just_timeline(self):
        for duration in ("121", "115", "nan"):
            with self.subTest(duration=duration):
                media = {
                    "format": {"duration": duration},
                    "streams": [{
                        "codec_type": "video", "codec_name": "h264",
                        "width": 1920, "height": 1080, "pix_fmt": "yuv420p",
                        "r_frame_rate": "30/1", "nb_read_frames": "3480",
                    }],
                }
                with patch.object(draft, "executable", return_value="ffprobe"):
                    with patch.object(
                        draft.subprocess, "run",
                        return_value=SimpleNamespace(stdout=json.dumps(media)),
                    ):
                        with self.assertRaisesRegex(ValueError, "encoded duration"):
                            draft.check_media(self.timeline)

    def test_audio_is_not_mislabeled_as_silent(self):
        media = {"streams": [{"codec_type": "video"}, {"codec_type": "audio"}]}
        with patch.object(draft, "executable", return_value="ffprobe"):
            with patch.object(
                draft.subprocess, "run", return_value=SimpleNamespace(stdout=json.dumps(media)),
            ):
                with self.assertRaisesRegex(ValueError, "no audio"):
                    draft.check_media(self.timeline)


if __name__ == "__main__":
    unittest.main()

import sys
from pathlib import Path
import unittest

from PIL import Image


ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

import render_submission as submission


class SubmissionMediaTests(unittest.TestCase):
    def setUp(self):
        self.timeline = submission.load_timeline()

    def test_timeline_meets_challenge_limit(self):
        submission.validate(self.timeline)
        self.assertLessEqual(self.timeline["durationSeconds"], 180)
        self.assertEqual(self.timeline["scenes"][-1]["end"], 164)

    def test_every_final_frame_has_disclosure_banner(self):
        expected_gold = (251, 191, 36)
        for index, scene in enumerate(self.timeline["scenes"]):
            frame = submission.STILLS / f"{index:02}-{scene['id']}.png"
            self.assertTrue(frame.is_file(), frame)
            with Image.open(frame) as image:
                banner = image.crop((0, 0, 650, 80))
                gold_pixels = sum(
                    1
                    for pixel in banner.get_flattened_data()
                    if pixel == expected_gold
                )
            self.assertGreater(gold_pixels, 1000, frame)

    def test_generated_master_matches_declared_media_contract(self):
        self.assertTrue(submission.CANVAS_LIVE.is_file())
        self.assertGreaterEqual(submission.media_duration(submission.CANVAS_LIVE), 67)
        submission.check(self.timeline)


if __name__ == "__main__":
    unittest.main()

"""Render and verify the explicitly precomputed two-minute rehearsal assets."""

import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import textwrap


ROOT = Path(__file__).resolve().parent
TIMELINE = ROOT / "video-timeline.json"
STEM = "agentproof-silent-draft"
LABEL = "PRECOMPUTED / NOT LIVE - STORYBOARD ONLY"
WIDTH, HEIGHT, FPS, TARGET, MAXIMUM = 1920, 1080, 30, 116, 120


def words(text):
    return len(re.findall(r"[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*", text))


def narration(scene):
    return " ".join(cue["text"] for cue in scene["cues"])


def caption_lines(text):
    lines = textwrap.wrap(text, width=42, break_long_words=False, break_on_hyphens=False)
    if not lines or len(lines) > 2 or any(len(line) > 42 for line in lines):
        raise ValueError(f"Caption must fit two 42-character lines: {text!r}")
    return "\n".join(lines)


def validate(timeline):
    for key, expected in (
        ("schemaVersion", 1),
        ("durationSeconds", TARGET),
        ("maximumSeconds", MAXIMUM),
        ("fps", FPS),
    ):
        if type(timeline[key]) is not int or timeline[key] != expected:
            raise ValueError(f"{key} must equal {expected}")
    if timeline["label"] != LABEL:
        raise ValueError("The persistent precomputed/not-live label is required")
    if not timeline["scenes"]:
        raise ValueError("At least one scene is required")
    previous_end = 0
    ids = set()
    total_words = 0
    for scene in timeline["scenes"]:
        if scene["id"] in ids:
            raise ValueError("Scene IDs must be unique")
        ids.add(scene["id"])
        if any(type(scene[key]) is not int for key in ("start", "end")):
            raise ValueError("Scene boundaries must be whole seconds")
        if scene["start"] != previous_end or not scene["start"] < scene["end"] <= MAXIMUM:
            raise ValueError("Scenes must be contiguous and within the two-minute cap")
        if any(not isinstance(scene[key], str) or not scene[key].strip()
               for key in ("id", "title", "overlay", "picture")):
            raise ValueError("Every scene needs a title, overlay, picture, and ID")
        if not scene["points"] or any(not isinstance(point, str) or not point.strip()
                                      for point in scene["points"]):
            raise ValueError("Every scene needs nonempty picture directions")
        previous_cue_end = scene["start"]
        if not scene["cues"]:
            raise ValueError("Every scene needs spoken captions")
        for cue in scene["cues"]:
            if any(type(cue[key]) not in (int, float) or not math.isfinite(cue[key])
                   for key in ("start", "end")):
                raise ValueError("Caption boundaries must be finite numbers")
            if not previous_cue_end <= cue["start"] < cue["end"] <= scene["end"]:
                raise ValueError("Captions must not overlap or leave their scene")
            if not isinstance(cue["text"], str) or " ".join(cue["text"].split()) != cue["text"]:
                raise ValueError("Caption text must use single-space, nonempty wording")
            caption_lines(cue["text"])
            if len(cue["text"]) / (cue["end"] - cue["start"]) > 24:
                raise ValueError(f"Caption exceeds 24 characters/second: {cue['text']}")
            previous_cue_end = cue["end"]
        count = words(narration(scene))
        if count * 60 / (scene["end"] - scene["start"]) > 145:
            raise ValueError(f"Scene narration exceeds the 145 wpm budget: {scene['id']}")
        total_words += count
        previous_end = scene["end"]
    if previous_end != timeline["durationSeconds"]:
        raise ValueError("The last scene must end at the declared duration")
    return total_words


def timecode(seconds):
    return f"{int(seconds) // 60}:{int(seconds) % 60:02}"


def srt_time(seconds):
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3_600_000)
    minutes, milliseconds = divmod(milliseconds, 60_000)
    seconds, milliseconds = divmod(milliseconds, 1000)
    return f"{hours:02}:{minutes:02}:{seconds:02},{milliseconds:03}"


def subtitle_text(timeline):
    blocks = []
    for scene in timeline["scenes"]:
        for cue in scene["cues"]:
            blocks.append(
                f"{len(blocks) + 1}\n{srt_time(cue['start'])} --> {srt_time(cue['end'])}\n"
                f"{caption_lines(cue['text'])}"
            )
    return "\n\n".join(blocks) + "\n"


def voiceover_text(timeline):
    return "\n\n".join(narration(scene) for scene in timeline["scenes"]) + "\n"


def check_script(timeline):
    script = (ROOT.parent / "video-script.md").read_text(encoding="utf-8")
    script = re.sub(r"(?m)^> ?", "", script)
    normalized = " ".join(script.split())
    for scene in timeline["scenes"]:
        if narration(scene) not in normalized:
            raise ValueError(f"Script narration differs from timeline: {scene['id']}")
        span = f"{timecode(scene['start'])}-{timecode(scene['end'])}"
        if span not in script:
            raise ValueError(f"Script is missing scene boundary {span}")


def executable(name):
    path = shutil.which(name)
    if path is None:
        raise FileNotFoundError(f"Required media tool is not on PATH: {name}")
    return path


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def manifest_text(timeline):
    return (
        f"{LABEL}\n"
        "Type: silent cue-card animatic, not recorded product evidence\n"
        f"Video: {STEM}.mp4\n"
        f"Duration: {TARGET}.000 seconds\n"
        f"Dimensions: {WIDTH}x{HEIGHT}\n"
        f"Frame rate: {FPS}/1\n"
        f"Frames: {TARGET * FPS}\n"
        f"Scenes: {len(timeline['scenes'])}\n"
        f"Narration words: {sum(words(narration(scene)) for scene in timeline['scenes'])}\n"
        "Audio: none; presenter voiceover remains to be recorded\n"
        "Captions: full narration; rehearsal timings, retime to actual voice\n"
        f"Timeline SHA-256: {sha256(TIMELINE)}\n"
        f"Video SHA-256: {sha256(ROOT / (STEM + '.mp4'))}\n"
    )


def check_media(timeline):
    result = subprocess.run(
        [
            executable("ffprobe"), "-v", "error", "-threads", "2", "-count_frames",
            "-show_entries",
            "format=duration:stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_read_frames",
            "-of", "json", str(ROOT / (STEM + ".mp4")),
        ],
        check=True, capture_output=True, text=True,
    )
    media = json.loads(result.stdout)
    if len(media["streams"]) != 1:
        raise ValueError("The silent draft must have exactly one video stream and no audio")
    stream = media["streams"][0]
    expected = {
        "codec_type": "video", "codec_name": "h264", "width": WIDTH, "height": HEIGHT,
        "pix_fmt": "yuv420p", "r_frame_rate": f"{FPS}/1", "nb_read_frames": str(TARGET * FPS),
    }
    for key, value in expected.items():
        if stream.get(key) != value:
            raise ValueError(f"Unexpected encoded {key}: {stream.get(key)!r}")
    duration = float(media["format"]["duration"])
    if not math.isfinite(duration) or duration > MAXIMUM or abs(duration - TARGET) > 1 / FPS:
        raise ValueError(f"Actual encoded duration is outside the budget: {duration}")
    for path, expected_text in (
        (ROOT / (STEM + ".srt"), subtitle_text(timeline)),
        (ROOT / "agentproof-voiceover.txt", voiceover_text(timeline)),
        (ROOT / (STEM + ".manifest.txt"), manifest_text(timeline)),
    ):
        if path.read_text(encoding="utf-8") != expected_text:
            raise ValueError(f"Generated artifact is stale: {path.name}")
    return duration


def render_stills(timeline, fonts):
    from PIL import Image, ImageDraw, ImageFont

    regular = fonts / "segoeui.ttf"
    bold = fonts / "segoeuib.ttf"
    if not regular.is_file() or not bold.is_file():
        raise FileNotFoundError("Pass --fonts with a directory containing segoeui.ttf and segoeuib.ttf")
    stills = ROOT / "stills"
    stills.mkdir(exist_ok=True)
    for index, scene in enumerate(timeline["scenes"]):
        image = Image.new("RGB", (WIDTH, HEIGHT), "#0b1220")
        draw = ImageDraw.Draw(image)

        def text(content, y, size, color="#f1f5f9", heavy=False, bottom=990):
            font = ImageFont.truetype(str(bold if heavy else regular), size)
            lines = []
            for paragraph in content.split("\n"):
                line = ""
                for word in paragraph.split():
                    candidate = f"{line} {word}".strip()
                    if draw.textlength(candidate, font=font) > WIDTH - 160:
                        if not line:
                            raise ValueError(f"Unbreakable text overflows frame: {word}")
                        lines.append(line)
                        line = word
                    else:
                        line = candidate
                lines.append(line)
            for line in lines:
                if draw.textlength(line, font=font) > WIDTH - 160:
                    raise ValueError(f"Text overflows frame width: {line}")
                box = draw.textbbox((80, y), line, font=font)
                if box[3] > bottom:
                    raise ValueError(f"Text overflows allotted frame region: {scene['id']}")
                draw.text((80, y), line, font=font, fill=color)
                y += int(size * 1.3)
            return y

        draw.rectangle((0, 0, WIDTH, 82), fill="#78350f")
        text(LABEL, 17, 34, heavy=True, bottom=80)
        text(
            f"AgentProof  |  {index + 1:02}/{len(timeline['scenes']):02}  |  "
            f"{timecode(scene['start'])}-{timecode(scene['end'])}",
            124, 33, color="#5eead4", bottom=180,
        )
        text(scene["title"], 212, 80, heavy=True, bottom=430)
        text(scene["overlay"], 450, 40, color="#5eead4", bottom=555)
        y = 595
        for number, point in enumerate(scene["points"], start=1):
            y = text(f"{number}. {point}", y, 38, bottom=820) + 16
        text(scene["picture"], 865, 30, color="#cbd5e1", bottom=955)
        draw.rectangle((80, 987, WIDTH - 80, 990), fill="#334155")
        text(
            "REHEARSAL ONLY  |  Replace cue cards with verified footage  |  No audio",
            1010, 27, color="#cbd5e1", bottom=HEIGHT - 20,
        )
        image.save(stills / f"{index:02}.png")


def render(timeline, fonts):
    render_stills(timeline, fonts)
    command = [
        executable("ffmpeg"), "-hide_banner", "-loglevel", "error", "-y",
        "-filter_complex_threads", "1",
    ]
    for index, scene in enumerate(timeline["scenes"]):
        command += [
            "-threads", "1", "-loop", "1", "-framerate", "1",
            "-t", str(scene["end"] - scene["start"]),
            "-i", str(ROOT / "stills" / f"{index:02}.png"),
        ]
    inputs = "".join(f"[{index}:v]" for index in range(len(timeline["scenes"])))
    command += [
        "-filter_complex",
        f"{inputs}concat=n={len(timeline['scenes'])}:v=1:a=0,fps={FPS},format=yuv420p[v]",
        "-map", "[v]", "-an", "-r", str(FPS), "-frames:v", str(TARGET * FPS),
        "-c:v", "libx264", "-threads", "2", "-preset", "fast", "-tune", "stillimage",
        "-crf", "22", "-movflags", "+faststart",
        str(ROOT / (STEM + ".mp4")),
    ]
    subprocess.run(command, check=True)
    (ROOT / (STEM + ".srt")).write_text(subtitle_text(timeline), encoding="utf-8", newline="\n")
    (ROOT / "agentproof-voiceover.txt").write_text(
        voiceover_text(timeline), encoding="utf-8", newline="\n",
    )
    (ROOT / (STEM + ".manifest.txt")).write_text(
        manifest_text(timeline), encoding="utf-8", newline="\n",
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--validate", action="store_true", help="Check narration, timing, and script")
    mode.add_argument("--render", action="store_true", help="Regenerate all labeled rehearsal assets")
    mode.add_argument("--check", action="store_true", help="Verify the actual encoded media and text")
    parser.add_argument(
        "--fonts", type=Path,
        default=Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts",
    )
    args = parser.parse_args()
    timeline = json.loads(TIMELINE.read_text(encoding="utf-8"))
    total = validate(timeline)
    check_script(timeline)
    for scene in timeline["scenes"]:
        count = words(narration(scene))
        pace = 60 * count / (scene["end"] - scene["start"])
        print(
            f"{timecode(scene['start'])}-{timecode(scene['end'])}: {count} words, {pace:.1f} wpm",
            flush=True,
        )
    if args.render:
        render(timeline, args.fonts)
    if args.render or args.check:
        print(f"Actual media verified: {check_media(timeline):.3f}s, {TARGET * FPS} frames, no audio")
    print(f"{total} words; {60 * total / TARGET:.1f} wpm overall; {LABEL}")


if __name__ == "__main__":
    main()

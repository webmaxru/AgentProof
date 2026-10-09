"""Render and verify the final AgentProof challenge media package."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import textwrap

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
TIMELINE = ROOT / "submission-timeline.json"
STILLS = ROOT / "stills-final"
AUDIO = ROOT / "audio-final"
CAPTURES = ROOT / "canvas-captures"
MASTER = ROOT / "agentproof-submission-master.mp4"
CANVAS_LIVE = ROOT / "agentproof-canvas-live.webm"
CAPTIONS = ROOT / "agentproof-submission-master.srt"
VOICEOVER = ROOT / "agentproof-submission-voiceover.txt"
MANIFEST = ROOT / "agentproof-submission-master.manifest.txt"
WIDTH, HEIGHT = 1920, 1080

BG = "#07101f"
PANEL = "#0f1d32"
PANEL_2 = "#132640"
TEXT = "#f8fafc"
MUTED = "#a8b5c7"
MINT = "#2dd4bf"
CORAL = "#fb7185"
GOLD = "#fbbf24"
BLUE = "#60a5fa"
GREEN = "#34d399"
RED = "#f87171"


def executable(name: str) -> str:
    path = shutil.which(name)
    if not path:
        raise FileNotFoundError(f"Required executable is not on PATH: {name}")
    return path


def load_timeline() -> dict:
    return json.loads(TIMELINE.read_text(encoding="utf-8"))


def words(text: str) -> int:
    return len(re.findall(r"[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*", text))


def validate(timeline: dict) -> None:
    if timeline["schemaVersion"] != 1:
        raise ValueError("Unsupported timeline schema")
    duration = timeline["durationSeconds"]
    maximum = timeline["maximumSeconds"]
    if not 0 < duration <= maximum <= 180:
        raise ValueError("Video must be positive and no longer than three minutes")
    if timeline["fps"] != 30:
        raise ValueError("Submission video must use 30 fps")
    previous = 0
    for scene in timeline["scenes"]:
        if scene["start"] != previous or scene["end"] <= scene["start"]:
            raise ValueError("Scenes must be contiguous and ordered")
        if scene["end"] > duration:
            raise ValueError("Scene exceeds declared duration")
        for key in ("id", "eyebrow", "title", "caption", "visual"):
            if not isinstance(scene[key], str) or not scene[key].strip():
                raise ValueError(f"Scene field is required: {key}")
        pace = 60 * words(scene["caption"]) / (scene["end"] - scene["start"])
        if pace > 150:
            raise ValueError(f"Narration is too fast in {scene['id']}: {pace:.1f} wpm")
        previous = scene["end"]
    if previous != duration:
        raise ValueError("Final scene must end at the declared duration")


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    fonts = Path(r"C:\Windows\Fonts")
    path = fonts / ("segoeuib.ttf" if bold else "segoeui.ttf")
    return ImageFont.truetype(str(path), size)


def wrapped(draw: ImageDraw.ImageDraw, text: str, max_width: int, face: ImageFont.FreeTypeFont) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        if not paragraph:
            lines.append("")
            continue
        line = ""
        for word in paragraph.split():
            candidate = f"{line} {word}".strip()
            if line and draw.textlength(candidate, font=face) > max_width:
                lines.append(line)
                line = word
            else:
                line = candidate
        lines.append(line)
    return lines


def text_block(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[int, int],
    max_width: int,
    size: int,
    color: str = TEXT,
    bold: bool = False,
    spacing: float = 1.2,
) -> int:
    face = font(size, bold)
    x, y = xy
    for line in wrapped(draw, text, max_width, face):
        draw.text((x, y), line, font=face, fill=color)
        y += int(size * spacing)
    return y


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: str, outline: str | None = None, width: int = 2, radius: int = 24) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def paste_contained(
    image: Image.Image,
    source_path: Path,
    box: tuple[int, int, int, int],
    background: str = "#ffffff",
) -> None:
    x1, y1, x2, y2 = box
    target_width = x2 - x1
    target_height = y2 - y1
    with Image.open(source_path).convert("RGB") as source:
        scale = min(target_width / source.width, target_height / source.height)
        resized = source.resize(
            (int(source.width * scale), int(source.height * scale)),
            Image.Resampling.LANCZOS,
        )
    frame = Image.new("RGB", (target_width, target_height), background)
    frame.paste(
        resized,
        ((target_width - resized.width) // 2, (target_height - resized.height) // 2),
    )
    image.paste(frame, (x1, y1))


def pill(draw: ImageDraw.ImageDraw, text: str, x: int, y: int, color: str, width: int | None = None) -> None:
    face = font(26, True)
    measured = int(draw.textlength(text, font=face)) + 48
    w = width or measured
    rounded(draw, (x, y, x + w, y + 50), color, radius=25)
    draw.text((x + 24, y + 9), text, font=face, fill=BG)


def header(draw: ImageDraw.ImageDraw, timeline: dict, scene: dict, index: int) -> None:
    draw.rectangle((0, 0, WIDTH, 68), fill="#0b1728")
    pill(draw, timeline["label"], 58, 9, GOLD)
    draw.text(
        (WIDTH - 245, 20),
        f"{index + 1:02}/{len(timeline['scenes']):02}  {scene['start']//60}:{scene['start']%60:02}",
        font=font(24, True),
        fill=MUTED,
    )
    draw.text((70, 112), scene["eyebrow"], font=font(28, True), fill=MINT)
    text_block(draw, scene["title"], (70, 160), 1780, 66, TEXT, True, 1.08)


def footer(draw: ImageDraw.ImageDraw, scene: dict) -> None:
    rounded(draw, (55, 875, WIDTH - 55, 1035), "#091525", outline="#25405f", width=2, radius=24)
    text_block(draw, scene["caption"], (85, 900), WIDTH - 170, 27, "#d8e2ef", False, 1.26)


def scene_question(draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (70, 375, 1180, 820), PANEL, outline="#294565")
    draw.text((110, 410), "Pull request #2", font=font(33, True), fill=TEXT)
    draw.text((110, 462), "Demonstrate blocked unsafe AgentProof change", font=font(39, True), fill=TEXT)
    pill(draw, "AI assistance: self-declared", 110, 540, BLUE)
    draw.text((110, 625), "HEAD SHA", font=font(24, True), fill=MUTED)
    draw.text((110, 668), "502aaf17d7a49c73c2c0bfef76aff2f69dc9ead3", font=font(28, True), fill=MINT)
    rounded(draw, (1250, 375, 1850, 820), "#1b2030", outline=CORAL, width=3)
    draw.text((1300, 425), "RELEASE LEAD", font=font(28, True), fill=CORAL)
    text_block(draw, "Can I trust the evidence for this exact change?", (1300, 505), 490, 46, TEXT, True, 1.16)


def scene_signals(draw: ImageDraw.ImageDraw) -> None:
    cards = [
        ("2", "direct release-validation cases", CORAL),
        ("9", "accounts with adjacent AI-governance signals", MINT),
        ("5", "accounts needing traceable legal/compliance evidence", GOLD),
    ]
    x = 70
    for value, label, color in cards:
        rounded(draw, (x, 390, x + 555, 745), PANEL, outline=color, width=3)
        draw.text((x + 42, 420), value, font=font(112, True), fill=color)
        text_block(draw, label, (x + 42, 570), 470, 34, TEXT, True, 1.18)
        x += 600
    draw.text(
        (82, 790),
        "Problem evidence, not customer endorsement. Names, quotes, tenant links, and private evidence are excluded.",
        font=font(25),
        fill=MUTED,
    )


def scene_workflow(draw: ImageDraw.ImageDraw) -> None:
    labels = [
        ("1", "PR head SHA", BLUE),
        ("2", "Automated\nfacts", MINT),
        ("3", "Rules from the\nprotected branch", GOLD),
        ("4", "Read-only AI\nreviewers", BLUE),
        ("5", "Review screen", MINT),
        ("6", "Human decides", CORAL),
    ]
    x, y = 65, 450
    for index, (number, label, color) in enumerate(labels):
        w = 270
        rounded(draw, (x, y, x + w, y + 230), PANEL, outline=color, width=3)
        pill(draw, number, x + 25, y + 20, color, width=55)
        text_block(draw, label, (x + 25, y + 95), w - 50, 32, TEXT, True, 1.18)
        if index < len(labels) - 1:
            draw.line((x + w + 8, y + 115, x + w + 38, y + 115), fill=MUTED, width=5)
            draw.polygon([(x + w + 38, y + 115), (x + w + 20, y + 104), (x + w + 20, y + 126)], fill=MUTED)
        x += 300
    pill(draw, "No secrets", 125, 735, MINT)
    pill(draw, "Same full SHA", 425, 735, BLUE)
    pill(draw, "PR cannot weaken policy", 755, 735, GOLD)
    pill(draw, "No automatic approval", 1260, 735, CORAL)


def scene_evidence(image: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (55, 335, 1100, 840), "#ffffff", outline=BLUE, width=3, radius=18)
    paste_contained(
        image,
        CAPTURES / "evidence-board-pr2-overview.png",
        (70, 350, 1085, 825),
    )
    rounded(draw, (1130, 350, 1850, 825), PANEL, outline=MINT, width=3)
    pill(draw, "BLOCKED", 1180, 390, RED)
    draw.text((1180, 475), "The Canvas proves:", font=font(34, True), fill=TEXT)
    bullets = [
        "full PR head SHA is bound",
        "protected-base policy is named",
        "5 pass / 1 unknown stay distinct",
        "one unresolved fact blocks release",
    ]
    y = 545
    for item in bullets:
        draw.ellipse((1182, y + 8, 1200, y + 26), fill=MINT)
        y = text_block(draw, item, (1220, y), 570, 29, TEXT, True, 1.18) + 18
    draw.text((1180, 770), "GitHub remains authoritative.", font=font(25, True), fill=MUTED)


def scene_states(image: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (55, 335, 1095, 840), "#ffffff", outline=GOLD, width=3, radius=18)
    paste_contained(
        image,
        CAPTURES / "evidence-board-pr2-human-boundary.png",
        (70, 350, 1080, 825),
    )
    rounded(draw, (1125, 350, 1850, 825), PANEL, outline=CORAL, width=3)
    draw.text((1170, 390), "The safe handoff", font=font(38, True), fill=TEXT)
    steps = [
        ("1", "Select the unresolved finding"),
        ("2", "Draft an exact full-SHA command"),
        ("3", "Authorized human submits in GitHub"),
    ]
    y = 485
    for number, label in steps:
        pill(draw, number, 1170, y, MINT, width=55)
        text_block(draw, label, (1250, y + 5), 520, 29, TEXT, True, 1.18)
        y += 95
    pill(draw, "DRAFT ONLY - NOT APPROVAL", 1170, 735, GOLD)


def scene_kit(draw: ImageDraw.ImageDraw) -> None:
    items = [
        ("4", "agent profiles"),
        ("2", "reusable skills"),
        ("1", "Evidence Board canvas"),
        ("3", "evidence/policy schemas"),
        ("4", "GitHub workflows"),
        ("6", "adoption measures"),
    ]
    x, y = 80, 385
    for index, (value, label) in enumerate(items):
        rounded(draw, (x, y, x + 530, y + 185), PANEL, outline=MINT if index % 2 == 0 else BLUE, width=2)
        draw.text((x + 35, y + 25), value, font=font(70, True), fill=MINT if index % 2 == 0 else BLUE)
        text_block(draw, label, (x + 135, y + 50), 350, 31, TEXT, True)
        x += 590
        if x > 1500:
            x, y = 80, y + 220
    pill(draw, "Customer-approved policy", 210, 805, GOLD)
    pill(draw, "Synthetic / authorized data", 695, 805, MINT)
    pill(draw, "Independent human review", 1215, 805, CORAL)


def scene_competitive(draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (70, 380, 890, 750), PANEL, outline="#4b5563", width=2)
    draw.text((120, 420), "Claude Code", font=font(43, True), fill=TEXT)
    draw.text((120, 495), "Code editing", font=font(30), fill=MUTED)
    draw.text((120, 550), "Connected tools / MCP", font=font(30), fill=MUTED)
    draw.text((120, 605), "Agentic workflows", font=font(30), fill=MUTED)
    rounded(draw, (1000, 380, 1850, 750), PANEL, outline=MINT, width=4)
    draw.text((1050, 420), "AgentProof on GitHub Copilot App", font=font(39, True), fill=MINT)
    benefits = [
        "Repository-native context and full SHA binding",
        "Checks, artifacts, comments, reviews, and rules",
        "Multi-agent specialist handoff",
        "Protected-base policy and human decision surface",
    ]
    y = 505
    for item in benefits:
        draw.ellipse((1055, y + 4, 1075, y + 24), fill=MINT)
        draw.text((1095, y), item, font=font(27, True), fill=TEXT)
        y += 67
    pill(draw, "Differentiator: governed workflow, not model superiority", 310, 785, GOLD)


def scene_feedback(draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (70, 370, 1060, 820), PANEL, outline=CORAL, width=3)
    draw.text((115, 410), "Permission canary", font=font(40, True), fill=CORAL)
    draw.text((115, 485), "Selected", font=font(27, True), fill=MUTED)
    draw.text((300, 485), "50 tools -> 21 selected read-only", font=font(30, True), fill=TEXT)
    draw.text((115, 555), "Actual", font=font(27, True), fill=MUTED)
    draw.text((300, 555), "tools that could change files remained", font=font(28, True), fill=TEXT)
    pill(draw, "CANARY BLOCKED", 115, 650, RED)
    draw.text((115, 735), "No changes made. Automation disabled.", font=font(27, True), fill=MUTED)
    rounded(draw, (1140, 370, 1850, 820), "#102338", outline=MINT, width=3)
    text_block(draw, "Agents accelerate the work.", (1190, 425), 610, 48, TEXT, True, 1.15)
    text_block(draw, "Current evidence and accountable humans decide what ships.", (1190, 570), 610, 44, MINT, True, 1.15)


VISUALS = {
    "question": scene_question,
    "signals": scene_signals,
    "workflow": scene_workflow,
    "evidence": scene_evidence,
    "states": scene_states,
    "kit": scene_kit,
    "competitive": scene_competitive,
    "feedback": scene_feedback,
}


def render_stills(timeline: dict) -> None:
    STILLS.mkdir(exist_ok=True)
    for index, scene in enumerate(timeline["scenes"]):
        image = Image.new("RGB", (WIDTH, HEIGHT), BG)
        draw = ImageDraw.Draw(image)
        header(draw, timeline, scene, index)
        visual = VISUALS[scene["visual"]]
        if scene["visual"] in {"evidence", "states"}:
            visual(image, draw)
        else:
            visual(draw)
        footer(draw, scene)
        image.save(STILLS / f"{index:02}-{scene['id']}.png")


def srt_time(seconds: float) -> str:
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def write_text_assets(timeline: dict) -> None:
    captions = []
    voiceover = []
    for index, scene in enumerate(timeline["scenes"], start=1):
        captions.append(
            f"{index}\n{srt_time(scene['start'] + 0.25)} --> {srt_time(scene['end'] - 0.25)}\n"
            + "\n".join(textwrap.wrap(scene["caption"], width=62))
        )
        voiceover.append(scene["caption"])
    CAPTIONS.write_text("\n\n".join(captions) + "\n", encoding="utf-8", newline="\n")
    VOICEOVER.write_text("\n\n".join(voiceover) + "\n", encoding="utf-8", newline="\n")


def render_audio() -> None:
    AUDIO.mkdir(exist_ok=True)
    subprocess.run(
        [
            executable("powershell"),
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(ROOT / "render_narration.ps1"),
            "-TimelinePath",
            str(TIMELINE),
            "-OutputDirectory",
            str(AUDIO),
        ],
        check=True,
    )


def media_duration(path: Path) -> float:
    result = subprocess.run(
        [
            executable("ffprobe"),
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def render_video(timeline: dict) -> None:
    inputs: list[str] = []
    filters: list[str] = []
    pairs: list[str] = []
    for index, scene in enumerate(timeline["scenes"]):
        duration = scene["end"] - scene["start"]
        image = STILLS / f"{index:02}-{scene['id']}.png"
        audio = AUDIO / f"{index:02}-{scene['id']}.wav"
        actual = media_duration(audio)
        if actual > duration - 0.5:
            raise ValueError(
                f"Narration for {scene['id']} is {actual:.2f}s but scene is only {duration}s"
            )
        if 2 <= index <= 4:
            if not CANVAS_LIVE.is_file():
                raise FileNotFoundError(
                    f"Live Canvas recording is required for scene {scene['id']}: {CANVAS_LIVE}"
                )
            live_offset = scene["start"] - timeline["scenes"][2]["start"]
            inputs += [
                "-ss",
                str(live_offset),
                "-t",
                str(duration),
                "-i",
                str(CANVAS_LIVE),
                "-i",
                str(audio),
            ]
            filters.append(
                f"[{index * 2}:v]scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease,"
                f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:color={BG},"
                f"fps=30,format=yuv420p,trim=duration={duration},setpts=PTS-STARTPTS[v{index}]"
            )
        else:
            inputs += [
                "-loop",
                "1",
                "-t",
                str(duration),
                "-i",
                str(image),
                "-i",
                str(audio),
            ]
            filters.append(
                f"[{index * 2}:v]fps=30,format=yuv420p,trim=duration={duration},setpts=PTS-STARTPTS[v{index}]"
            )
        filters.append(
            f"[{index * 2 + 1}:a]apad,atrim=duration={duration},asetpts=PTS-STARTPTS[a{index}]"
        )
        pairs.append(f"[v{index}][a{index}]")
    filters.append(
        "".join(pairs)
        + f"concat=n={len(timeline['scenes'])}:v=1:a=1[v][a]"
    )
    subprocess.run(
        [
            executable("ffmpeg"),
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            *inputs,
            "-filter_complex",
            ";".join(filters),
            "-map",
            "[v]",
            "-map",
            "[a]",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "20",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-movflags",
            "+faststart",
            str(MASTER),
        ],
        check=True,
    )


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check(timeline: dict) -> None:
    if not MASTER.is_file():
        raise FileNotFoundError(MASTER)
    result = subprocess.run(
        [
            executable("ffprobe"),
            "-v",
            "error",
            "-show_entries",
            "format=duration:stream=codec_type,width,height,r_frame_rate",
            "-of",
            "json",
            str(MASTER),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    media = json.loads(result.stdout)
    duration = float(media["format"]["duration"])
    if duration > timeline["maximumSeconds"] or abs(duration - timeline["durationSeconds"]) > 0.1:
        raise ValueError(f"Unexpected video duration: {duration}")
    types = {stream["codec_type"] for stream in media["streams"]}
    if types != {"video", "audio"}:
        raise ValueError(f"Expected one video and one audio stream, got {types}")
    video = next(stream for stream in media["streams"] if stream["codec_type"] == "video")
    if video.get("width") != WIDTH or video.get("height") != HEIGHT or video.get("r_frame_rate") != "30/1":
        raise ValueError("Video dimensions or frame rate are incorrect")
    if len(list(STILLS.glob("*.png"))) != len(timeline["scenes"]):
        raise ValueError("Stills are missing")
    MANIFEST.write_text(
        "\n".join(
            [
                timeline["label"],
                "Type: narrated staged demonstration using synthetic data",
                f"Duration: {duration:.3f} seconds",
                f"Maximum: {timeline['maximumSeconds']} seconds",
                f"Dimensions: {WIDTH}x{HEIGHT}",
                "Frame rate: 30 fps",
                "Audio: Windows local speech synthesis",
                f"Live Canvas walkthrough: {sha256(CANVAS_LIVE)}",
                f"Scenes: {len(timeline['scenes'])}",
                f"Narration words: {sum(words(scene['caption']) for scene in timeline['scenes'])}",
                f"Timeline SHA-256: {sha256(TIMELINE)}",
                f"Video SHA-256: {sha256(MASTER)}",
                "",
            ]
        ),
        encoding="utf-8",
        newline="\n",
    )
    print(
        f"Verified {MASTER.name}: {duration:.3f}s, {WIDTH}x{HEIGHT}, 30 fps, audio present."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--render", action="store_true")
    group.add_argument("--check", action="store_true")
    group.add_argument("--validate", action="store_true")
    args = parser.parse_args()
    timeline = load_timeline()
    validate(timeline)
    total_words = sum(words(scene["caption"]) for scene in timeline["scenes"])
    print(
        f"{len(timeline['scenes'])} scenes, {timeline['durationSeconds']} seconds, "
        f"{total_words} words, {60 * total_words / timeline['durationSeconds']:.1f} wpm"
    )
    if args.render:
        render_stills(timeline)
        write_text_assets(timeline)
        render_audio()
        render_video(timeline)
        check(timeline)
    elif args.check:
        check(timeline)


if __name__ == "__main__":
    main()

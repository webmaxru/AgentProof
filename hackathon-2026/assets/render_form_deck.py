"""Render the three-slide Microsoft Forms architecture deck."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "form-deck-stills"
CAPTURES = ROOT / "canvas-captures"
WIDTH, HEIGHT = 1920, 1080

BG = "#07101f"
PANEL = "#10213a"
PANEL_LIGHT = "#f6f8fa"
TEXT = "#f8fafc"
INK = "#172033"
MUTED = "#a8b5c7"
MUTED_DARK = "#58677a"
MINT = "#2dd4bf"
BLUE = "#60a5fa"
GOLD = "#fbbf24"
CORAL = "#fb7185"
GREEN = "#34d399"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    fonts = Path(r"C:\Windows\Fonts")
    return ImageFont.truetype(
        str(fonts / ("segoeuib.ttf" if bold else "segoeui.ttf")),
        size,
    )


def rounded(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    fill: str,
    outline: str | None = None,
    width: int = 2,
    radius: int = 28,
) -> None:
    draw.rounded_rectangle(
        box,
        radius=radius,
        fill=fill,
        outline=outline,
        width=width,
    )


def wrapped(
    draw: ImageDraw.ImageDraw,
    text: str,
    max_width: int,
    face: ImageFont.FreeTypeFont,
) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        current = ""
        for word in paragraph.split():
            candidate = f"{current} {word}".strip()
            if current and draw.textlength(candidate, font=face) > max_width:
                lines.append(current)
                current = word
            else:
                current = candidate
        lines.append(current)
    return lines


def text_block(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[int, int],
    max_width: int,
    size: int,
    color: str,
    bold: bool = False,
    spacing: float = 1.18,
) -> int:
    x, y = xy
    face = font(size, bold)
    for line in wrapped(draw, text, max_width, face):
        draw.text((x, y), line, font=face, fill=color)
        y += int(size * spacing)
    return y


def pill(
    draw: ImageDraw.ImageDraw,
    text: str,
    x: int,
    y: int,
    fill: str,
    ink: str = BG,
) -> None:
    face = font(24, True)
    width = int(draw.textlength(text, font=face)) + 46
    rounded(draw, (x, y, x + width, y + 48), fill, radius=24)
    draw.text((x + 23, y + 9), text, font=face, fill=ink)


def title(
    draw: ImageDraw.ImageDraw,
    eyebrow: str,
    headline: str,
    deck_index: str,
) -> None:
    pill(draw, eyebrow, 64, 48, GOLD)
    draw.text((1745, 56), deck_index, font=font(26, True), fill=MUTED)
    text_block(draw, headline, (64, 130), 1780, 68, TEXT, True, 1.06)


def paste_contained(
    image: Image.Image,
    source: Path,
    box: tuple[int, int, int, int],
    background: str = "#ffffff",
) -> None:
    x1, y1, x2, y2 = box
    target_width = x2 - x1
    target_height = y2 - y1
    with Image.open(source).convert("RGB") as source_image:
        scale = min(
            target_width / source_image.width,
            target_height / source_image.height,
        )
        resized = source_image.resize(
            (
                int(source_image.width * scale),
                int(source_image.height * scale),
            ),
            Image.Resampling.LANCZOS,
        )
    frame = Image.new("RGB", (target_width, target_height), background)
    frame.paste(
        resized,
        ((target_width - resized.width) // 2, (target_height - resized.height) // 2),
    )
    image.paste(frame, (x1, y1))


def slide_problem() -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)
    title(
        draw,
        "THE ENTERPRISE ASK",
        "AI can create the change.\nWho proves this exact commit is ready?",
        "01 / 03",
    )
    text_block(
        draw,
        "AgentProof turns scattered checks, AI review, and human judgment into one commit-bound release decision.",
        (68, 335),
        790,
        34,
        MUTED,
        False,
        1.22,
    )
    cards = [
        ("2", "direct release-validation cases", CORAL),
        ("9", "accounts with adjacent AI-governance signals", MINT),
        ("5", "accounts needing traceable evidence", GOLD),
    ]
    x = 68
    for value, label, color in cards:
        rounded(draw, (x, 515, x + 250, 790), PANEL, outline=color, width=3)
        draw.text((x + 30, 535), value, font=font(86, True), fill=color)
        text_block(draw, label, (x + 30, 655), 190, 25, TEXT, True, 1.15)
        x += 270
    rounded(draw, (920, 330, 1850, 920), "#ffffff", outline=BLUE, width=4)
    paste_contained(
        image,
        CAPTURES / "evidence-board-pr2-overview.png",
        (940, 350, 1830, 900),
    )
    draw.text(
        (68, 945),
        "Customer-real problem evidence; no customer names, quotes, or private data.",
        font=font(23),
        fill=MUTED,
    )
    return image


def slide_flow() -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)
    title(
        draw,
        "REPEATABLE GITHUB COPILOT APP WORKFLOW",
        "One control loop. Six bounded handoffs.",
        "02 / 03",
    )
    steps = [
        ("1", "Pull request\nhead SHA", BLUE),
        ("2", "No-secret\nevidence", MINT),
        ("3", "Protected-base\npolicy", GOLD),
        ("4", "Read-only AI\nspecialists", BLUE),
        ("5", "Evidence Board\nCanvas", MINT),
        ("6", "Human decision\nin GitHub", CORAL),
    ]
    x = 62
    for index, (number, label, color) in enumerate(steps):
        rounded(draw, (x, 350, x + 275, 605), PANEL, outline=color, width=3)
        pill(draw, number, x + 24, 375, color)
        text_block(draw, label, (x + 24, 465), 225, 30, TEXT, True, 1.15)
        if index < len(steps) - 1:
            draw.line((x + 280, 477, x + 314, 477), fill=MUTED, width=5)
            draw.polygon(
                [(x + 314, 477), (x + 294, 465), (x + 294, 489)],
                fill=MUTED,
            )
        x += 315
    rounded(draw, (65, 675, 1855, 920), PANEL, outline="#294565", width=2)
    controls = [
        ("Cannot self-weaken", "Policy comes from the protected base revision."),
        ("Cannot blur states", "Pass, fail, unknown, and exception remain distinct."),
        ("Cannot self-approve", "The Canvas drafts; an eligible human decides in GitHub."),
    ]
    x = 105
    for headline, detail in controls:
        draw.text((x, 710), headline, font=font(29, True), fill=MINT)
        text_block(draw, detail, (x, 765), 480, 25, TEXT, False, 1.18)
        x += 580
    draw.text(
        (68, 970),
        "GitHub checks, comments, reviews, artifacts, and repository rules remain authoritative.",
        font=font(24, True),
        fill=GOLD,
    )
    return image


def slide_edge() -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)
    title(
        draw,
        "WHY THIS WINS",
        "The Canvas makes governance visible, usable, and human.",
        "03 / 03",
    )
    rounded(draw, (60, 335, 1110, 885), "#ffffff", outline=GOLD, width=4)
    paste_contained(
        image,
        CAPTURES / "evidence-board-pr2-human-boundary.png",
        (80, 355, 1090, 865),
    )
    rounded(draw, (1150, 335, 1860, 885), PANEL, outline=MINT, width=3)
    pill(draw, "COMPETITIVE EDGE", 1190, 375, MINT)
    text_block(
        draw,
        "Not a model-superiority claim.",
        (1190, 460),
        590,
        32,
        TEXT,
        True,
    )
    bullets = [
        "GitHub-native checks, artifacts, reviews, and rules",
        "Same-SHA handoff across specialists and humans",
        "Draft-only Canvas: no agent approval or merge",
    ]
    y = 535
    for item in bullets:
        draw.ellipse((1192, y + 8, 1212, y + 28), fill=MINT)
        y = text_block(draw, item, (1235, y), 550, 27, TEXT, True, 1.16) + 18
    pill(draw, "PILOT", 1190, 785, GOLD)
    draw.text(
        (1325, 796),
        "2 teams · reviewer effort · stale-decision blocks",
        font=font(22, True),
        fill=TEXT,
    )
    draw.text(
        (64, 945),
        "Product feedback: permission selection must match effective runtime tools; AgentProof fails closed when it does not.",
        font=font(23, True),
        fill=CORAL,
    )
    return image


def main() -> None:
    OUTPUT.mkdir(exist_ok=True)
    for index, slide in enumerate(
        [slide_problem(), slide_flow(), slide_edge()],
        start=1,
    ):
        slide.save(OUTPUT / f"{index:02}.png")
    print(f"Rendered 3 form-deck slides to {OUTPUT}")


if __name__ == "__main__":
    main()

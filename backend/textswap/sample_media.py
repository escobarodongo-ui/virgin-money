"""Synthetic storefront clip used by the sample button and the tests.

The scene is drawn, not filmed: a static CAFE board, a perspective banner that
slides a few pixels per frame, and an OPEN sign that enters halfway through.
Ground-truth quads are the painted text boxes, so detection tests can score
coverage without a hand-labeled video.
"""

from __future__ import annotations

import subprocess
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

FONT_CANDIDATES = [
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    Path("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"),
    Path("/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"),
]


def font_path() -> Path:
    for path in FONT_CANDIDATES:
        if path.exists():
            return path
    raise FileNotFoundError("Install DejaVu or Liberation fonts to render the sample clip.")


def render_clip(
    dest: Path,
    *,
    frames: int = 16,
    fps: int = 8,
    size: tuple[int, int] = (960, 540),
) -> dict:
    dest.parent.mkdir(parents=True, exist_ok=True)
    width, height = size
    font_file = font_path()
    title_font = ImageFont.truetype(str(font_file), 78)
    banner_font = ImageFont.truetype(str(font_file), 58)
    open_font = ImageFont.truetype(str(font_file), 42)
    raw_frames: list[bytes] = []
    regions = {
        "CAFE": [],
        "FRESH BREAD": [],
        "OPEN": [],
    }
    for index in range(frames):
        image, quads = render_frame(index, frames, width, height, title_font, banner_font, open_font)
        raw_frames.append(image.convert("RGB").tobytes())
        for text, quad in quads.items():
            regions[text].append({"frame": index, "quad": [[round(float(x), 2), round(float(y), 2)] for x, y in quad]})

    duration = frames / fps
    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-s",
        f"{width}x{height}",
        "-r",
        str(fps),
        "-i",
        "pipe:0",
        "-f",
        "lavfi",
        "-i",
        f"sine=frequency=440:sample_rate=48000:duration={duration:.3f}",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-preset",
        "veryfast",
        "-crf",
        "18",
        "-c:a",
        "aac",
        "-shortest",
        "-movflags",
        "+faststart",
        str(dest),
    ]
    subprocess.run(cmd, input=b"".join(raw_frames), check=True)
    return {
        "path": str(dest),
        "width": width,
        "height": height,
        "fps": fps,
        "frame_count": frames,
        "regions": [
            {"text": text, "frames": samples}
            for text, samples in regions.items()
            if samples
        ],
    }


def render_frame(index: int, frames: int, width: int, height: int, title_font, banner_font, open_font):
    image = Image.new("RGB", (width, height), (186, 164, 138))
    draw = ImageDraw.Draw(image)
    draw.rectangle([0, 0, width, 78], fill=(92, 48, 42))
    draw.rectangle([0, 300, width, height], fill=(118, 104, 90))
    draw.rectangle([48, 96, 430, 250], fill=(244, 236, 220), outline=(62, 48, 36), width=8)
    draw.rectangle([520, 110, 900, 300], fill=(214, 228, 230), outline=(70, 84, 88), width=8)
    draw.rectangle([700, 300, 860, 520], fill=(92, 62, 48))
    draw.ellipse([70, 320, 210, 460], fill=(64, 96, 62))
    cafe_origin = (118, 128)
    draw.text(cafe_origin, "CAFE", font=title_font, fill=(42, 32, 24))
    cafe_box = draw.textbbox(cafe_origin, "CAFE", font=title_font)
    quads = {"CAFE": _rect_quad(cafe_box)}

    banner = Image.new("RGB", (560, 120), (28, 32, 30))
    banner_draw = ImageDraw.Draw(banner)
    banner_origin = (36, 26)
    banner_draw.text(banner_origin, "FRESH BREAD", font=banner_font, fill=(245, 240, 230))
    text_box = banner_draw.textbbox(banner_origin, "FRESH BREAD", font=banner_font)
    slide = index * 6
    src = np.array([[0, 0], [559, 0], [559, 119], [0, 119]], dtype=np.float32)
    dst = np.array(
        [
            [70 + slide, 340],
            [640 + slide, 318],
            [616 + slide, 448],
            [96 + slide, 472],
        ],
        dtype=np.float32,
    )
    matrix = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(cv2.cvtColor(np.array(banner), cv2.COLOR_RGB2BGR), matrix, (width, height))
    mask = cv2.warpPerspective(np.full((120, 560), 255, np.uint8), matrix, (width, height))
    canvas = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    canvas[mask > 0] = warped[mask > 0]
    image = Image.fromarray(cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB))
    text_corners = np.array(
        [[text_box[0], text_box[1]], [text_box[2], text_box[1]], [text_box[2], text_box[3]], [text_box[0], text_box[3]]],
        dtype=np.float32,
    ).reshape(1, -1, 2)
    quads["FRESH BREAD"] = cv2.perspectiveTransform(text_corners, matrix)[0].tolist()

    if index >= frames // 2:
        draw = ImageDraw.Draw(image)
        sign = [718, 146, 910, 236]
        draw.rounded_rectangle(sign, radius=8, fill=(214, 56, 48))
        open_origin = (744, 164)
        draw.text(open_origin, "OPEN", font=open_font, fill=(255, 244, 230))
        quads["OPEN"] = _rect_quad(draw.textbbox(open_origin, "OPEN", font=open_font))
    return image, quads


def _rect_quad(box) -> list[list[float]]:
    left, top, right, bottom = box
    return [[left, top], [right, top], [right, bottom], [left, bottom]]

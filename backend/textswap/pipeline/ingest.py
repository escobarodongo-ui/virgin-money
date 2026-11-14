"""Probe a video, copy its audio, and build a browser preview proxy."""

from __future__ import annotations

import json
import threading
from fractions import Fraction
from pathlib import Path

from textswap.ffmpeg import (
    JobContext,
    audio_stream,
    display_size,
    ffprobe,
    frame_count,
    frame_rate,
    run_ffmpeg,
    video_stream,
)


def probe_media(path: Path) -> dict:
    raw = ffprobe(path)
    stream = video_stream(raw)
    fps = frame_rate(stream)
    width, height = display_size(stream)
    count = frame_count(stream, raw.get("format") or {}, fps)
    audio = audio_stream(raw)
    duration = float((raw.get("format") or {}).get("duration") or (count / float(fps)))
    return {
        "width": width,
        "height": height,
        "fps": float(fps),
        "fps_rational": f"{fps.numerator}/{fps.denominator}",
        "frame_count": count,
        "duration": duration,
        "video_codec": stream.get("codec_name"),
        "audio": None
        if audio is None
        else {
            "codec": audio.get("codec_name"),
            "sample_rate": audio.get("sample_rate"),
            "channels": audio.get("channels"),
        },
        "probe": raw,
    }


def extract_audio(source: Path, project_dir: Path, meta: dict, ctx: JobContext) -> dict:
    info = meta.get("audio")
    if not info:
        return {"present": False, "copied": False, "path": None, "codec": None}
    codec = str(info.get("codec") or "")
    ext = {
        "aac": ".m4a",
        "mp3": ".mp3",
        "opus": ".opus",
        "vorbis": ".ogg",
        "flac": ".flac",
        "pcm_s16le": ".wav",
    }.get(codec, ".mka")
    audio_dir = project_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    dest = audio_dir / f"source{ext}"
    if dest.exists() and dest.stat().st_size > 0:
        return {"present": True, "copied": True, "path": str(dest.relative_to(project_dir)), "codec": codec}
    partial = dest.with_name(f"{dest.stem}.partial{dest.suffix}")
    try:
        run_ffmpeg(["-i", str(source), "-vn", "-c:a", "copy", str(partial)], ctx)
        partial.replace(dest)
        copied = True
    except Exception:
        if partial.exists():
            partial.unlink()
        if ctx.cancelled():
            raise
        dest = audio_dir / "source.wav"
        partial = dest.with_name(f"{dest.stem}.partial{dest.suffix}")
        run_ffmpeg(["-i", str(source), "-vn", "-c:a", "pcm_s16le", str(partial)], ctx)
        partial.replace(dest)
        copied = False
        codec = "pcm_s16le"
    return {
        "present": True,
        "copied": copied,
        "path": str(dest.relative_to(project_dir)),
        "codec": codec,
    }


def build_proxy(
    source: Path,
    project_dir: Path,
    meta: dict,
    max_width: int,
    crf: int,
    ctx: JobContext,
) -> dict:
    dest = project_dir / "proxy.mp4"
    partial = project_dir / "proxy.partial.mp4"
    width = int(meta["width"])
    target = width if width <= max_width else max_width
    # Even dimensions keep yuv420 encoders happy without changing the aspect ratio much.
    scale = f"scale='min({target},iw)':-2"
    args = [
        "-i",
        str(source),
        "-vf",
        scale,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        str(crf),
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
    ]
    if meta.get("audio"):
        args.extend(["-c:a", "aac", "-b:a", "160k"])
    else:
        args.append("-an")
    args.append(str(partial))
    if not dest.exists():
        try:
            run_ffmpeg(args, ctx)
            partial.replace(dest)
        except Exception:
            if partial.exists():
                partial.unlink()
            raise
    proxy_meta = probe_media(dest)
    return {
        "path": "proxy.mp4",
        "width": proxy_meta["width"],
        "height": proxy_meta["height"],
        "codec": "h264",
    }


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f"{path.name}.{threading.get_ident()}.tmp")
    temp.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    temp.replace(path)


def rational_fps(meta: dict) -> Fraction:
    return Fraction(meta["fps_rational"])

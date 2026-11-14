"""FFmpeg helpers with cooperative cancel."""

from __future__ import annotations

import os
import select
import subprocess
import threading
from collections.abc import Iterator
from fractions import Fraction
from pathlib import Path

import numpy as np


class FFmpegError(RuntimeError):
    pass


class PipelineCancelled(RuntimeError):
    pass


class JobContext:
    """Cancel flag and child-process registry for one pipeline run."""

    def __init__(self) -> None:
        self._cancel = threading.Event()
        self._procs: list[subprocess.Popen] = []
        self._lock = threading.Lock()

    def cancel(self) -> None:
        self._cancel.set()
        self.kill()

    def cancelled(self) -> bool:
        return self._cancel.is_set()

    def check(self) -> None:
        if self._cancel.is_set():
            self.kill()
            raise PipelineCancelled()

    def popen(self, args: list[str], **kwargs) -> subprocess.Popen:
        self.check()
        proc = subprocess.Popen(args, **kwargs)
        with self._lock:
            self._procs.append(proc)
        return proc

    def kill(self) -> None:
        with self._lock:
            procs = list(self._procs)
        for proc in procs:
            if proc.poll() is None:
                proc.kill()


def run_ffmpeg(args: list[str], ctx: JobContext | None = None) -> None:
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args]
    if ctx is None:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise FFmpegError(result.stderr[-4000:] or "ffmpeg failed")
        return

    proc = ctx.popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    stderr_parts: list[str] = []

    def drain() -> None:
        assert proc.stderr is not None
        stderr_parts.append(proc.stderr.read())

    thread = threading.Thread(target=drain, daemon=True)
    thread.start()
    while proc.poll() is None:
        try:
            ctx.check()
        except PipelineCancelled:
            thread.join(timeout=2)
            raise
        try:
            proc.wait(timeout=0.2)
        except subprocess.TimeoutExpired:
            pass
    thread.join(timeout=2)
    if ctx.cancelled():
        raise PipelineCancelled()
    if proc.returncode != 0:
        raise FFmpegError("".join(stderr_parts)[-4000:] or "ffmpeg failed")


def ffprobe(path: Path) -> dict:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            str(path),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise FFmpegError(result.stderr[-2000:] or f"ffprobe failed for {path.name}")
    import json

    return json.loads(result.stdout)


def video_stream(probe: dict) -> dict:
    for stream in probe.get("streams", []):
        if stream.get("codec_type") == "video":
            return stream
    raise FFmpegError("no video stream found")


def audio_stream(probe: dict) -> dict | None:
    for stream in probe.get("streams", []):
        if stream.get("codec_type") == "audio":
            return stream
    return None


def frame_rate(stream: dict) -> Fraction:
    raw = stream.get("avg_frame_rate") or stream.get("r_frame_rate") or "0/1"
    fps = Fraction(raw)
    if fps <= 0:
        fps = Fraction(stream.get("r_frame_rate") or "25/1")
    if fps <= 0:
        raise FFmpegError("could not read a frame rate")
    return fps


def display_size(stream: dict) -> tuple[int, int]:
    width = int(stream["width"])
    height = int(stream["height"])
    tags = stream.get("tags") or {}
    rotation = abs(int(str(tags.get("rotate", "0")).strip() or 0)) % 360
    if rotation in {90, 270}:
        width, height = height, width
    return width, height


def frame_count(stream: dict, fmt: dict, fps: Fraction) -> int:
    raw = stream.get("nb_frames")
    if raw not in (None, "N/A", "0"):
        count = int(raw)
        if count > 0:
            return count
    duration = stream.get("duration") or fmt.get("duration")
    if duration is None:
        raise FFmpegError("could not determine frame count")
    return max(1, int(round(float(duration) * float(fps))))


def _read_exact(stream, size: int, ctx: JobContext) -> bytes | None:
    fd = stream.fileno()
    buf = bytearray()
    while len(buf) < size:
        ctx.check()
        ready, _, _ = select.select([fd], [], [], 0.2)
        if not ready:
            continue
        try:
            chunk = os.read(fd, size - len(buf))
        except BlockingIOError:
            continue
        if not chunk:
            return None
        buf.extend(chunk)
    return bytes(buf)


def iter_frames(
    path: Path,
    width: int,
    height: int,
    ctx: JobContext,
) -> Iterator[tuple[int, np.ndarray]]:
    """Decode every frame in order as BGR uint8 arrays."""
    proc = ctx.popen(
        [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            str(path),
            "-map",
            "0:v:0",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "bgr24",
            "pipe:1",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        bufsize=0,
    )
    assert proc.stdout is not None
    err_chunks: list[bytes] = []

    def _drain() -> None:
        if proc.stderr is not None:
            err_chunks.append(proc.stderr.read())

    drainer = threading.Thread(target=_drain, daemon=True)
    drainer.start()
    frame_bytes = width * height * 3
    index = 0
    try:
        while True:
            blob = _read_exact(proc.stdout, frame_bytes, ctx)
            if blob is None:
                break
            frame = np.frombuffer(blob, dtype=np.uint8).reshape((height, width, 3))
            yield index, frame.copy()
            index += 1
    finally:
        if proc.poll() is None:
            proc.kill()
        drainer.join(timeout=2)
        if proc.poll() is None:
            proc.wait(timeout=5)
        if ctx.cancelled():
            raise PipelineCancelled()
        if proc.returncode not in (0, None, -9) and index == 0:
            message = b"".join(err_chunks).decode(errors="replace")[-2000:]
            raise FFmpegError(message or "could not decode frames")

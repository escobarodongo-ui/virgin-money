"""Run the phase 1 pipeline: probe, audio, proxy, detect, associate."""

from __future__ import annotations

import logging
from pathlib import Path

import cv2
import numpy as np

from textswap.config import Settings
from textswap.ffmpeg import FFmpegError, JobContext, PipelineCancelled, iter_frames
from textswap.pipeline.associate import associate
from textswap.pipeline.detect import DetectorUnavailable, Hit, build_detector, resolve_backend
from textswap.pipeline.ingest import build_proxy, extract_audio, load_json, probe_media, write_json

log = logging.getLogger("textswap")

STAGES = ["probe", "extract_audio", "proxy", "detect", "associate"]
WEIGHTS = {
    "probe": 0.05,
    "extract_audio": 0.10,
    "proxy": 0.20,
    "detect": 0.60,
    "associate": 0.05,
}


class Progress:
    def __init__(self, ctx: JobContext, callback) -> None:
        self.ctx = ctx
        self.callback = callback
        self.stages = {name: {"name": name, "status": "pending", "progress": 0.0} for name in STAGES}

    def start(self, stage: str, message: str) -> None:
        self.stages[stage]["status"] = "running"
        self.callback(stage, self.overall(), message, self.snapshot(), None)

    def tick(self, stage: str, fraction: float, message: str) -> None:
        self.ctx.check()
        self.stages[stage]["status"] = "running"
        self.stages[stage]["progress"] = max(0.0, min(1.0, fraction))
        self.callback(stage, self.overall(), message, self.snapshot(), None)

    def finish(self, stage: str, message: str) -> None:
        self.stages[stage]["status"] = "completed"
        self.stages[stage]["progress"] = 1.0
        self.callback(stage, self.overall(), message, self.snapshot(), None)

    def overall(self) -> float:
        done = 0.0
        for name, weight in WEIGHTS.items():
            done += weight * float(self.stages[name]["progress"])
        return round(done, 4)

    def snapshot(self) -> list[dict]:
        return [dict(self.stages[name]) for name in STAGES]


def run_project_pipeline(
    project_dir: Path,
    settings: Settings,
    ctx: JobContext,
    progress_cb,
    detector=None,
) -> dict:
    progress = Progress(ctx, progress_cb)
    meta_path = project_dir / "meta.json"
    meta = load_json(meta_path) if meta_path.exists() else {}
    source = Path(meta["source"])
    if not source.is_absolute():
        source = project_dir / source

    progress.start("probe", "Reading video metadata")
    if "fps" not in meta:
        probed = probe_media(source)
        meta.update({key: probed[key] for key in (
            "width", "height", "fps", "fps_rational", "frame_count", "duration", "video_codec", "audio"
        )})
        meta["source"] = str(Path(meta["source"]).name) if "source" in meta else source.name
        write_json(meta_path, _public_meta(meta))
    else:
        # Keep the heavy probe blob out of the public meta file.
        pass
    if int(meta["width"]) > settings.max_edge or int(meta["height"]) > settings.max_edge:
        raise FFmpegError(
            f"Video is {meta['width']}×{meta['height']}, above the configured max_edge of {settings.max_edge}."
        )
    progress.finish("probe", f"{meta['width']}×{meta['height']} · {meta['frame_count']} frames")

    progress.start("extract_audio", "Copying the audio stream")
    audio = meta.get("audio_track")
    if not audio:
        audio = extract_audio(source, project_dir, meta, ctx)
        meta["audio_track"] = audio
        write_json(meta_path, _public_meta(meta))
    if audio.get("present"):
        note = "Audio copied without re-encoding" if audio.get("copied") else "Audio copied as WAV"
    else:
        note = "This clip has no audio"
    progress.finish("extract_audio", note)

    preset = settings.preset()
    progress.start("proxy", "Building a preview proxy")
    proxy_key = {"max_width": preset.proxy_max_width, "crf": preset.proxy_crf}
    if not meta.get("proxy") or meta.get("proxy_key") != proxy_key or not (project_dir / "proxy.mp4").exists():
        if (project_dir / "proxy.mp4").exists() and meta.get("proxy_key") != proxy_key:
            (project_dir / "proxy.mp4").unlink()
        meta["proxy"] = build_proxy(source, project_dir, meta, preset.proxy_max_width, preset.proxy_crf, ctx)
        meta["proxy_key"] = proxy_key
        write_json(meta_path, _public_meta(meta))
    progress.finish("proxy", "Preview is ready")

    backend = resolve_backend(settings.models.detector)
    cache_key = {
        "backend": backend,
        "stride": preset.sample_stride,
        "detect_max_width": preset.detect_max_width,
        "languages": list(settings.languages),
        "min_confidence": settings.min_confidence,
        "chunk_frames": settings.chunk_frames,
    }
    detect_dir = project_dir / "detections"
    if meta.get("detection_key") != cache_key:
        if detect_dir.exists():
            for child in detect_dir.glob("chunk_*.json"):
                child.unlink()
        regions = project_dir / "regions.json"
        if regions.exists():
            regions.unlink()
        meta["detection_key"] = cache_key
        write_json(meta_path, _public_meta(meta))

    progress.start("detect", "Detecting text")
    if detector is None:
        try:
            detector = build_detector(
                settings.models.detector,
                settings.languages,
                settings.resolved_device(),
                settings.min_confidence,
            )
        except DetectorUnavailable as exc:
            raise FFmpegError(str(exc)) from exc
    _detect_chunks(source, project_dir, meta, settings, detector, ctx, progress)
    progress.finish("detect", "Text detection cached")

    progress.start("associate", "Linking text across frames")
    detections = _load_detections(detect_dir)
    regions, warnings = associate(
        detections,
        preset.sample_stride,
        float(meta["fps"]),
        frame_count=int(meta["frame_count"]),
    )
    oversized = _load_warnings(detect_dir)
    warnings = oversized + warnings
    write_json(project_dir / "regions.json", {"regions": regions, "warnings": warnings})
    meta["warnings"] = warnings
    meta["region_count"] = len(regions)
    meta["status"] = "ready"
    write_json(meta_path, _public_meta(meta))
    progress.finish("associate", f"{len(regions)} text region{'s' if len(regions) != 1 else ''}")
    return meta


def _detect_chunks(source, project_dir: Path, meta: dict, settings: Settings, detector, ctx: JobContext, progress: Progress) -> None:
    preset = settings.preset()
    width, height = int(meta["width"]), int(meta["height"])
    frame_count = int(meta["frame_count"])
    stride = max(1, int(preset.sample_stride))
    chunk_size = max(1, int(settings.chunk_frames))
    detect_w, detect_h, scale_x, scale_y = _detect_scale(width, height, preset.detect_max_width)
    detect_dir = project_dir / "detections"
    detect_dir.mkdir(parents=True, exist_ok=True)

    chunk_start = 0
    chunk_hits: list[dict] = []
    chunk_warnings: list[dict] = []
    seen = 0

    def flush(end_index: int) -> None:
        nonlocal chunk_start, chunk_hits, chunk_warnings
        if end_index <= chunk_start:
            return
        path = detect_dir / f"chunk_{chunk_start:06d}.json"
        if not path.exists():
            write_json(
                path,
                {
                    "start_frame": chunk_start,
                    "end_frame": end_index,
                    "detections": chunk_hits,
                    "warnings": chunk_warnings,
                },
            )
        chunk_start = end_index
        chunk_hits = []
        chunk_warnings = []

    existing = {int(path.stem.split("_")[1]) for path in detect_dir.glob("chunk_*.json")}
    for index, frame in iter_frames(source, width, height, ctx):
        seen = index + 1
        chunk_end = chunk_start + chunk_size
        if index >= chunk_end:
            flush(index)
            chunk_end = chunk_start + chunk_size
        path = detect_dir / f"chunk_{chunk_start:06d}.json"
        cached = chunk_start in existing or path.exists()
        if not cached and index % stride == 0:
            small = frame
            if scale_x != 1 or scale_y != 1:
                small = cv2.resize(frame, (detect_w, detect_h), interpolation=cv2.INTER_AREA)
            hits, warnings = _run_detector(detector, small, scale_x, scale_y, width, height)
            for hit in hits:
                chunk_hits.append({"frame_index": index, "time": round(index / float(meta["fps"]), 4), **hit})
            for warning in warnings:
                warning["frame_index"] = index
                chunk_warnings.append(warning)
        if seen == frame_count or (index + 1) % chunk_size == 0:
            flush(index + 1)
        fraction = seen / max(frame_count, 1)
        if index % 5 == 0 or seen == frame_count:
            progress.tick("detect", fraction, f"Frame {seen} of {frame_count}")
    flush(seen)
    if seen == 0:
        raise FFmpegError("The decoder produced no frames.")
    if seen != frame_count:
        meta["frame_count"] = seen
        meta["duration"] = seen / float(meta["fps"])


def _run_detector(detector, frame: np.ndarray, scale_x: float, scale_y: float, width: int, height: int):
    hits = detector.detect(frame)
    warnings = []
    exported = []
    for hit in hits:
        quad = hit.quad if isinstance(hit, Hit) else hit["quad"]
        text = hit.text if isinstance(hit, Hit) else hit["text"]
        confidence = hit.confidence if isinstance(hit, Hit) else hit["confidence"]
        angle = hit.angle if isinstance(hit, Hit) else hit.get("angle", 0)
        scaled = [[float(x) / scale_x, float(y) / scale_y] for x, y in quad]
        area = _poly_area(scaled)
        if area > 0.4 * width * height:
            warnings.append(
                {
                    "code": "region_too_large",
                    "message": "A text mask covered more than 40% of the frame and was skipped.",
                }
            )
            continue
        exported.append(
            {
                "quad": [[round(x, 2), round(y, 2)] for x, y in scaled],
                "text": text,
                "confidence": float(confidence),
                "angle": float(angle),
            }
        )
    if len(exported) > 25:
        exported.sort(key=lambda item: item["confidence"], reverse=True)
        warnings.append(
            {
                "code": "too_many_regions",
                "message": "This frame had more than 25 text regions; the 25 strongest were kept.",
            }
        )
        exported = exported[:25]
    return exported, warnings


def _poly_area(points) -> float:
    pts = np.asarray(points, dtype=np.float32)
    return float(abs(cv2.contourArea(pts)))


def _detect_scale(width: int, height: int, max_width: int) -> tuple[int, int, float, float]:
    if width <= max_width:
        return width, height, 1.0, 1.0
    target_w = max_width
    target_h = max(1, int(round(height * (target_w / width))))
    return target_w, target_h, target_w / width, target_h / height


def _load_detections(detect_dir: Path) -> list[dict]:
    found: list[dict] = []
    if not detect_dir.exists():
        return found
    for path in sorted(detect_dir.glob("chunk_*.json")):
        payload = load_json(path)
        found.extend(payload.get("detections") or [])
    return found


def _load_warnings(detect_dir: Path) -> list[dict]:
    found: list[dict] = []
    if not detect_dir.exists():
        return found
    for path in sorted(detect_dir.glob("chunk_*.json")):
        for warning in load_json(path).get("warnings") or []:
            found.append(warning)
    return found


def _public_meta(meta: dict) -> dict:
    skip = {"probe"}
    return {key: value for key, value in meta.items() if key not in skip}

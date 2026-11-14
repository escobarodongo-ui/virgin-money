"""Link per-frame detections into clickable regions.

This is a preview association based on overlap and text, so the player can show
one box per phrase. Optical-flow / point tracking is a later phase; between
sampled frames the quad is linearly interpolated for display only.
"""

from __future__ import annotations

from textswap.geometry import lerp_quad, quad_iou, quad_to_list
from textswap.pipeline.detect import alnum_key


def _compatible(a: str, b: str) -> bool:
    left, right = alnum_key(a), alnum_key(b)
    if not left or not right:
        return True
    if left == right or left in right or right in left:
        return True
    return _ratio(left, right) >= 0.62


def _ratio(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    rows = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        nxt = [i]
        for j, cb in enumerate(b, start=1):
            nxt.append(min(nxt[j - 1] + 1, rows[j] + 1, rows[j - 1] + (ca != cb)))
        rows = nxt
    distance = rows[-1]
    return 1.0 - distance / max(len(a), len(b))


def associate(
    detections: list[dict],
    stride: int,
    fps: float,
    frame_count: int | None = None,
) -> tuple[list[dict], list[dict]]:
    """Return regions and warnings. `detections` are dicts with frame_index, quad, text, confidence."""
    by_frame: dict[int, list[dict]] = {}
    for det in detections:
        by_frame.setdefault(int(det["frame_index"]), []).append(det)
    tracks: list[dict] = []
    max_gap = max(stride * 3, stride + 1)
    for frame_index in sorted(by_frame):
        dets = by_frame[frame_index]
        pairs: list[tuple[float, int, int]] = []
        for track_index, track in enumerate(tracks):
            last = track["frames"][-1]
            gap = frame_index - int(last["frame_index"])
            if gap <= 0 or gap > max_gap:
                continue
            for det_index, det in enumerate(dets):
                if not _compatible(track["text_hint"], det["text"]):
                    continue
                score = quad_iou(last["quad"], det["quad"])
                if score >= 0.12:
                    pairs.append((score, track_index, det_index))
        pairs.sort(reverse=True)
        used_tracks: set[int] = set()
        used_dets: set[int] = set()
        for score, track_index, det_index in pairs:
            if track_index in used_tracks or det_index in used_dets:
                continue
            used_tracks.add(track_index)
            used_dets.add(det_index)
            det = dets[det_index]
            tracks[track_index]["frames"].append(det)
            if alnum_key(det["text"]):
                tracks[track_index]["text_hint"] = det["text"]
        for det_index, det in enumerate(dets):
            if det_index in used_dets:
                continue
            tracks.append({"frames": [det], "text_hint": det["text"]})

    regions: list[dict] = []
    warnings: list[dict] = []
    for track in tracks:
        frames = sorted(track["frames"], key=lambda item: int(item["frame_index"]))
        text, confidence = _consensus(frames)
        # A single weak read is usually a texture the stroke detector mistook for letters.
        if len(frames) == 1 and confidence < 0.72:
            continue
        region_id = f"r{len(regions) + 1:03d}"
        start = int(frames[0]["frame_index"])
        end = int(frames[-1]["frame_index"])
        if frame_count and frame_count - 1 - end <= stride:
            end = frame_count - 1
        region = {
            "id": region_id,
            "text": text,
            "confidence": round(confidence, 4),
            "start_frame": start,
            "end_frame": end,
            "start_time": round(start / fps, 4) if fps else 0,
            "end_time": round(end / fps, 4) if fps else 0,
            "angle": frames[len(frames) // 2].get("angle", 0),
            "frames": [
                {
                    "frame_index": int(item["frame_index"]),
                    "time": round(int(item["frame_index"]) / fps, 4) if fps else 0,
                    "quad": quad_to_list(item["quad"]),
                    "text": item["text"],
                    "confidence": round(float(item["confidence"]), 4),
                }
                for item in frames
            ],
        }
        regions.append(region)
        if confidence < 0.55:
            warnings.append(
                {
                    "code": "low_confidence",
                    "region_id": region_id,
                    "start_frame": start,
                    "end_frame": end,
                    "message": f"{text or 'A region'} is only weakly recognized. Check the spelling before a later replace step.",
                }
            )
        for prev, nxt in zip(frames, frames[1:]):
            gap = int(nxt["frame_index"]) - int(prev["frame_index"])
            if gap > max(stride * 2, stride + 1):
                warnings.append(
                    {
                        "code": "detection_gap",
                        "region_id": region_id,
                        "start_frame": int(prev["frame_index"]),
                        "end_frame": int(nxt["frame_index"]),
                        "message": (
                            f"No box for “{text}” between frames {prev['frame_index']} and {nxt['frame_index']}. "
                            "The preview blends the quad across that gap. Those frames will need a manual "
                            "keyframe once tracking lands, if the blend does not follow the motion."
                        ),
                    }
                )
    return regions, warnings


def quad_at_frame(region: dict, frame_index: int):
    """Interpolated quad for display. None when the frame is outside the region span."""
    frames = region["frames"]
    if not frames:
        return None
    if frame_index < region["start_frame"] or frame_index > region["end_frame"]:
        return None
    previous = frames[0]
    nxt = frames[-1]
    for sample in frames:
        if int(sample["frame_index"]) == frame_index:
            return quad_to_list(sample["quad"])
        if int(sample["frame_index"]) < frame_index:
            previous = sample
        elif int(sample["frame_index"]) > frame_index:
            nxt = sample
            break
    if int(previous["frame_index"]) == int(nxt["frame_index"]):
        return quad_to_list(previous["quad"])
    span = int(nxt["frame_index"]) - int(previous["frame_index"])
    t = (frame_index - int(previous["frame_index"])) / span
    return quad_to_list(lerp_quad(previous["quad"], nxt["quad"], t))


def _consensus(frames: list[dict]) -> tuple[str, float]:
    buckets: dict[str, list[dict]] = {}
    for frame in frames:
        buckets.setdefault(alnum_key(frame["text"]) or frame["text"].upper(), []).append(frame)
    best_key = max(
        buckets,
        key=lambda key: (len(buckets[key]), max(float(item["confidence"]) for item in buckets[key])),
    )
    chosen = max(buckets[best_key], key=lambda item: float(item["confidence"]))
    confidence = float(sum(float(item["confidence"]) for item in frames) / len(frames))
    return chosen["text"], confidence

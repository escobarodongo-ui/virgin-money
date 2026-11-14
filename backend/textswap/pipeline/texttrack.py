"""A text edit is a track: one pose per frame, never a single box reused everywhere.

The renderer asks `pose_at` for the frame it is showing. If that frame has no
visible pose, nothing is drawn. Masks stay empty until the removal step.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np


def pose_at(track: dict, frame_index: int) -> dict | None:
    """Return the stored pose for this frame only. Never borrows a neighbor."""
    for pose in track.get("frames") or []:
        if int(pose["frame_index"]) != int(frame_index):
            continue
        if not pose.get("visible", False):
            return None
        return pose
    return None


def track_document(
    *,
    track_id: str,
    original_text: str,
    replacement_text: str,
    poses: list[dict],
    style: dict | None = None,
) -> dict:
    visible = [pose for pose in poses if pose.get("visible")]
    if not visible:
        start = end = 0
    else:
        indexes = [int(pose["frame_index"]) for pose in visible]
        start, end = min(indexes), max(indexes)
    return {
        "id": track_id,
        "start_frame": start,
        "end_frame": end,
        "original_text": original_text,
        "replacement_text": replacement_text,
        "style": style or {},
        "reference_quad": visible[0]["quad"] if visible else [],
        "frames": poses,
    }


def save_track(path: Path, track: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(track, indent=2), encoding="utf-8")


def load_track(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def homography_to_list(matrix) -> list[list[float]]:
    array = np.asarray(matrix, dtype=np.float64).reshape(3, 3)
    return [[round(float(value), 6) for value in row] for row in array]


def mean_corner_distance(quad_a, quad_b) -> float:
    left = np.asarray(quad_a, dtype=np.float64).reshape(4, 2)
    right = np.asarray(quad_b, dtype=np.float64).reshape(4, 2)
    return float(np.linalg.norm(left - right, axis=1).mean())

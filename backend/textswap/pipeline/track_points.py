"""Lock a text quad to the footage with point tracks and a per-frame homography.

Points are followed with pyramidal Lucas-Kanade, forward from the keyframe and
backward from it. Each frame's quad is the keyframe quad mapped by a RANSAC
homography (affine if there are not enough stable points). CoTracker and SAM 2
are not wired here.
"""

from __future__ import annotations

import cv2
import numpy as np

from textswap.pipeline.texttrack import homography_to_list, mean_corner_distance


def track_quad(
    frames_bgr: list[np.ndarray],
    seed_quad,
    seed_index: int,
) -> list[dict]:
    """One pose per frame. `seed_quad` is four points on `frames_bgr[seed_index]`."""
    if not frames_bgr:
        return []
    seed = np.asarray(seed_quad, dtype=np.float32).reshape(4, 2)
    forward = _propagate(frames_bgr, seed, seed_index, direction=1)
    backward = _propagate(frames_bgr, seed, seed_index, direction=-1)
    merged = [_merge_pose(index, seed_index, forward.get(index), backward.get(index)) for index in range(len(frames_bgr))]
    cuts = _scene_cuts(frames_bgr)
    return _smooth(merged, cuts)


def drift_against(poses: list[dict], truth_by_frame: dict[int, list]) -> float:
    errors = []
    for pose in poses:
        truth = truth_by_frame.get(int(pose["frame_index"]))
        if truth is None or not pose.get("visible"):
            continue
        errors.append(mean_corner_distance(pose["quad"], truth))
    if not errors:
        return float("inf")
    return float(sum(errors) / len(errors))


def _propagate(frames_bgr: list[np.ndarray], seed: np.ndarray, seed_index: int, direction: int) -> dict[int, dict]:
    poses: dict[int, dict] = {}
    identity = np.eye(3, dtype=np.float64)
    poses[seed_index] = _pose(seed_index, seed, identity, confidence=1.0, visible=True, occluded=False)
    points = _sample_points(seed)
    reference = points.copy()
    gray = cv2.cvtColor(frames_bgr[seed_index], cv2.COLOR_BGR2GRAY)
    index = seed_index
    while 0 <= index + direction < len(frames_bgr):
        nxt_index = index + direction
        nxt = cv2.cvtColor(frames_bgr[nxt_index], cv2.COLOR_BGR2GRAY)
        tracked, status = _flow(gray, nxt, points)
        back, back_status = _flow(nxt, gray, tracked)
        good = _consistent(points, tracked, status, back, back_status)
        homography, used = _fit_homography(reference[good], tracked[good]) if int(good.sum()) >= 4 else (None, 0)
        if homography is None:
            poses[nxt_index] = _pose(nxt_index, seed, identity, confidence=0.0, visible=False, occluded=True)
            break
        warped = cv2.perspectiveTransform(seed.reshape(1, -1, 2), homography.astype(np.float32)).reshape(4, 2)
        confidence = float(used / max(1, len(points)))
        poses[nxt_index] = _pose(
            nxt_index,
            warped,
            homography,
            confidence=confidence,
            visible=_inside(warped, gray.shape[1], gray.shape[0]),
            occluded=confidence < 0.45,
        )
        points = tracked
        gray = nxt
        index = nxt_index
    return poses


def _flow(prev: np.ndarray, nxt: np.ndarray, points: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    found, status, _err = cv2.calcOpticalFlowPyrLK(
        prev,
        nxt,
        points.reshape(-1, 1, 2).astype(np.float32),
        None,
        winSize=(21, 21),
        maxLevel=3,
        criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 20, 0.03),
    )
    if found is None or status is None:
        return points.copy(), np.zeros(len(points), dtype=np.uint8)
    return found.reshape(-1, 2), status.reshape(-1)


def _consistent(origin, tracked, status, back, back_status, limit: float = 1.5) -> np.ndarray:
    forward_ok = status.reshape(-1) == 1
    back_ok = back_status.reshape(-1) == 1
    error = np.linalg.norm(back.reshape(-1, 2) - origin.reshape(-1, 2), axis=1)
    return forward_ok & back_ok & (error < limit)


def _fit_homography(src: np.ndarray, dst: np.ndarray) -> tuple[np.ndarray | None, int]:
    if len(src) < 4:
        return None, 0
    homography, mask = cv2.findHomography(src.astype(np.float32), dst.astype(np.float32), cv2.RANSAC, 2.0)
    if homography is not None and mask is not None and int(mask.sum()) >= 4:
        return homography, int(mask.sum())
    affine, inliers = cv2.estimateAffinePartial2D(src.astype(np.float32), dst.astype(np.float32), method=cv2.RANSAC)
    if affine is None:
        return None, 0
    matrix = np.eye(3, dtype=np.float64)
    matrix[:2, :] = affine
    used = int(inliers.sum()) if inliers is not None else len(src)
    return matrix, used


def _sample_points(quad: np.ndarray, nx: int = 4, ny: int = 3) -> np.ndarray:
    top_left, top_right, bottom_right, bottom_left = quad.reshape(4, 2)
    points = []
    for j in range(ny):
        v = j / (ny - 1)
        for i in range(nx):
            u = i / (nx - 1)
            top = top_left * (1 - u) + top_right * u
            bottom = bottom_left * (1 - u) + bottom_right * u
            points.append(top * (1 - v) + bottom * v)
    return np.asarray(points, dtype=np.float32)


def _merge_pose(index: int, seed_index: int, forward: dict | None, backward: dict | None) -> dict:
    if index == seed_index:
        return forward or backward
    if forward and backward and forward.get("visible") and backward.get("visible"):
        gap = mean_corner_distance(forward["quad"], backward["quad"])
        if gap <= 3.0:
            quad = (np.asarray(forward["quad"]) + np.asarray(backward["quad"])) / 2
            homography = forward["homography"]
            confidence = min(float(forward["confidence"]), float(backward["confidence"]))
            return _pose(index, quad, _matrix(homography), confidence=confidence, visible=True, occluded=False)
        chosen = forward if forward["confidence"] >= backward["confidence"] else backward
        low = dict(chosen)
        low["confidence"] = round(min(float(forward["confidence"]), float(backward["confidence"])) * 0.5, 4)
        low["occluded"] = True
        return low
    return forward or backward or _pose(index, np.zeros((4, 2)), np.eye(3), confidence=0.0, visible=False, occluded=True)


def _smooth(poses: list[dict], cuts: set[int]) -> list[dict]:
    """One-euro on each corner. A scene cut resets the filter instead of blending across it."""
    filters = [_OneEuro() for _ in range(8)]
    smoothed = []
    for pose in poses:
        if pose["frame_index"] in cuts:
            for item in filters:
                item.reset()
        if not pose.get("visible"):
            smoothed.append(pose)
            for item in filters:
                item.reset()
            continue
        quad = np.asarray(pose["quad"], dtype=np.float64).reshape(8)
        filtered = np.array([filters[i].filter(float(quad[i])) for i in range(8)], dtype=np.float64)
        updated = dict(pose)
        updated["quad"] = [[round(float(filtered[i]), 2), round(float(filtered[i + 1]), 2)] for i in range(0, 8, 2)]
        smoothed.append(updated)
    return smoothed


def _scene_cuts(frames_bgr: list[np.ndarray], threshold: float = 28.0) -> set[int]:
    cuts: set[int] = set()
    previous = None
    for index, frame in enumerate(frames_bgr):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        small = cv2.resize(gray, (64, 36), interpolation=cv2.INTER_AREA)
        if previous is not None and float(np.mean(np.abs(small.astype(np.float32) - previous))) >= threshold:
            cuts.add(index)
        previous = small.astype(np.float32)
    return cuts


def _inside(quad: np.ndarray, width: int, height: int) -> bool:
    center = quad.reshape(4, 2).mean(axis=0)
    return bool(0 <= center[0] < width and 0 <= center[1] < height)


def _matrix(value) -> np.ndarray:
    return np.asarray(value, dtype=np.float64).reshape(3, 3)


def _pose(index: int, quad, homography, *, confidence: float, visible: bool, occluded: bool) -> dict:
    points = np.asarray(quad, dtype=np.float64).reshape(4, 2)
    return {
        "frame_index": int(index),
        "quad": [[round(float(x), 2), round(float(y), 2)] for x, y in points],
        "homography": homography_to_list(homography),
        "visible": bool(visible),
        "occluded": bool(occluded),
        "confidence": round(float(confidence), 4),
        "mask": None,
    }


class _OneEuro:
    def __init__(self, min_cutoff: float = 1.2, beta: float = 0.02, d_cutoff: float = 1.0):
        self.min_cutoff = min_cutoff
        self.beta = beta
        self.d_cutoff = d_cutoff
        self.reset()

    def reset(self) -> None:
        self._value = None
        self._dx = 0.0

    def filter(self, value: float) -> float:
        if self._value is None:
            self._value = value
            return value
        dx = value - self._value
        alpha_d = _alpha(self.d_cutoff)
        self._dx = alpha_d * dx + (1 - alpha_d) * self._dx
        cutoff = self.min_cutoff + self.beta * abs(self._dx)
        alpha = _alpha(cutoff)
        self._value = alpha * value + (1 - alpha) * self._value
        return self._value


def _alpha(cutoff: float) -> float:
    tau = 1.0 / (2 * np.pi * max(cutoff, 1e-3))
    return float(1.0 / (1.0 + tau))

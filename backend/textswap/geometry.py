"""Quad geometry shared by detection, tracking preview, and tests."""

from __future__ import annotations

import math

import cv2
import numpy as np


def as_quad(points) -> np.ndarray:
    quad = np.asarray(points, dtype=np.float32).reshape(-1, 2)
    if quad.shape != (4, 2):
        raise ValueError(f"expected 4 points, got {quad.shape}")
    return quad


def order_quad(points) -> np.ndarray:
    """Return points as top-left, top-right, bottom-right, bottom-left."""
    pts = np.asarray(points, dtype=np.float32).reshape(-1, 2)
    if len(pts) != 4:
        rect = cv2.minAreaRect(pts.astype(np.float32))
        pts = cv2.boxPoints(rect)
    sums = pts.sum(axis=1)
    diffs = np.diff(pts, axis=1).reshape(-1)
    ordered = np.zeros((4, 2), dtype=np.float32)
    ordered[0] = pts[int(np.argmin(sums))]
    ordered[2] = pts[int(np.argmax(sums))]
    ordered[1] = pts[int(np.argmin(diffs))]
    ordered[3] = pts[int(np.argmax(diffs))]
    return ordered


def scale_about_center(quad, factor: float) -> np.ndarray:
    pts = as_quad(quad)
    center = pts.mean(axis=0, keepdims=True)
    return center + (pts - center) * float(factor)


def quad_area(quad) -> float:
    return float(abs(cv2.contourArea(as_quad(quad))))


def intersection_area(a, b) -> float:
    area, _ = cv2.intersectConvexConvex(as_quad(a), as_quad(b))
    return float(max(0.0, area))


def quad_iou(a, b) -> float:
    inter = intersection_area(a, b)
    if inter <= 0:
        return 0.0
    union = quad_area(a) + quad_area(b) - inter
    if union <= 0:
        return 0.0
    return inter / union


def coverage(inner, outer) -> float:
    """Fraction of `inner` covered by `outer`."""
    area = quad_area(inner)
    if area <= 0:
        return 0.0
    return intersection_area(inner, outer) / area


def quad_angle_deg(quad) -> float:
    pts = order_quad(quad)
    delta = pts[1] - pts[0]
    return float(math.degrees(math.atan2(float(delta[1]), float(delta[0]))))


def clip_quad_to_frame(quad, width: int, height: int) -> np.ndarray | None:
    frame = np.array(
        [[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]],
        dtype=np.float32,
    )
    area, pts = cv2.intersectConvexConvex(as_quad(quad), frame)
    if area <= 1 or pts is None:
        return None
    pts = np.asarray(pts, dtype=np.float32).reshape(-1, 2)
    if len(pts) < 3:
        return None
    rect = cv2.minAreaRect(pts)
    clipped = order_quad(cv2.boxPoints(rect))
    if quad_area(clipped) < 16:
        return None
    return clipped


def lerp_quad(a, b, t: float):
    left = order_quad(a)
    right = order_quad(b)
    mixed = left * (1.0 - t) + right * t
    return order_quad(mixed)


def quad_to_list(quad) -> list[list[float]]:
    pts = order_quad(quad)
    return [[round(float(x), 2), round(float(y), 2)] for x, y in pts]

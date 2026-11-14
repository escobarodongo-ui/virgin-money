"""Text detection.

The default backend finds stroke blobs with OpenCV and reads them with Tesseract.
EasyOCR and PaddleOCR are optional backends selected from config. They are the
right choice for curved and heavily perspective-distorted text; the OpenCV path
returns a quad for every region so later tracking can warp either way.
"""

from __future__ import annotations

import re
import shutil
from dataclasses import dataclass

import cv2
import numpy as np

from textswap.geometry import (
    clip_quad_to_frame,
    order_quad,
    quad_angle_deg,
    quad_area,
    quad_iou,
    quad_to_list,
    scale_about_center,
)

TESSERACT_LANG = {
    "en": "eng",
    "eng": "eng",
    "fr": "fra",
    "de": "deu",
    "es": "spa",
    "zh": "chi_sim",
    "ja": "jpn",
    "ko": "kor",
    "ar": "ara",
    "ru": "rus",
    "pt": "por",
    "it": "ita",
}


@dataclass
class Hit:
    quad: list[list[float]]
    text: str
    confidence: float
    angle: float

    def to_dict(self) -> dict:
        return {
            "quad": self.quad,
            "text": self.text,
            "confidence": round(float(self.confidence), 4),
            "angle": round(float(self.angle), 2),
        }


def alnum_key(text: str) -> str:
    return re.sub(r"[^A-Z0-9]+", "", text.upper())


def clean_text(text: str) -> str:
    text = " ".join(text.replace("\n", " ").split())
    return text.strip(" \t|[]{}()<>~`*_=+/\\")


class DetectorUnavailable(RuntimeError):
    pass


class TextDetector:
    def detect(self, frame_bgr: np.ndarray) -> list[Hit]:
        raise NotImplementedError


def build_detector(backend: str, languages: list[str], device: str, min_confidence: float) -> TextDetector:
    choice = resolve_backend(backend)
    if choice == "opencv":
        return OpenCVTesseractDetector(languages, min_confidence)
    if choice == "easyocr":
        return EasyOCRDetector(languages, device == "cuda", min_confidence)
    if choice == "paddleocr":
        return PaddleOCRDetector(languages, device, min_confidence)
    raise DetectorUnavailable(f"unknown detector {backend!r}")


def resolve_backend(backend: str) -> str:
    if backend != "auto":
        return backend
    try:
        import easyocr  # noqa: F401
    except ImportError:
        return "opencv"
    return "easyocr"


class OpenCVTesseractDetector(TextDetector):
    def __init__(self, languages: list[str], min_confidence: float) -> None:
        if shutil.which("tesseract") is None:
            raise DetectorUnavailable(
                "Tesseract is not installed. Install the tesseract-ocr package, "
                "or set models.detector to easyocr after installing requirements-ml.txt."
            )
        import pytesseract

        self._ocr = pytesseract
        self.lang = "+".join(TESSERACT_LANG.get(lang, lang) for lang in languages) or "eng"
        self.min_confidence = min_confidence

    def detect(self, frame_bgr: np.ndarray) -> list[Hit]:
        height, width = frame_bgr.shape[:2]
        strokes = _stroke_mask(frame_bgr)
        link = cv2.morphologyEx(
            strokes,
            cv2.MORPH_CLOSE,
            cv2.getStructuringElement(cv2.MORPH_RECT, (17, 5)),
        )
        count, labels, stats, _ = cv2.connectedComponentsWithStats(link, connectivity=8)
        raw: list[Hit] = []
        for index in range(1, count):
            x, y, box_w, box_h, area = stats[index]
            if box_w < 18 or box_h < 12 or area < 80:
                continue
            if box_w > width * 0.96 or box_h > height * 0.85:
                continue
            component = np.where(labels == index, 255, 0).astype(np.uint8)
            points = cv2.findNonZero(cv2.bitwise_and(strokes, component))
            if points is None or len(points) < 25:
                continue
            rect = cv2.minAreaRect(points)
            (cx, cy), (rw, rh), _angle = rect
            long_side, short_side = max(rw, rh), min(rw, rh)
            if short_side < 8 or long_side < 20 or long_side / max(short_side, 1e-3) > 22:
                continue
            quad = scale_about_center(order_quad(cv2.boxPoints(rect)), 1.12)
            clipped = clip_quad_to_frame(quad, width, height)
            if clipped is None:
                continue
            if quad_area(clipped) > 0.4 * width * height:
                continue
            text, confidence = self._read_quad(frame_bgr, clipped)
            if confidence < self.min_confidence or len(alnum_key(text)) < 2:
                continue
            raw.append(
                Hit(
                    quad=quad_to_list(clipped),
                    text=text,
                    confidence=confidence,
                    angle=quad_angle_deg(clipped),
                )
            )
        return _suppress_and_group(frame_bgr, raw, self)

    def _read_quad(self, frame_bgr: np.ndarray, quad: np.ndarray) -> tuple[str, float]:
        crop = _warp(frame_bgr, quad)
        if crop.size == 0 or min(crop.shape[:2]) < 4:
            return "", 0.0
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        gray = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
        if gray.shape[0] < 48:
            factor = 64.0 / gray.shape[0]
            gray = cv2.resize(gray, None, fx=factor, fy=factor, interpolation=cv2.INTER_CUBIC)
        candidates = [gray, cv2.rotate(gray, cv2.ROTATE_180)]
        if gray.shape[0] > gray.shape[1]:
            candidates.append(cv2.rotate(gray, cv2.ROTATE_90_CLOCKWISE))
            candidates.append(cv2.rotate(gray, cv2.ROTATE_90_COUNTERCLOCKWISE))
        best_text = ""
        best_score = -1.0
        for image in candidates:
            text, score = self._read_gray(image)
            if score > best_score:
                best_text, best_score = text, score
        return best_text, max(0.0, best_score)

    def _read_gray(self, gray: np.ndarray) -> tuple[str, float]:
        try:
            data = self._ocr.image_to_data(
                gray,
                lang=self.lang,
                config="--psm 7",
                output_type=self._ocr.Output.DICT,
            )
        except self._ocr.TesseractError:
            if self.lang == "eng":
                raise
            data = self._ocr.image_to_data(
                gray,
                lang="eng",
                config="--psm 7",
                output_type=self._ocr.Output.DICT,
            )
        words: list[str] = []
        confidences: list[float] = []
        for raw_text, raw_conf in zip(data["text"], data["conf"]):
            try:
                confidence = float(raw_conf)
            except (TypeError, ValueError):
                continue
            token = clean_text(str(raw_text))
            if confidence < 0 or len(alnum_key(token)) < 2:
                continue
            words.append(token)
            confidences.append(confidence / 100.0)
        if not words:
            return "", 0.0
        return clean_text(" ".join(words)), float(np.mean(confidences))


def _stroke_mask(frame_bgr: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    gradient = cv2.morphologyEx(
        gray,
        cv2.MORPH_GRADIENT,
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)),
    )
    _, edges = cv2.threshold(gradient, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    horizontal = cv2.morphologyEx(
        edges,
        cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (45, 1)),
    )
    vertical = cv2.morphologyEx(
        edges,
        cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (1, 45)),
    )
    strokes = cv2.subtract(edges, cv2.max(horizontal, vertical))
    return cv2.morphologyEx(
        strokes,
        cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2)),
    )


def _warp(frame_bgr: np.ndarray, quad: np.ndarray) -> np.ndarray:
    points = order_quad(quad)
    width = int(round(max(np.linalg.norm(points[1] - points[0]), np.linalg.norm(points[2] - points[3]))))
    height = int(round(max(np.linalg.norm(points[3] - points[0]), np.linalg.norm(points[2] - points[1]))))
    width = max(width, 1)
    height = max(height, 1)
    destination = np.array(
        [[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]],
        dtype=np.float32,
    )
    matrix = cv2.getPerspectiveTransform(points, destination)
    return cv2.warpPerspective(
        frame_bgr,
        matrix,
        (width, height),
        flags=cv2.INTER_CUBIC,
        borderValue=(255, 255, 255),
    )


def _suppress_and_group(frame_bgr: np.ndarray, hits: list[Hit], reader: OpenCVTesseractDetector) -> list[Hit]:
    kept: list[Hit] = []
    for hit in sorted(hits, key=lambda item: quad_area(item.quad), reverse=True):
        if any(coverage_of(hit.quad, earlier.quad) > 0.6 for earlier in kept):
            continue
        kept.append(hit)
    return _group_lines(frame_bgr, kept, reader)


def coverage_of(inner, outer) -> float:
    area = quad_area(inner)
    if area <= 0:
        return 0.0
    inter, _ = cv2.intersectConvexConvex(
        np.asarray(order_quad(inner), dtype=np.float32),
        np.asarray(order_quad(outer), dtype=np.float32),
    )
    return float(max(0.0, inter)) / area


def _group_lines(frame_bgr: np.ndarray, hits: list[Hit], reader: OpenCVTesseractDetector) -> list[Hit]:
    unused = set(range(len(hits)))
    grouped: list[Hit] = []
    while unused:
        seed = min(unused, key=lambda index: order_quad(hits[index].quad)[0][0])
        unused.remove(seed)
        cluster = [seed]
        changed = True
        while changed:
            changed = False
            for index in list(unused):
                if any(_same_line(hits[index], hits[other]) for other in cluster):
                    cluster.append(index)
                    unused.remove(index)
                    changed = True
        members = [hits[index] for index in cluster]
        if len(members) == 1:
            grouped.append(members[0])
            continue
        points = np.vstack([order_quad(member.quad) for member in members])
        rect = cv2.minAreaRect(points.astype(np.float32))
        quad = clip_quad_to_frame(scale_about_center(order_quad(cv2.boxPoints(rect)), 1.04), frame_bgr.shape[1], frame_bgr.shape[0])
        if quad is None:
            grouped.extend(members)
            continue
        text, confidence = reader._read_quad(frame_bgr, quad)
        if len(alnum_key(text)) < 2:
            members.sort(key=lambda item: order_quad(item.quad)[:, 0].mean())
            text = clean_text(" ".join(member.text for member in members))
            confidence = float(np.mean([member.confidence for member in members]))
        grouped.append(
            Hit(
                quad=quad_to_list(quad),
                text=text,
                confidence=confidence,
                angle=quad_angle_deg(quad),
            )
        )
    return _suppress_overlaps(grouped)


def _same_line(a: Hit, b: Hit) -> bool:
    if abs(_angle_delta(a.angle, b.angle)) > 18:
        return False
    left = order_quad(a.quad)
    right = order_quad(b.quad)
    height = max(_short_side(left), _short_side(right), 1.0)
    center_a = left.mean(axis=0)
    center_b = right.mean(axis=0)
    direction = left[1] - left[0]
    norm = np.linalg.norm(direction) or 1.0
    direction = direction / norm
    normal = np.array([-direction[1], direction[0]])
    delta = center_b - center_a
    if abs(float(np.dot(delta, normal))) > 0.7 * height:
        return False
    along = abs(float(np.dot(delta, direction)))
    reach = _long_side(left) / 2 + _long_side(right) / 2
    gap = along - reach
    return gap < 1.4 * height


def _angle_delta(a: float, b: float) -> float:
    return (a - b + 180) % 360 - 180


def _long_side(quad: np.ndarray) -> float:
    return float(max(np.linalg.norm(quad[1] - quad[0]), np.linalg.norm(quad[2] - quad[1])))


def _short_side(quad: np.ndarray) -> float:
    return float(min(np.linalg.norm(quad[1] - quad[0]), np.linalg.norm(quad[2] - quad[1])))


def _suppress_overlaps(hits: list[Hit]) -> list[Hit]:
    kept: list[Hit] = []
    for hit in sorted(hits, key=lambda item: (len(alnum_key(item.text)), item.confidence), reverse=True):
        if any(quad_iou(hit.quad, earlier.quad) > 0.45 for earlier in kept):
            continue
        kept.append(hit)
    return kept


class EasyOCRDetector(TextDetector):
    def __init__(self, languages: list[str], gpu: bool, min_confidence: float) -> None:
        try:
            import easyocr
        except ImportError as exc:
            raise DetectorUnavailable(
                "EasyOCR is not installed. pip install -r requirements-ml.txt"
            ) from exc
        langs = [_easyocr_lang(lang) for lang in languages] or ["en"]
        self.reader = easyocr.Reader(langs, gpu=gpu)
        self.min_confidence = min_confidence

    def detect(self, frame_bgr: np.ndarray) -> list[Hit]:
        results = self.reader.readtext(frame_bgr)
        height, width = frame_bgr.shape[:2]
        return parse_easyocr(results, width, height, self.min_confidence)


class PaddleOCRDetector(TextDetector):
    def __init__(self, languages: list[str], device: str, min_confidence: float) -> None:
        try:
            from paddleocr import PaddleOCR
        except ImportError as exc:
            raise DetectorUnavailable(
                "PaddleOCR is not installed. See requirements-ml.txt for the wheel to install."
            ) from exc
        lang = _paddle_lang(languages[0] if languages else "en")
        self.ocr = PaddleOCR(use_angle_cls=True, lang=lang, use_gpu=device == "cuda", show_log=False)
        self.min_confidence = min_confidence

    def detect(self, frame_bgr: np.ndarray) -> list[Hit]:
        raw = self.ocr.ocr(frame_bgr, cls=True)
        height, width = frame_bgr.shape[:2]
        return parse_paddle(raw, width, height, self.min_confidence)


def parse_easyocr(results, width: int, height: int, min_confidence: float) -> list[Hit]:
    hits: list[Hit] = []
    for item in results or []:
        if len(item) < 3:
            continue
        box, text, confidence = item[0], clean_text(str(item[1])), float(item[2])
        if confidence < min_confidence or len(alnum_key(text)) < 2:
            continue
        clipped = clip_quad_to_frame(np.asarray(box, dtype=np.float32), width, height)
        if clipped is None or quad_area(clipped) > 0.4 * width * height:
            continue
        hits.append(Hit(quad_to_list(clipped), text, confidence, quad_angle_deg(clipped)))
    return hits


def parse_paddle(result, width: int, height: int, min_confidence: float) -> list[Hit]:
    hits: list[Hit] = []
    if not result:
        return hits
    lines = result
    if isinstance(result, list) and len(result) == 1 and isinstance(result[0], list):
        lines = result[0]
    if lines is None:
        return hits
    for item in lines:
        if not item or len(item) < 2:
            continue
        box, payload = item[0], item[1]
        if isinstance(payload, (list, tuple)) and len(payload) >= 2:
            text, confidence = clean_text(str(payload[0])), float(payload[1])
        else:
            continue
        if confidence < min_confidence or len(alnum_key(text)) < 2:
            continue
        clipped = clip_quad_to_frame(np.asarray(box, dtype=np.float32), width, height)
        if clipped is None or quad_area(clipped) > 0.4 * width * height:
            continue
        hits.append(Hit(quad_to_list(clipped), text, confidence, quad_angle_deg(clipped)))
    return hits


def _easyocr_lang(lang: str) -> str:
    return {"eng": "en", "fra": "fr", "deu": "de", "spa": "es"}.get(lang, lang)


def _paddle_lang(lang: str) -> str:
    return {"eng": "en", "en": "en", "fra": "fr", "deu": "german", "spa": "es"}.get(lang, lang)

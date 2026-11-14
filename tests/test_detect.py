import numpy as np

from textswap.geometry import coverage, quad_area
from textswap.pipeline.detect import OpenCVTesseractDetector, parse_easyocr, parse_paddle
from textswap.sample_media import font_path, render_frame
from PIL import ImageFont


def _frame_bgr(index: int = 0):
    title = ImageFont.truetype(str(font_path()), 78)
    banner = ImageFont.truetype(str(font_path()), 58)
    opened = ImageFont.truetype(str(font_path()), 42)
    image, quads = render_frame(index, 8, 960, 540, title, banner, opened)
    bgr = np.array(image.convert("RGB"))[:, :, ::-1].copy()
    return bgr, quads


def test_opencv_reads_sign_banner_and_open_sign():
    detector = OpenCVTesseractDetector(["en"], min_confidence=0.35)
    frame, quads = _frame_bgr(0)
    hits = detector.detect(frame)
    texts = {hit.text.upper().replace(" ", "") for hit in hits}
    assert "CAFE" in texts
    assert any("FRESH" in text and "BREAD" in text for text in texts)
    by_text = {hit.text.upper().replace(" ", ""): hit for hit in hits}
    cafe = by_text["CAFE"]
    assert coverage(quads["CAFE"], cafe.quad) > 0.55
    assert quad_area(cafe.quad) < quad_area(quads["CAFE"]) * 8
    fresh = next(hit for hit in hits if "FRESH" in hit.text.upper() and "BREAD" in hit.text.upper())
    assert coverage(quads["FRESH BREAD"], fresh.quad) > 0.5

    frame, quads = _frame_bgr(6)
    hits = detector.detect(frame)
    texts = {hit.text.upper().replace(" ", "") for hit in hits}
    assert "OPEN" in texts


def test_easyocr_parser_scales_quads_and_drops_weak_hits():
    results = [
        ([[10, 10], [80, 12], [78, 40], [12, 42]], "CAFE", 0.91),
        ([[0, 0], [4, 0], [4, 4], [0, 4]], "x", 0.99),
        ([[10, 80], [40, 80], [40, 100], [10, 100]], "nope", 0.1),
    ]
    hits = parse_easyocr(results, 200, 100, min_confidence=0.35)
    assert len(hits) == 1
    assert hits[0].text == "CAFE"
    assert hits[0].confidence == 0.91


def test_paddle_parser_accepts_nested_result_shape():
    result = [
        [
            [[[5, 5], [60, 5], [60, 30], [5, 30]], ("OPEN", 0.88)],
            None,
        ]
    ]
    hits = parse_paddle(result, 100, 80, min_confidence=0.35)
    assert [hit.text for hit in hits] == ["OPEN"]

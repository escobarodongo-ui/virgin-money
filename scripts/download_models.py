#!/usr/bin/env python3
"""Download optional detector weights.

OpenCV + Tesseract, the default backend, has no model files. EasyOCR downloads
its CRAFT detector and recognition models into the user cache the first time
it is constructed. PaddleOCR downloads its own inference models on first use.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from textswap.config import load_settings  # noqa: E402
from textswap.pipeline.detect import resolve_backend  # noqa: E402


def main() -> int:
    settings = load_settings()
    backend = resolve_backend(settings.models.detector)
    print(f"configured detector resolves to: {backend}")
    if backend == "opencv":
        print("No weights to download. Install the system package tesseract-ocr if you have not.")
        return 0
    if backend == "easyocr":
        try:
            import easyocr
        except ImportError:
            print("EasyOCR is not installed. Run: pip install -r requirements-ml.txt", file=sys.stderr)
            return 1
        langs = [{"eng": "en"}.get(lang, lang) for lang in settings.languages] or ["en"]
        gpu = settings.resolved_device() == "cuda"
        print(f"Downloading EasyOCR models for {langs} (gpu={gpu})…")
        easyocr.Reader(langs, gpu=gpu)
        print("EasyOCR models are ready.")
        return 0
    if backend == "paddleocr":
        try:
            from paddleocr import PaddleOCR
        except ImportError:
            print(
                "PaddleOCR is not installed. Install a matching paddlepaddle wheel, then paddleocr. "
                "See requirements-ml.txt.",
                file=sys.stderr,
            )
            return 1
        lang = {"en": "en", "eng": "en"}.get(settings.languages[0], settings.languages[0])
        print(f"Initializing PaddleOCR ({lang}); it will download inference models on first use.")
        PaddleOCR(use_angle_cls=True, lang=lang, use_gpu=settings.resolved_device() == "cuda", show_log=False)
        print("PaddleOCR models are ready.")
        return 0
    print(f"Nothing to download for detector {backend!r}.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

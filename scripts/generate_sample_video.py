#!/usr/bin/env python3
"""Write sample/cafe_window.mp4 and sample/ground_truth.json."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from textswap.sample_media import render_clip  # noqa: E402


def main() -> None:
    dest = ROOT / "sample" / "cafe_window.mp4"
    truth = render_clip(dest)
    payload = {key: value for key, value in truth.items() if key != "path"}
    (ROOT / "sample" / "ground_truth.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"wrote {dest}")


if __name__ == "__main__":
    main()

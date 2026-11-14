from __future__ import annotations

from pathlib import Path

import pytest

from textswap.config import load_settings
from textswap.sample_media import render_clip


@pytest.fixture()
def settings(tmp_path: Path):
    cfg = load_settings()
    return cfg.model_copy(
        deep=True,
        update={"storage_dir": tmp_path / "projects", "quality": "best", "chunk_frames": 8},
    )


@pytest.fixture()
def clip(tmp_path: Path):
    dest = tmp_path / "cafe.mp4"
    truth = render_clip(dest, frames=8, fps=8, size=(960, 540))
    return truth

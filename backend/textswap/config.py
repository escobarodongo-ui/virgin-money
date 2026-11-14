"""Load the single TextSwap config file."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, Field, model_validator


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


class Preset(BaseModel):
    sample_stride: int = 4
    detect_max_width: int = 1280
    proxy_max_width: int = 1280
    proxy_crf: int = 22


class JobSettings(BaseModel):
    backend: Literal["thread", "rq"] = "thread"


class ModelSettings(BaseModel):
    detector: str = "auto"
    tracker: str = "none"
    inpainter: str = "none"
    renderer: str = "classic"
    ai_editor: str = "none"


class Settings(BaseModel):
    device: Literal["auto", "cpu", "cuda"] = "auto"
    quality: Literal["fast", "balanced", "best"] = "balanced"
    chunk_frames: int = 48
    max_edge: int = 3840
    storage_dir: Path = Path("data/projects")
    languages: list[str] = Field(default_factory=lambda: ["en"])
    jobs: JobSettings = Field(default_factory=JobSettings)
    models: ModelSettings = Field(default_factory=ModelSettings)
    presets: dict[str, Preset] = Field(
        default_factory=lambda: {
            "fast": Preset(sample_stride=8, detect_max_width=960, proxy_max_width=960, proxy_crf=28),
            "balanced": Preset(),
            "best": Preset(sample_stride=1, detect_max_width=1920, proxy_max_width=1600, proxy_crf=18),
        }
    )
    min_confidence: float = 0.35

    @model_validator(mode="after")
    def resolve_storage(self):
        if not self.storage_dir.is_absolute():
            self.storage_dir = (repo_root() / self.storage_dir).resolve()
        return self

    def preset(self) -> Preset:
        try:
            return self.presets[self.quality]
        except KeyError as exc:
            raise ValueError(f"unknown quality preset {self.quality!r}") from exc

    def resolved_device(self) -> str:
        if self.device != "auto":
            return self.device
        try:
            import torch
        except ImportError:
            return "cpu"
        return "cuda" if torch.cuda.is_available() else "cpu"


def load_settings(path: Path | None = None) -> Settings:
    if path is None:
        env = os.environ.get("TEXTSWAP_CONFIG")
        path = Path(env) if env else repo_root() / "config.yaml"
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    settings = Settings.model_validate(data)
    override = os.environ.get("TEXTSWAP_STORAGE")
    if override:
        settings.storage_dir = Path(override).resolve()
    return settings

"""Uvicorn entrypoint: `uvicorn textswap.main:app --app-dir backend`."""

from __future__ import annotations

from textswap.api import create_app
from textswap.config import load_settings

app = create_app(load_settings())

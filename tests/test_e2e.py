"""End-to-end phase 1: ingest a clip, detect text, and serve regions over HTTP."""

from __future__ import annotations

import time
from pathlib import Path

from fastapi.testclient import TestClient

from textswap.api import create_app
from textswap.ffmpeg import JobContext
from textswap.geometry import coverage
from textswap.pipeline.run import run_project_pipeline
from textswap.pipeline.ingest import write_json


def test_pipeline_finds_sample_text_and_skips_cached_chunks(settings, clip, tmp_path):
    project = tmp_path / "proj"
    project.mkdir()
    source = project / "source.mp4"
    Path(clip["path"]).replace(source)
    write_json(
        project / "meta.json",
        {"id": "proj", "filename": "cafe.mp4", "source": "source.mp4", "status": "processing", "warnings": []},
    )
    ctx = JobContext()
    calls = {"n": 0}

    class Counting:
        def __init__(self):
            from textswap.pipeline.detect import OpenCVTesseractDetector

            self.inner = OpenCVTesseractDetector(["en"], 0.35)

        def detect(self, frame):
            calls["n"] += 1
            return self.inner.detect(frame)

    def progress(*_args):
        return None

    run_project_pipeline(project, settings, ctx, progress, detector=Counting())
    first_calls = calls["n"]
    assert first_calls == 8  # best preset samples every frame

    regions = __import__("json").loads((project / "regions.json").read_text())
    found = {region["text"].upper().replace(" ", "") for region in regions["regions"]}
    assert "CAFE" in found
    assert any("FRESH" in text and "BREAD" in text for text in found)

    cafe = next(region for region in regions["regions"] if region["text"].upper().replace(" ", "") == "CAFE")
    gt = next(item for item in clip["regions"] if item["text"] == "CAFE")
    sample = gt["frames"][0]["quad"]
    detected = cafe["frames"][0]["quad"]
    assert coverage(sample, detected) > 0.5

    audio = list((project / "audio").iterdir())
    assert audio and audio[0].stat().st_size > 0
    assert (project / "proxy.mp4").exists()

    calls["n"] = 0
    run_project_pipeline(project, settings, JobContext(), progress, detector=Counting())
    assert calls["n"] == 0


def test_api_upload_cancel_and_sample_flow(settings, clip):
    app = create_app(settings)
    with TestClient(app) as client:
        bad = client.post("/api/projects", files={"file": ("notes.txt", b"hello", "text/plain")})
        assert bad.status_code == 400

        with open(clip["path"], "rb") as handle:
            created = client.post("/api/projects", files={"file": ("cafe.mp4", handle, "video/mp4")})
        assert created.status_code == 200
        body = created.json()
        job_id = body["job"]["id"]
        project_id = body["project"]["id"]

        # Cancel quickly, then resume to completion. A clip this short may finish
        # before cancel lands; either terminal state is acceptable before resume.
        client.post(f"/api/jobs/{job_id}/cancel")
        deadline = time.time() + 90
        status = "running"
        while time.time() < deadline:
            status = client.get(f"/api/jobs/{job_id}").json()["status"]
            if status in {"completed", "failed", "cancelled"}:
                break
            time.sleep(0.2)
        assert status in {"completed", "failed", "cancelled"}

        resumed = client.post(f"/api/projects/{project_id}/process", json={"quality": "best"})
        assert resumed.status_code == 200
        resume_id = resumed.json()["id"]
        while time.time() < deadline:
            payload = client.get(f"/api/jobs/{resume_id}").json()
            if payload["status"] in {"completed", "failed", "cancelled"}:
                break
            time.sleep(0.3)
        assert payload["status"] == "completed", payload

        project = client.get(f"/api/projects/{project_id}").json()
        assert project["proxy_ready"] is True
        assert project["audio_present"] is True
        media = client.get(f"/api/projects/{project_id}/media/proxy")
        assert media.status_code == 200
        assert media.content[:8] != b""

        regions = client.get(f"/api/projects/{project_id}/regions").json()
        texts = {region["text"].upper().replace(" ", "") for region in regions["regions"]}
        assert "CAFE" in texts
        assert any("FRESH" in text for text in texts)

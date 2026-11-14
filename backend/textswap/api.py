"""HTTP API for upload, playback, detection jobs, and region queries."""

from __future__ import annotations

import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from textswap.config import Settings, repo_root
from textswap.pipeline.ingest import load_json, write_json

ID_RE = re.compile(r"^[a-f0-9]{12}$")
ALLOWED = {".mp4", ".mov", ".webm", ".mkv"}
SAMPLE_NAME = "cafe_window.mp4"


class ProcessRequest(BaseModel):
    quality: str | None = None


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def create_app(settings: Settings) -> FastAPI:
    from textswap.jobs import JobManager

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        yield
        app.state.jobs.shutdown()

    app = FastAPI(title="TextSwap", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.settings = settings
    app.state.jobs = JobManager(settings)
    router = APIRouter(prefix="/api")

    @router.get("/health")
    def health():
        return {
            "ok": True,
            "device": settings.resolved_device(),
            "detector": settings.models.detector,
            "quality": settings.quality,
        }

    @router.post("/projects")
    async def create_project(request: Request, file: UploadFile = File(...)):
        return await _store_upload(request.app.state, file)

    @router.post("/sample")
    def open_sample(request: Request):
        sample = repo_root() / "sample" / SAMPLE_NAME
        if not sample.exists():
            raise HTTPException(
                status_code=404,
                detail="Sample clip is missing. Run python scripts/generate_sample_video.py",
            )
        return _accept_video(request.app.state, sample, SAMPLE_NAME)

    @router.get("/projects/{project_id}")
    def get_project(request: Request, project_id: str):
        directory = _project_dir(request.app.state.settings, project_id)
        return _project_payload(directory)

    @router.get("/projects/{project_id}/regions")
    def get_regions(request: Request, project_id: str):
        directory = _project_dir(request.app.state.settings, project_id)
        path = directory / "regions.json"
        if not path.exists():
            return {"regions": [], "warnings": []}
        return load_json(path)

    @router.get("/projects/{project_id}/media/{which}")
    def media(request: Request, project_id: str, which: str):
        directory = _project_dir(request.app.state.settings, project_id)
        meta = load_json(directory / "meta.json")
        if which == "proxy":
            path = directory / "proxy.mp4"
            media_type = "video/mp4"
        elif which == "source":
            path = directory / meta["source"]
            media_type = "application/octet-stream"
        else:
            raise HTTPException(status_code=404, detail="Unknown media")
        if not path.exists():
            raise HTTPException(status_code=404, detail="Media is not ready yet")
        return FileResponse(path, media_type=media_type, filename=path.name)

    @router.post("/projects/{project_id}/process")
    def process(request: Request, project_id: str, body: ProcessRequest | None = None):
        state = request.app.state
        directory = _project_dir(state.settings, project_id)
        runtime = state.settings
        if body and body.quality:
            if body.quality not in state.settings.presets:
                raise HTTPException(status_code=400, detail="Unknown quality preset")
            runtime = state.settings.model_copy(deep=True, update={"quality": body.quality})
        job = state.jobs.submit(directory, project_id, runtime)
        return job.to_dict()

    @router.get("/jobs/{job_id}")
    def get_job(request: Request, job_id: str):
        if not ID_RE.match(job_id):
            raise HTTPException(status_code=404, detail="Unknown job")
        job = request.app.state.jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Unknown job")
        return job.to_dict()

    @router.post("/jobs/{job_id}/cancel")
    def cancel_job(request: Request, job_id: str):
        job = request.app.state.jobs.cancel(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Unknown job")
        return job.to_dict()

    app.include_router(router)
    _mount_frontend(app)
    return app


def _mount_frontend(app: FastAPI) -> None:
    dist = repo_root() / "frontend" / "dist"
    if not dist.exists():
        return
    from fastapi.staticfiles import StaticFiles

    assets = dist / "assets"
    if assets.exists():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/{path:path}")
    def spa(path: str):
        if path == "api" or path.startswith("api/"):
            raise HTTPException(status_code=404)
        candidate = (dist / path).resolve()
        if path and candidate.is_file() and dist.resolve() in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(dist / "index.html")


async def _store_upload(state, file: UploadFile) -> dict:
    filename = Path(file.filename or "video.mp4").name
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED:
        raise HTTPException(status_code=400, detail="Upload an mp4, mov, webm, or mkv file.")
    project_id = uuid4().hex[:12]
    directory = state.settings.storage_dir / project_id
    directory.mkdir(parents=True, exist_ok=False)
    source_name = f"source{ext}"
    target = directory / source_name
    try:
        with target.open("wb") as handle:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                handle.write(chunk)
    except Exception:
        shutil.rmtree(directory, ignore_errors=True)
        raise
    if target.stat().st_size == 0:
        shutil.rmtree(directory, ignore_errors=True)
        raise HTTPException(status_code=400, detail="That file was empty.")
    return _accept_existing(state, directory, project_id, source_name, filename)


def _accept_video(state, source: Path, filename: str) -> dict:
    project_id = uuid4().hex[:12]
    directory = state.settings.storage_dir / project_id
    directory.mkdir(parents=True, exist_ok=False)
    source_name = f"source{source.suffix.lower()}"
    shutil.copyfile(source, directory / source_name)
    return _accept_existing(state, directory, project_id, source_name, filename)


def _accept_existing(state, directory: Path, project_id: str, source_name: str, filename: str) -> dict:
    write_json(
        directory / "meta.json",
        {
            "id": project_id,
            "filename": filename,
            "created_at": utc_now(),
            "source": source_name,
            "status": "processing",
            "warnings": [],
        },
    )
    job = state.jobs.submit(directory, project_id)
    return {"project": _project_payload(directory), "job": job.to_dict()}


def _project_dir(settings: Settings, project_id: str) -> Path:
    if not ID_RE.match(project_id):
        raise HTTPException(status_code=404, detail="Unknown project")
    directory = (settings.storage_dir / project_id).resolve()
    root = settings.storage_dir.resolve()
    if root != directory and root not in directory.parents:
        raise HTTPException(status_code=404, detail="Unknown project")
    if not directory.exists():
        raise HTTPException(status_code=404, detail="Unknown project")
    return directory


def _project_payload(directory: Path) -> dict:
    meta = load_json(directory / "meta.json")
    proxy_ready = (directory / "proxy.mp4").exists()
    audio = meta.get("audio_track") or {}
    return {
        "id": meta["id"],
        "filename": meta.get("filename"),
        "created_at": meta.get("created_at"),
        "status": meta.get("status", "processing"),
        "width": meta.get("width"),
        "height": meta.get("height"),
        "fps": meta.get("fps"),
        "frame_count": meta.get("frame_count"),
        "duration": meta.get("duration"),
        "video_codec": meta.get("video_codec"),
        "audio_present": bool(audio.get("present")),
        "audio_copied": bool(audio.get("copied")),
        "proxy_ready": proxy_ready,
        "proxy_width": (meta.get("proxy") or {}).get("width"),
        "proxy_height": (meta.get("proxy") or {}).get("height"),
        "region_count": meta.get("region_count", 0),
        "warnings": meta.get("warnings") or [],
    }

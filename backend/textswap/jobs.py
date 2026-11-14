"""In-process job runner.

Phase 1 keeps the queue inside the API process so detection, cancel, and resume
work without Redis. `jobs.backend: rq` is reserved and rejected with a clear
error until a worker fleet is needed.
"""

from __future__ import annotations

import threading
import traceback
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from textswap.config import Settings
from textswap.ffmpeg import JobContext, PipelineCancelled
from textswap.pipeline.ingest import load_json, write_json
from textswap.pipeline.run import run_project_pipeline


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


class Job:
    def __init__(self, job_id: str, project_id: str) -> None:
        self.id = job_id
        self.project_id = project_id
        self.status = "queued"
        self.stage = "probe"
        self.progress = 0.0
        self.message = "Queued"
        self.error: str | None = None
        self.stages: list[dict] = []
        self.created_at = utc_now()
        self.updated_at = self.created_at
        self._lock = threading.Lock()

    def update(self, **fields) -> None:
        with self._lock:
            for key, value in fields.items():
                setattr(self, key, value)
            self.updated_at = utc_now()

    def to_dict(self) -> dict:
        with self._lock:
            return {
                "id": self.id,
                "project_id": self.project_id,
                "status": self.status,
                "stage": self.stage,
                "progress": self.progress,
                "message": self.message,
                "error": self.error,
                "stages": self.stages,
                "created_at": self.created_at,
                "updated_at": self.updated_at,
            }


class JobManager:
    def __init__(self, settings: Settings) -> None:
        if settings.jobs.backend != "thread":
            raise RuntimeError(
                "jobs.backend is set to 'rq', which is not wired in phase 1. "
                "Use jobs.backend: thread, or ask before switching the queue."
            )
        self.settings = settings
        self.jobs: dict[str, Job] = {}
        self._contexts: dict[str, JobContext] = {}
        self._threads: dict[str, threading.Thread] = {}
        self._project_job: dict[str, str] = {}
        self._lock = threading.Lock()

    def submit(self, project_dir: Path, project_id: str, settings: Settings | None = None) -> Job:
        settings = settings or self.settings
        with self._lock:
            current_id = self._project_job.get(project_id)
            if current_id:
                current = self.jobs.get(current_id)
                if current and current.status in {"queued", "running"}:
                    return current
            job = Job(uuid4().hex[:12], project_id)
            ctx = JobContext()
            self.jobs[job.id] = job
            self._contexts[job.id] = ctx
            self._project_job[project_id] = job.id
        self._persist(project_dir, job)

        def target() -> None:
            try:
                job.update(status="running", message="Starting")

                def on_progress(stage, overall, message, stages, _error):
                    job.update(stage=stage, progress=overall, message=message, stages=stages, status="running")
                    self._persist(project_dir, job)

                run_project_pipeline(project_dir, settings, ctx, on_progress)
                if ctx.cancelled():
                    job.update(status="cancelled", message="Cancelled")
                else:
                    job.update(status="completed", progress=1.0, message="Ready")
            except PipelineCancelled:
                job.update(status="cancelled", message="Cancelled")
            except Exception as exc:  # noqa: BLE001 - surface pipeline failures to the job record
                job.update(status="failed", error=str(exc), message="Failed")
                traceback.print_exc()
            finally:
                self._persist(project_dir, job)

        thread = threading.Thread(target=target, name=f"textswap-{job.id}", daemon=False)
        with self._lock:
            self._threads[job.id] = thread
        thread.start()
        return job

    def cancel(self, job_id: str) -> Job | None:
        job = self.get(job_id)
        ctx = self._contexts.get(job_id)
        if ctx:
            ctx.cancel()
        if job and job.status in {"queued", "running"}:
            job.update(status="cancelled", message="Cancelled")
            project_dir = self.settings.storage_dir / job.project_id
            if project_dir.exists():
                self._persist(project_dir, job)
        return job

    def get(self, job_id: str) -> Job | None:
        job = self.jobs.get(job_id)
        if job:
            return job
        root = self.settings.storage_dir
        if not root.exists():
            return None
        for path in root.glob("*/job.json"):
            data = load_json(path)
            if data.get("id") == job_id:
                restored = Job(data["id"], data["project_id"])
                restored.status = data.get("status", "failed")
                restored.stage = data.get("stage", "")
                restored.progress = data.get("progress", 0)
                restored.message = data.get("message", "")
                restored.error = data.get("error")
                restored.stages = data.get("stages") or []
                restored.created_at = data.get("created_at", restored.created_at)
                restored.updated_at = data.get("updated_at", restored.updated_at)
                return restored
        return None

    def wait(self, job_id: str, timeout: float = 120) -> Job | None:
        thread = self._threads.get(job_id)
        if thread:
            thread.join(timeout)
        return self.get(job_id)

    def shutdown(self) -> None:
        for ctx in list(self._contexts.values()):
            ctx.cancel()
        for thread in list(self._threads.values()):
            thread.join(timeout=2)

    def _persist(self, project_dir: Path, job: Job) -> None:
        if project_dir.exists():
            write_json(project_dir / "job.json", job.to_dict())

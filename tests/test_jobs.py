import threading
import time

from textswap.ffmpeg import JobContext, PipelineCancelled
from textswap.jobs import JobManager


def test_cancel_stops_a_running_job(settings):
    manager = JobManager(settings)
    project = settings.storage_dir / "abcdefabcdef"
    project.mkdir(parents=True)
    started = threading.Event()

    def slow(project_dir, cfg, ctx, progress_cb):
        started.set()
        progress_cb("detect", 0.2, "working", [], None)
        for _ in range(40):
            ctx.check()
            time.sleep(0.05)

    import textswap.jobs as jobs_mod

    original = jobs_mod.run_project_pipeline
    jobs_mod.run_project_pipeline = slow
    try:
        job = manager.submit(project, "abcdefabcdef")
        assert started.wait(2)
        manager.cancel(job.id)
        finished = manager.wait(job.id, timeout=3)
        assert finished is not None
        assert finished.status == "cancelled"
    finally:
        jobs_mod.run_project_pipeline = original
        manager.shutdown()


def test_context_check_raises_when_cancelled():
    ctx = JobContext()
    ctx.cancel()
    try:
        ctx.check()
    except PipelineCancelled:
        return
    raise AssertionError("expected PipelineCancelled")

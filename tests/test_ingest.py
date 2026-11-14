from pathlib import Path

from textswap.ffmpeg import JobContext
from textswap.pipeline.ingest import build_proxy, extract_audio, probe_media


def test_probe_reports_size_fps_and_audio(clip):
    meta = probe_media(Path(clip["path"]))
    assert meta["width"] == 960
    assert meta["height"] == 540
    assert meta["frame_count"] == 8
    assert abs(meta["fps"] - 8) < 0.01
    assert meta["audio"]["codec"] == "aac"
    assert abs(meta["duration"] - 1.0) < 0.15


def test_audio_is_stream_copied_and_proxy_keeps_picture(clip, tmp_path):
    source = Path(clip["path"])
    meta = probe_media(source)
    project = tmp_path / "proj"
    project.mkdir()
    ctx = JobContext()
    audio = extract_audio(source, project, meta, ctx)
    assert audio["present"] is True
    assert audio["copied"] is True
    assert (project / audio["path"]).stat().st_size > 0
    # A second call reuses the copied file.
    again = extract_audio(source, project, meta, ctx)
    assert again["path"] == audio["path"]

    proxy = build_proxy(source, project, meta, max_width=640, crf=28, ctx=ctx)
    probed = probe_media(project / "proxy.mp4")
    assert proxy["width"] <= 640
    assert abs(probed["width"] / probed["height"] - 960 / 540) < 0.02
    assert probed["audio"] is not None

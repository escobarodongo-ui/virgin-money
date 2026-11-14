import json

import cv2
import numpy as np
from PIL import Image, ImageFont

from textswap.pipeline.texttrack import load_track, pose_at, save_track, track_document
from textswap.pipeline.track_points import drift_against, track_quad
from textswap.sample_media import font_path, render_frame


def test_pose_at_reads_only_the_requested_frame(tmp_path):
    track = track_document(
        track_id="t1",
        original_text="FRESH",
        replacement_text="JAVA",
        poses=[
            _pose(0, 10, visible=True),
            _pose(1, 40, visible=False),
            _pose(2, 70, visible=True),
        ],
    )
    assert pose_at(track, 0)["quad"][0][0] == 10
    assert pose_at(track, 1) is None
    assert pose_at(track, 3) is None
    assert pose_at(track, 2)["quad"][0][0] == 70
    path = tmp_path / "tracks" / "t1.json"
    save_track(path, track)
    loaded = load_track(path)
    assert json.loads(path.read_text())["frames"][0]["mask"] is None
    assert pose_at(loaded, 2)["frame_index"] == 2


def test_tracked_quad_stays_on_the_moving_banner():
    frames, truth = _banner_clip()
    seed = truth[0]
    poses = track_quad(frames, seed, seed_index=0)
    assert len(poses) == len(frames)
    assert pose_at(track_document(track_id="t", original_text="FRESH BREAD", replacement_text="JAVA", poses=poses), 4) is not None
    drift = drift_against(poses, truth)
    assert drift < 1.5, drift


def _pose(index: int, x: float, visible: bool) -> dict:
    quad = [[x, 10], [x + 40, 10], [x + 40, 30], [x, 30]]
    return {
        "frame_index": index,
        "quad": quad,
        "homography": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        "visible": visible,
        "occluded": False,
        "confidence": 1,
        "mask": None,
    }


def _banner_clip():
    font = ImageFont.truetype(str(font_path()), 58)
    title = ImageFont.truetype(str(font_path()), 78)
    open_font = ImageFont.truetype(str(font_path()), 42)
    frames = []
    truth = {}
    for index in range(16):
        image, quads = render_frame(index, 16, 960, 540, title, font, open_font)
        bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        frames.append(bgr)
        truth[index] = quads["FRESH BREAD"]
    return frames, truth

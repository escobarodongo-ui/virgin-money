from textswap.pipeline.associate import associate, quad_at_frame


def _det(frame, x, text="CAFE", confidence=0.9):
    quad = [[x, 20], [x + 80, 22], [x + 78, 60], [x + 2, 58]]
    return {
        "frame_index": frame,
        "quad": quad,
        "text": text,
        "confidence": confidence,
        "angle": 1.0,
    }


def test_links_moving_text_and_interpolates_between_samples():
    detections = [_det(0, 10), _det(4, 30, text="Cafe"), _det(8, 50)]
    regions, warnings = associate(detections, stride=4, fps=8)
    assert len(regions) == 1
    region = regions[0]
    assert region["text"].upper() == "CAFE"
    assert region["start_frame"] == 0
    assert region["end_frame"] == 8
    assert warnings == []
    mid = quad_at_frame(region, 2)
    assert mid is not None
    # Halfway between x≈10 and x≈30, so the left edge sits near 20.
    assert 16 < mid[0][0] < 26
    assert quad_at_frame(region, 9) is None


def test_single_weak_reads_are_dropped_and_a_confident_one_is_kept():
    detections = [
        _det(0, 10, text="ys", confidence=0.4),
        _det(3, 200, text="OPEN", confidence=0.91),
    ]
    regions, _warnings = associate(detections, stride=4, fps=8, frame_count=8)
    assert [region["text"] for region in regions] == ["OPEN"]
    assert regions[0]["end_frame"] == 7


def test_separate_phrases_stay_separate_and_gaps_are_flagged():
    detections = [
        _det(0, 10, text="CAFE"),
        _det(0, 400, text="OPEN"),
        _det(12, 20, text="CAFE"),
    ]
    regions, warnings = associate(detections, stride=4, fps=10)
    texts = sorted(region["text"] for region in regions)
    assert texts == ["CAFE", "OPEN"]
    assert any(item["code"] == "detection_gap" and item["start_frame"] == 0 for item in warnings)

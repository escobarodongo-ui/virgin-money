# TextSwap

TextSwap finds text that is already inside a video (signs, burned-in captions, shirts, screens) and draws a box you can scrub. Phase 1 covers ingest, detection, and review. Replacement rendering, optical-flow tracking, inpainting, and style matching are later phases and are not in this build.

## Layout

```
config.yaml                 model choices, device, chunk size, quality presets
backend/textswap/           FastAPI app and pipeline
  pipeline/ingest.py        ffprobe, untouched audio copy, H.264 preview proxy
  pipeline/detect.py        OpenCV + Tesseract, optional EasyOCR / PaddleOCR
  pipeline/associate.py     link boxes across frames for the player
  pipeline/run.py           chunked, cached, cancellable pipeline
  jobs.py                   in-process job runner (cancel / resume)
frontend/                   React + TypeScript + Tailwind player
sample/                     generated storefront clip and ground-truth quads
scripts/generate_sample_video.py
scripts/download_models.py
tests/                      unit tests per stage plus an API end-to-end test
```

## Dependencies

System:

- Python 3.12
- FFmpeg (decode, preview encode, untouched audio copy)
- Tesseract OCR (`tesseract-ocr`) for the default detector

Python (`requirements.txt`):

- fastapi, uvicorn, python-multipart, pydantic, PyYAML
- opencv-python-headless, numpy, pillow, pytesseract

Dev (`requirements-dev.txt`): pytest, httpx.

Optional detectors (`requirements-ml.txt`): EasyOCR (pulls in PyTorch). PaddleOCR is wired but not installed by default; pin a Paddle wheel that matches your machine before installing it.

Frontend: React 19, TypeScript, Vite, Tailwind 4.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt

# Debian/Ubuntu
sudo apt install ffmpeg tesseract-ocr

python scripts/generate_sample_video.py
python scripts/download_models.py   # no-op for the default OpenCV detector

# API
uvicorn textswap.main:app --app-dir backend --reload --port 8000

# Player, in another shell
cd frontend && npm install && npm run dev
```

Open http://127.0.0.1:5173 and choose **Load sample**, or drop an mp4, mov, webm, or mkv. The preview plays as soon as the proxy exists. Boxes appear when detection finishes. Click a box to read the recognized text. Arrow keys step a frame. Cancel keeps finished chunks on disk; Resume continues from them.

`config.yaml` selects the device, quality preset, and models:

| Preset | Sample stride | Detect width | Proxy |
| --- | --- | --- | --- |
| fast | every 8th frame | 960 | CRF 28 |
| balanced (default) | every 4th frame | 1280 | CRF 22 |
| best | every frame | 1920 | CRF 18 |

`models.detector: auto` uses EasyOCR when that package imports, otherwise OpenCV + Tesseract. Set it to `easyocr` or `paddleocr` after installing those weights. Long videos are decoded once and detections are written in `chunk_frames` batches under the project folder (`data/projects/<id>`), so a re-run does not repeat finished chunks.

## Docker

```bash
docker compose up --build
```

The image is CPU-only. `docker build --build-arg INSTALL_ML=1` adds EasyOCR. A GPU container needs a CUDA base image and a matching PyTorch wheel; set `device: cuda` in `config.yaml` after that. See the Dockerfile header.

## Tests

```bash
.venv/bin/pytest
```

- `test_ingest.py` probes the sample, copies audio without re-encoding, and builds a proxy.
- `test_detect.py` checks the OpenCV reader against painted text, plus the EasyOCR and Paddle result parsers.
- `test_associate.py` links a moving phrase and flags gaps.
- `test_jobs.py` cancels a running job.
- `test_e2e.py` runs the pipeline, checks the detection cache, and drives upload, cancel, and resume through the API.

## Phase 1 decisions

These are the choices this phase shipped with. Say if you want them changed before phase 2.

1. **Jobs run in-process** (`jobs.backend: thread`) with persisted status, cancel, and resume. RQ + Redis is named in the config and rejected with an error if selected. A worker fleet is unnecessary while each job is one local video.
2. **Default detector is OpenCV stroke grouping + Tesseract**, which runs on CPU with no weight download. EasyOCR (CRAFT) and PaddleOCR (DBNet) are real backends behind `models.detector`, used when installed. Curved text is weak on the OpenCV path; switch to EasyOCR for that.
3. **Cross-frame boxes are linked by overlap and text**, then blended in a straight line for the player. That is not optical flow. RAFT / CoTracker / SAM 2 belong to phase 3. Gaps wider than the sample stride are reported as frame ranges that will need a manual keyframe once tracking exists.
4. **Quads are the box format** from the start (rotated rectangles, perspective warp at OCR time) so later stages can reuse them.
5. The previous unrelated UI in this repository was replaced by TextSwap.

## What phase 1 does not do

No text removal, no new text rendered back into the frames, no font or color matching, no manual quad editing, no export of an edited master. Audio for the final export is already stored as a stream copy so a later encode can mux it back without resampling.

## Roadmap

1. **Ingest, detect, show boxes** — this phase.
2. Static replacement on a single frame.
3. Tracking (optical flow or a point tracker) and manual keyframes.
4. Video inpainting, with per-frame LaMa as the simple fallback.
5. Style matching: font, color, shadow, blur, grain.
6. Player polish, before/after slider, and export that keeps resolution, frame rate, and the original audio.

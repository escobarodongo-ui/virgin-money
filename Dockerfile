# TextSwap API plus the built player.
#
# CPU (default):
#   docker build -t textswap .
#   docker run --rm -p 8000:8000 -v textswap-data:/app/data textswap
#
# Optional EasyOCR weights (large; CPU torch):
#   docker build --build-arg INSTALL_ML=1 -t textswap:ml .
#
# GPU: start from a CUDA image that already has Python 3.12, install a CUDA
# torch wheel before requirements-ml.txt, and set device: cuda in config.yaml.
# The default image is CPU-only so it builds without an NVIDIA runtime.

FROM node:22-bookworm-slim AS ui
WORKDIR /ui
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
        tesseract-ocr \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt requirements-ml.txt ./
RUN pip install --no-cache-dir -r requirements.txt
ARG INSTALL_ML=0
RUN if [ "$INSTALL_ML" = "1" ]; then pip install --no-cache-dir -r requirements-ml.txt; fi

COPY backend ./backend
COPY config.yaml ./config.yaml
COPY scripts ./scripts
COPY sample ./sample
COPY --from=ui /ui/dist ./frontend/dist

ENV PYTHONPATH=/app/backend
EXPOSE 8000
CMD ["uvicorn", "textswap.main:app", "--host", "0.0.0.0", "--port", "8000"]

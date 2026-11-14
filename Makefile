.PHONY: api web test sample models

api:
	.venv/bin/uvicorn textswap.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload

web:
	cd frontend && npm run dev

test:
	.venv/bin/pytest

sample:
	.venv/bin/python scripts/generate_sample_video.py

models:
	.venv/bin/python scripts/download_models.py

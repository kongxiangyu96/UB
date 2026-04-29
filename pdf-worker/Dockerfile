# MinerU requires extra system deps and model downloads
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download MinerU models into the image layer for faster startup
# Models are cached to /root/.cache/mineru; mount as volume in compose to persist across rebuilds
RUN python -c "from magic_pdf.model.doc_analyze_by_custom_model import doc_analyze" || true

COPY . .

CMD ["python", "-m", "arq", "worker.WorkerSettings"]

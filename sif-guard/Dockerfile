# Multi-purpose Production Dockerfile for SIF-Guard Backend on Render / Cloud
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered terminal logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=10000 \
    HF_HOME=/tmp/huggingface

WORKDIR /app

# Install system runtime dependencies:
# - build-essential, git, libpq-dev: native compilation & database drivers
# - tesseract-ocr, tesseract-ocr-eng: OCR engine for images and scans
# - poppler-utils: pdftoppm for pdf2image conversion
# - libgomp1: OpenMP support for XGBoost and CatBoost
# - curl: container healthcheck probing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    git \
    curl \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install lightweight CPU-only PyTorch (drastically reduces image size & build time)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Copy dependency specifications first for optimal Docker layer caching
COPY pyproject.toml .

# Install project dependencies
RUN pip install --no-cache-dir .

# Copy application source code, models, and static assets
COPY . .

# Expose port (Render automatically maps $PORT, default 10000)
EXPOSE 10000

# Health check to ensure API is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/api/v1/health || exit 1

# Start Uvicorn bound to 0.0.0.0 and dynamic $PORT provided by Render
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]

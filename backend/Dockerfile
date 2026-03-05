# ── Stage 1: install dependencies into an isolated prefix ────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Only copy requirements first so Docker layer cache is used when code changes
COPY requirements.txt .

# Install everything except pyinstaller (build tool, not needed at runtime)
# into /install so the runtime stage can COPY just that prefix
RUN pip install --no-cache-dir --prefix=/install \
    $(grep -v '^pyinstaller' requirements.txt | grep -v '^#' | grep -v '^$')

# ── Stage 2: lean runtime image ───────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Bring in only the installed packages, not the build tools
COPY --from=builder /install /usr/local

COPY . .

# Default: production server (no --reload)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

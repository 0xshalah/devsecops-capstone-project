# syntax=docker/dockerfile:1.7
# Build context: repository root (needs backend/ and database/).

# ---------- Stage 1: build wheels ----------
FROM python:3.11-slim AS builder
ENV PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.prod.txt .
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install -r requirements.prod.txt

# ---------- Stage 2: minimal runtime ----------
FROM python:3.11-slim AS runtime
LABEL org.opencontainers.image.title="tollgate-backend" \
      org.opencontainers.image.description="Tollgate AI Security Gateway API (FastAPI)" \
      org.opencontainers.image.source="https://github.com/0xshalah/devsecops-capstone-project"
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=8001
RUN groupadd --system --gid 10001 app \
    && useradd --system --uid 10001 --gid app --home-dir /srv --shell /usr/sbin/nologin app \
    && apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
COPY --from=builder /opt/venv /opt/venv
WORKDIR /srv
COPY --chown=app:app database/ ./database/
COPY --chown=app:app backend/ ./backend/
RUN rm -rf ./backend/tests ./backend/.env
WORKDIR /srv/backend
USER 10001:10001
EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8001/api/health/live', timeout=3).status == 200 else 1)"
CMD ["sh", "-c", "exec uvicorn server:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*' --no-server-header"]

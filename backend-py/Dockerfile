# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────
#  Stage 1 — Build wheels
# ─────────────────────────────────────────────
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/base.txt requirements/base.txt
RUN pip wheel --wheel-dir /wheels -r requirements/base.txt


# ─────────────────────────────────────────────
#  Stage 2 — Runtime image
# ─────────────────────────────────────────────
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 libmagic1 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app && useradd --system --gid app --create-home app

WORKDIR /app

COPY --from=builder /wheels /wheels
COPY requirements/base.txt requirements/base.txt
RUN pip install --no-index --find-links=/wheels -r requirements/base.txt \
    && rm -rf /wheels

# Copy the codebase last so dependency layers are reused across rebuilds.
COPY --chown=app:app . .

RUN mkdir -p /app/uploads \
    && chown -R app:app /app/uploads \
    && chmod +x docker/entrypoint.sh

USER app

EXPOSE 8000

# Reports the container as healthy only when /api/health responds 200.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["python", "docker/healthcheck.py"]

ENTRYPOINT ["./docker/entrypoint.sh"]

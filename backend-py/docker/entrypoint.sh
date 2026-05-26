#!/bin/sh
# Production entrypoint.
#
# Runs Alembic migrations before starting Gunicorn so the schema is always
# up to date on deploy. Fails fast (set -e) — if migrations don't apply
# cleanly, the container exits and the orchestrator does NOT mark it
# healthy, so the rollout halts before serving requests.

set -e

echo "[entrypoint] Applying database migrations..."
alembic upgrade head

echo "[entrypoint] Starting Gunicorn..."
exec gunicorn app.main:app -c docker/gunicorn_conf.py

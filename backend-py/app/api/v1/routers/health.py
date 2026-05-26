"""Health probes.

- `/health`        — liveness. Always cheap, never touches the DB.
- `/health/ready`  — readiness. Issues a `SELECT 1` so Kubernetes /
  load balancers can route traffic only when the database is reachable.
"""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter
from sqlalchemy import text

from app.api.v1.deps import DbSession

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health() -> dict:
    return {"status": "OK", "timestamp": datetime.now(UTC).isoformat()}


@router.get("/health/ready")
async def readiness(db: DbSession) -> dict:
    try:
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    status_value = "OK" if db_ok else "DEGRADED"
    return {
        "status": status_value,
        "timestamp": datetime.now(UTC).isoformat(),
        "checks": {"database": "up" if db_ok else "down"},
    }

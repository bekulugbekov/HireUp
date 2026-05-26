"""Smoke test: app boots, middleware runs, /api/health responds."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_returns_ok(client: AsyncClient) -> None:
    response = await client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "OK"
    assert "timestamp" in body
    assert "X-Request-ID" in response.headers


@pytest.mark.asyncio
async def test_security_headers_present(client: AsyncClient) -> None:
    response = await client.get("/api/health")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"

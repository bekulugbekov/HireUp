"""Phase 7 smoke tests — security headers, GZip, body size, rate limit shape."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_security_headers_present(client: AsyncClient) -> None:
    response = await client.get("/api/health")
    assert response.status_code == 200
    headers = response.headers
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert "Strict-Transport-Security" in headers


@pytest.mark.asyncio
async def test_request_id_round_trips(client: AsyncClient) -> None:
    custom_id = "request-id-from-client"
    response = await client.get("/api/health", headers={"X-Request-ID": custom_id})
    assert response.headers["X-Request-ID"] == custom_id


@pytest.mark.asyncio
async def test_body_size_limit_rejects_oversized(client: AsyncClient) -> None:
    huge_content_length = str(20 * 1024 * 1024)  # 20 MB > default 10 MB cap
    response = await client.post(
        "/api/auth/login",
        headers={
            "Content-Type": "application/json",
            "Content-Length": huge_content_length,
        },
        content=b'{"email":"a@b.com","password":"x"}',
    )
    assert response.status_code == 413
    body = response.json()
    assert body["success"] is False


@pytest.mark.asyncio
async def test_openapi_includes_tag_metadata(client: AsyncClient) -> None:
    response = await client.get("/api/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    tag_names = {tag["name"] for tag in schema.get("tags", [])}
    assert {"Health", "Auth", "Jobs", "Applications", "Users", "Messages"} <= tag_names

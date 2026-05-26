"""Shared pytest fixtures + global test env.

This module sets test-only env vars BEFORE any app imports so that
`app.core.config.settings` (which is `lru_cache`'d) picks them up.

Integration tests live under `tests/integration/` and override the
`client` fixture with a DB-backed version.
"""

from __future__ import annotations

import os
from collections.abc import AsyncIterator

import pytest

# ── Test environment — must be set before importing the app ─────────
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("APP_DEBUG", "false")
os.environ.setdefault("JWT_SECRET", "test_secret_value_that_is_long_enough_to_pass")
os.environ.setdefault("BCRYPT_ROUNDS", "4")  # ← keep bcrypt cheap in tests
os.environ.setdefault("RATE_LIMIT_PER_MINUTE", "10000")
os.environ.setdefault("LOGIN_RATE_LIMIT", "10000/minute")
os.environ.setdefault("REGISTER_RATE_LIMIT", "10000/minute")
os.environ.setdefault("REFRESH_RATE_LIMIT", "10000/minute")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")

from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    """Default client — no DB. Overridden in integration/conftest.py."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

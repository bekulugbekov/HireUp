"""Unit tests for password hashing and JWT helpers.

No database needed.
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

import pytest

from app.core.exceptions import UnauthorizedError
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    refresh_token_expiry,
    verify_password,
)


# ── Passwords ────────────────────────────────────────────


def test_password_hash_round_trip() -> None:
    plain = "S3cure-password!"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("wrong", hashed) is False


def test_password_hash_is_salted() -> None:
    a = hash_password("same-password")
    b = hash_password("same-password")
    assert a != b, "bcrypt salt should differ between hashes"


# ── JWT access tokens ────────────────────────────────────


def test_access_token_round_trip() -> None:
    user_id = uuid4()
    token, expires_at = create_access_token(user_id, role="employer")
    payload = decode_access_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["role"] == "employer"
    assert payload["type"] == "access"
    assert expires_at > datetime.now(UTC)


def test_decode_rejects_tampered_token() -> None:
    token, _ = create_access_token(uuid4(), role="user")
    tampered = token[:-3] + ("AAA" if not token.endswith("AAA") else "BBB")
    with pytest.raises(UnauthorizedError):
        decode_access_token(tampered)


def test_decode_rejects_garbage() -> None:
    with pytest.raises(UnauthorizedError):
        decode_access_token("not-a-jwt")


def test_extra_claims_are_included() -> None:
    token, _ = create_access_token(uuid4(), role="user", extra_claims={"foo": "bar"})
    payload = decode_access_token(token)
    assert payload["foo"] == "bar"


# ── Refresh tokens ───────────────────────────────────────


def test_refresh_token_is_random_and_long() -> None:
    a = generate_refresh_token()
    b = generate_refresh_token()
    assert a != b
    assert len(a) >= 43  # 32 bytes base64-url ≈ 43 chars
    assert len(b) >= 43


def test_refresh_token_hash_is_deterministic_and_irreversible() -> None:
    plain = generate_refresh_token()
    h1 = hash_refresh_token(plain)
    h2 = hash_refresh_token(plain)
    assert h1 == h2
    assert plain not in h1
    assert len(h1) == 64  # SHA-256 hex


def test_refresh_expiry_is_in_the_future() -> None:
    exp = refresh_token_expiry()
    assert exp > datetime.now(UTC)

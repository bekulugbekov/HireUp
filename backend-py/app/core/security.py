"""Password hashing and JWT helpers.

Two token types are issued:
- access: short-ish JWT (default 24h) carried in `Authorization: Bearer`
- refresh: long-lived opaque random string (stored hashed server-side)
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any, Literal
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.exceptions import UnauthorizedError

TokenType = Literal["access", "refresh"]

_pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=settings.bcrypt_rounds,
)


# ── Passwords ────────────────────────────────────────────


def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


# ── JWT (access tokens) ──────────────────────────────────


def create_access_token(
    subject: str | UUID,
    *,
    role: str,
    extra_claims: dict[str, Any] | None = None,
) -> tuple[str, datetime]:
    """Return (token, expires_at)."""
    now = datetime.now(UTC)
    expire = now + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, expire


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise UnauthorizedError("auth.tokenExpired") from exc
    if payload.get("type") != "access":
        raise UnauthorizedError("auth.unauthorized")
    return payload


# ── Refresh tokens (opaque) ──────────────────────────────


def generate_refresh_token() -> str:
    """Return a URL-safe 256-bit random string."""
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    """SHA-256 — fast, deterministic. Sufficient for opaque random tokens.

    Bcrypt is overkill here because the token itself already has 256 bits of
    entropy; salting is unnecessary and the lookup must be O(1).
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def refresh_token_expiry() -> datetime:
    return datetime.now(UTC) + timedelta(days=settings.jwt_refresh_token_expire_days)

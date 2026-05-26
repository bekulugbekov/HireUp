"""Auth request and response schemas.

Security note (fixes Node.js bug #2): `RegisterRequest` does NOT accept
a `role` field. The Node.js validator allowed `role` in the body, which
let anyone register as `admin`. The service now hard-codes `role=user`
for self-service registration.
"""

from __future__ import annotations

from pydantic import EmailStr, Field

from app.models.enums import LanguageCode
from app.schemas.common import CamelModel
from app.schemas.user import UserMe, UserPublic


# ── Requests ──────────────────────────────────────────────


class RegisterRequest(CamelModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    language: LanguageCode = LanguageCode.UZ


class LoginRequest(CamelModel):
    email: EmailStr
    password: str = Field(min_length=1)


class RefreshRequest(CamelModel):
    refresh_token: str = Field(min_length=10)


class LogoutRequest(CamelModel):
    refresh_token: str = Field(min_length=10)


# ── Responses (custom shapes — Node.js 1:1) ──────────────


class AuthResponse(CamelModel):
    """Returned by POST /register and POST /login.

    Shape mirrors the Node.js backend exactly. The `refreshToken` field is
    the only addition; clients that ignore it keep working unchanged.
    """

    success: bool = True
    message: str
    token: str
    refresh_token: str
    user: UserPublic


class RefreshResponse(CamelModel):
    success: bool = True
    token: str
    refresh_token: str


class MeResponse(CamelModel):
    """Returned by GET /me — matches Node.js `{success, user}` shape."""

    success: bool = True
    user: UserMe


class MessageOnlyResponse(CamelModel):
    success: bool = True
    message: str

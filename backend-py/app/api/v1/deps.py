"""FastAPI dependencies (router-facing).

Layered injection:
- get_db          → AsyncSession
- get_translator  → Translator (Accept-Language)
- get_token_payload → decoded JWT (no DB hit)
- get_current_user  → loaded User from DB
- get_*_service     → service constructed from repositories

`require_roles(...)` returns a dependency that validates the JWT role
claim against the allowed set.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.i18n import Translator, parse_accept_language
from app.core.security import decode_access_token
from app.db.session import get_db as _get_db
from app.models.user import User
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService

_bearer_scheme = HTTPBearer(auto_error=False)


# ── Database ─────────────────────────────────────────────


async def get_db() -> AsyncIterator[AsyncSession]:
    async for session in _get_db():
        yield session


DbSession = Annotated[AsyncSession, Depends(get_db)]


# ── i18n ─────────────────────────────────────────────────


def get_translator(accept_language: str | None = Header(default=None)) -> Translator:
    return Translator(parse_accept_language(accept_language))


T = Annotated[Translator, Depends(get_translator)]


# ── Auth token ───────────────────────────────────────────


class TokenPayload:
    __slots__ = ("sub", "role", "raw")

    def __init__(self, payload: dict) -> None:
        self.sub: str = payload["sub"]
        self.role: str = payload.get("role", "user")
        self.raw = payload


def get_token_payload(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> TokenPayload:
    if credentials is None:
        raise UnauthorizedError("auth.unauthorized")
    return TokenPayload(decode_access_token(credentials.credentials))


CurrentToken = Annotated[TokenPayload, Depends(get_token_payload)]


# ── Current user (DB-backed) ─────────────────────────────


async def get_current_user(
    db: DbSession,
    token: CurrentToken,
) -> User:
    repo = UserRepository(db)
    try:
        user_id = UUID(token.sub)
    except (TypeError, ValueError) as exc:
        raise UnauthorizedError("auth.unauthorized") from exc
    user = await repo.get(user_id)
    if user is None:
        raise UnauthorizedError("auth.unauthorized")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: str):
    """Dependency factory: only allow the listed roles.

    Validates against the JWT role claim, not a re-loaded user — saves one DB
    round-trip on every protected request. Use `get_current_user` separately
    when the handler needs the user object.
    """

    def _checker(token: CurrentToken) -> TokenPayload:
        if token.role not in roles:
            raise ForbiddenError("auth.forbidden")
        return token

    return _checker


# ── Services ─────────────────────────────────────────────


def get_auth_service(db: DbSession) -> AuthService:
    return AuthService(
        user_repo=UserRepository(db),
        refresh_token_repo=RefreshTokenRepository(db),
    )


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


# ── Request metadata ─────────────────────────────────────


def get_client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def get_user_agent(user_agent: str | None = Header(default=None, alias="User-Agent")) -> str | None:
    return user_agent

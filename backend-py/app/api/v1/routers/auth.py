"""Auth endpoints.

Endpoint shapes match the Node.js backend 1:1. The only additions are
`refreshToken` in login/register responses and three new endpoints:
`/refresh`, `/logout`, `/logout-all`.

Per-endpoint rate limits guard against credential stuffing on `/login`,
sign-up abuse on `/register`, and refresh-token grinding on `/refresh`.
Defaults: 10/min, 5/min, 30/min — overridable via env.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, status

from app.api.v1.deps import (
    AuthServiceDep,
    CurrentUser,
    DbSession,
    T,
    get_client_ip,
    get_user_agent,
)
from app.repositories.saved_job_repository import SavedJobRepository
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    LogoutRequest,
    MeResponse,
    MessageOnlyResponse,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
)
from app.schemas.user import UserPublic
from app.utils.router import CamelRouter
from app.utils.serialization import user_full_dict

router = CamelRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=AuthResponse)
async def register(
    payload: RegisterRequest,
    auth: AuthServiceDep,
    t: T,
    user_agent: Annotated[str | None, Depends(get_user_agent)],
    ip: Annotated[str | None, Depends(get_client_ip)],
) -> AuthResponse:
    user = await auth.register(
        full_name=payload.full_name,
        email=payload.email,
        password=payload.password,
        language=payload.language,
    )
    _, access_token, refresh_token = await auth.login(
        email=user.email,
        password=payload.password,
        user_agent=user_agent,
        ip_address=ip,
    )
    return AuthResponse(
        message=t("auth.registered"),
        token=access_token,
        refresh_token=refresh_token,
        user=UserPublic.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    auth: AuthServiceDep,
    t: T,
    user_agent: Annotated[str | None, Depends(get_user_agent)],
    ip: Annotated[str | None, Depends(get_client_ip)],
) -> AuthResponse:
    user, access_token, refresh_token = await auth.login(
        email=payload.email,
        password=payload.password,
        user_agent=user_agent,
        ip_address=ip,
    )
    return AuthResponse(
        message=t("auth.loggedIn"),
        token=access_token,
        refresh_token=refresh_token,
        user=UserPublic.model_validate(user),
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    payload: RefreshRequest,
    auth: AuthServiceDep,
    user_agent: Annotated[str | None, Depends(get_user_agent)],
    ip: Annotated[str | None, Depends(get_client_ip)],
) -> RefreshResponse:
    _user, access_token, refresh_token = await auth.refresh(
        refresh_token=payload.refresh_token,
        user_agent=user_agent,
        ip_address=ip,
    )
    return RefreshResponse(token=access_token, refresh_token=refresh_token)


@router.post("/logout", response_model=MessageOnlyResponse)
async def logout(
    payload: LogoutRequest,
    auth: AuthServiceDep,
    t: T,
) -> MessageOnlyResponse:
    await auth.logout(refresh_token=payload.refresh_token)
    return MessageOnlyResponse(message=t("auth.loggedOut"))


@router.post("/logout-all", response_model=MessageOnlyResponse)
async def logout_all(
    user: CurrentUser,
    auth: AuthServiceDep,
    t: T,
) -> MessageOnlyResponse:
    await auth.logout_all(user_id=user.id)
    return MessageOnlyResponse(message=t("auth.loggedOut"))


@router.get("/me")
async def me(
    user: CurrentUser,
    db: DbSession,
) -> dict:
    saved_repo = SavedJobRepository(db)
    saved_ids = await saved_repo.list_job_ids_for_user(user.id)
    return {"success": True, "user": user_full_dict(user, saved_job_ids=saved_ids)}

"""Users endpoints — 1:1 compatible with the Node.js backend.

Phase 1 bug #3 fix: admin list and admin endpoints never expose
`password_hash`. The `user_full_dict` serializer simply doesn't include
the password field; nothing trusts the schema to strip it.
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import Depends, File, Form, Query, UploadFile

from app.api.v1.deps import CurrentUser, DbSession, T, require_roles
from app.models.enums import LanguageCode, UserRole
from app.repositories.job_repository import JobRepository
from app.repositories.saved_job_repository import SavedJobRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user_profile import ChangePasswordRequest, ProfileUpdate
from app.services.user_service import UserService
from app.utils.file_upload import AVATAR_MIME_TYPES, save_upload
from app.utils.pagination import build_pagination
from app.utils.router import CamelRouter
from app.utils.serialization import job_dict, user_full_dict

router = CamelRouter(prefix="/users", tags=["Users"])


def get_user_service(db: DbSession) -> UserService:
    return UserService(
        user_repo=UserRepository(db),
        job_repo=JobRepository(db),
        saved_job_repo=SavedJobRepository(db),
    )


UserServiceDep = Annotated[UserService, Depends(get_user_service)]


@router.put("/profile")
async def update_profile(
    user: CurrentUser,
    service: UserServiceDep,
    t: T,
    full_name: Annotated[str | None, Form(alias="fullName")] = None,
    language: Annotated[LanguageCode | None, Form()] = None,
    phone: Annotated[str | None, Form()] = None,
    telegram: Annotated[str | None, Form()] = None,
    bio: Annotated[str | None, Form()] = None,
    title: Annotated[str | None, Form()] = None,
    avatar: Annotated[UploadFile | None, File()] = None,
) -> dict:
    avatar_path: str | None = None
    if avatar is not None and avatar.filename:
        avatar_path = await save_upload(
            avatar,
            allowed_mime_types=AVATAR_MIME_TYPES,
            subfolder="avatars",
        )

    payload = ProfileUpdate(
        full_name=full_name,
        language=language,
        phone=phone,
        telegram=telegram,
        bio=bio,
        title=title,
        avatar=avatar_path,
    )
    updated = await service.update_profile(user=user, payload=payload)
    return {"success": True, "message": t("user.updated"), "data": user_full_dict(updated)}


@router.patch("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    user: CurrentUser,
    service: UserServiceDep,
    t: T,
) -> dict:
    await service.change_password(
        user=user,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    return {"success": True, "message": t("auth.passwordChanged")}


@router.post("/saved/{job_id}")
async def toggle_saved_job(
    job_id: UUID,
    user: CurrentUser,
    service: UserServiceDep,
) -> dict:
    saved_ids = await service.toggle_saved_job(user=user, job_id=job_id)
    return {"success": True, "savedJobs": [str(i) for i in saved_ids]}


@router.get("/saved")
async def list_saved_jobs(
    user: CurrentUser,
    service: UserServiceDep,
) -> dict:
    jobs = await service.list_saved_jobs(user=user)
    return {"success": True, "data": [job_dict(j) for j in jobs]}


# ── Admin endpoints ──────────────────────────────────────


@router.get("")
async def list_users(
    service: UserServiceDep,
    _: Annotated[None, Depends(require_roles(UserRole.ADMIN.value))],
    db: DbSession,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict:
    users, total = await service.list_all(page=page, limit=limit)
    saved_repo = SavedJobRepository(db)
    enriched = []
    for u in users:
        saved_ids = await saved_repo.list_job_ids_for_user(u.id)
        enriched.append(user_full_dict(u, saved_job_ids=saved_ids))
    return {
        "success": True,
        "data": enriched,
        "pagination": build_pagination(total, page, limit).model_dump(by_alias=True),
    }


@router.delete("/{user_id}")
async def delete_user(
    user_id: UUID,
    service: UserServiceDep,
    t: T,
    _: Annotated[None, Depends(require_roles(UserRole.ADMIN.value))],
) -> dict:
    await service.delete_user(user_id)
    return {"success": True, "message": t("user.deleted")}


@router.get("/stats")
async def get_stats(
    service: UserServiceDep,
    _: Annotated[None, Depends(require_roles(UserRole.ADMIN.value))],
) -> dict:
    data = await service.stats()
    return {"success": True, "data": data}

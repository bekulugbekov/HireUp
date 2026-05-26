"""Applications endpoints — 1:1 compatible with the Node.js backend."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import Depends, File, Form, Query, UploadFile, status

from app.api.v1.deps import CurrentUser, DbSession, T, require_roles
from app.models.enums import UserRole
from app.repositories.application_repository import ApplicationRepository
from app.repositories.job_repository import JobRepository
from app.schemas.application import ApplicationStatusUpdate
from app.services.application_service import ApplicationService
from app.utils.file_upload import RESUME_MIME_TYPES, save_upload
from app.utils.pagination import build_pagination
from app.utils.router import CamelRouter
from app.utils.serialization import application_dict

router = CamelRouter(prefix="/applications", tags=["Applications"])


def get_application_service(db: DbSession) -> ApplicationService:
    return ApplicationService(
        application_repo=ApplicationRepository(db),
        job_repo=JobRepository(db),
    )


ApplicationServiceDep = Annotated[ApplicationService, Depends(get_application_service)]


@router.get("/my")
async def list_my_applications(
    user: CurrentUser,
    service: ApplicationServiceDep,
    t: T,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict:
    items, total = await service.list_my(user=user, page=page, limit=limit)
    return {
        "success": True,
        "message": t("application.fetched"),
        "data": [application_dict(a, populate_job=True) for a in items],
        "pagination": build_pagination(total, page, limit).model_dump(by_alias=True),
    }


@router.get("/job/{job_id}")
async def list_job_applications(
    job_id: UUID,
    user: CurrentUser,
    service: ApplicationServiceDep,
    _: Annotated[None, Depends(require_roles(UserRole.EMPLOYER.value, UserRole.ADMIN.value))],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict:
    items, total = await service.list_for_job(job_id, actor=user, page=page, limit=limit)
    return {
        "success": True,
        "data": [application_dict(a, populate_user=True) for a in items],
        "pagination": build_pagination(total, page, limit).model_dump(by_alias=True),
    }


@router.post("/{job_id}", status_code=status.HTTP_201_CREATED)
async def apply_for_job(
    job_id: UUID,
    user: CurrentUser,
    service: ApplicationServiceDep,
    t: T,
    _: Annotated[None, Depends(require_roles(UserRole.USER.value))],
    cover_letter: Annotated[str | None, Form(alias="coverLetter")] = None,
    phone: Annotated[str | None, Form()] = None,
    telegram: Annotated[str | None, Form()] = None,
    resume: Annotated[UploadFile | None, File()] = None,
) -> dict:
    resume_path: str | None = None
    if resume is not None and resume.filename:
        resume_path = await save_upload(
            resume,
            allowed_mime_types=RESUME_MIME_TYPES,
            subfolder="resumes",
        )

    application = await service.apply(
        applicant=user,
        job_id=job_id,
        resume=resume_path,
        cover_letter=cover_letter,
        phone=phone,
        telegram=telegram,
    )
    return {
        "success": True,
        "message": t("application.submitted"),
        "data": application_dict(application),
    }


@router.patch("/{application_id}/status")
async def update_application_status(
    application_id: UUID,
    payload: ApplicationStatusUpdate,
    user: CurrentUser,
    service: ApplicationServiceDep,
    t: T,
    _: Annotated[None, Depends(require_roles(UserRole.EMPLOYER.value, UserRole.ADMIN.value))],
) -> dict:
    application = await service.update_status(
        application_id, actor=user, new_status=payload.status
    )
    return {
        "success": True,
        "message": t("application.updated"),
        "data": application_dict(application),
    }


@router.delete("/{application_id}")
async def withdraw_application(
    application_id: UUID,
    user: CurrentUser,
    service: ApplicationServiceDep,
    t: T,
    _: Annotated[None, Depends(require_roles(UserRole.USER.value))],
) -> dict:
    await service.withdraw(application_id, user=user)
    return {"success": True, "message": t("application.withdrawn")}

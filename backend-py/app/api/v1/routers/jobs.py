"""Jobs endpoints — 1:1 compatible with the Node.js backend."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import Depends, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.api.v1.deps import (
    CurrentUser,
    DbSession,
    T,
    require_roles,
)
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token
from app.models.enums import ExperienceLevel, JobCategory, JobType, UserRole
from app.repositories.job_repository import JobRepository
from app.repositories.user_repository import UserRepository
from app.schemas.job import JobCreate, JobUpdate
from app.services.job_service import JobService
from app.utils.pagination import build_pagination
from app.utils.router import CamelRouter
from app.utils.serialization import job_dict

router = CamelRouter(prefix="/jobs", tags=["Jobs"])

_optional_bearer = HTTPBearer(auto_error=False)


def get_job_service(db: DbSession) -> JobService:
    return JobService(job_repo=JobRepository(db))


JobServiceDep = Annotated[JobService, Depends(get_job_service)]


async def _maybe_current_user(
    db: DbSession,
    credentials: HTTPAuthorizationCredentials | None = Depends(_optional_bearer),
):
    """Returns the current user if a valid token is supplied, otherwise None."""
    if credentials is None:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = UUID(payload["sub"])
    except (UnauthorizedError, KeyError, TypeError, ValueError):
        return None
    return await UserRepository(db).get(user_id)


@router.get("")
async def list_jobs(
    service: JobServiceDep,
    t: T,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    category: JobCategory | None = Query(None),
    location: str | None = Query(None),
    experience: ExperienceLevel | None = Query(None),
    job_type: JobType | None = Query(None, alias="type"),
    min_salary: int | None = Query(None, alias="minSalary", ge=0),
    max_salary: int | None = Query(None, alias="maxSalary", ge=0),
    skills: str | None = Query(None, description="Comma-separated"),
) -> dict:
    skill_list = [s.strip() for s in skills.split(",")] if skills else None

    jobs, total = await service.list_jobs(
        page=page,
        limit=limit,
        search=search,
        category=category,
        location=location,
        experience=experience,
        job_type=job_type,
        min_salary=min_salary,
        max_salary=max_salary,
        skills=skill_list,
    )

    return {
        "success": True,
        "message": t("job.fetched"),
        "data": [job_dict(j) for j in jobs],
        "pagination": build_pagination(total, page, limit).model_dump(by_alias=True),
    }


@router.get("/my")
async def list_my_jobs(
    user: CurrentUser,
    service: JobServiceDep,
    _: Annotated[None, Depends(require_roles(UserRole.EMPLOYER.value, UserRole.ADMIN.value))],
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
) -> dict:
    jobs, total = await service.list_my_jobs(actor=user, page=page, limit=limit)
    return {
        "success": True,
        "data": [job_dict(j) for j in jobs],
        "pagination": build_pagination(total, page, limit).model_dump(by_alias=True),
    }


@router.get("/{job_id}")
async def get_job(
    job_id: UUID,
    service: JobServiceDep,
    viewer=Depends(_maybe_current_user),
) -> dict:
    job = await service.get_job(job_id, viewer=viewer)
    return {"success": True, "data": job_dict(job, creator_with_contact=True)}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: JobCreate,
    user: CurrentUser,
    service: JobServiceDep,
    t: T,
    _: Annotated[None, Depends(require_roles(UserRole.EMPLOYER.value, UserRole.ADMIN.value))],
) -> dict:
    job = await service.create_job(creator=user, payload=payload)
    return {"success": True, "message": t("job.created"), "data": job_dict(job)}


@router.put("/{job_id}")
async def update_job(
    job_id: UUID,
    payload: JobUpdate,
    user: CurrentUser,
    service: JobServiceDep,
    t: T,
    _: Annotated[None, Depends(require_roles(UserRole.EMPLOYER.value, UserRole.ADMIN.value))],
) -> dict:
    job = await service.update_job(job_id, actor=user, payload=payload)
    return {"success": True, "message": t("job.updated"), "data": job_dict(job)}


@router.delete("/{job_id}")
async def delete_job(
    job_id: UUID,
    user: CurrentUser,
    service: JobServiceDep,
    t: T,
    _: Annotated[None, Depends(require_roles(UserRole.EMPLOYER.value, UserRole.ADMIN.value))],
) -> dict:
    await service.delete_job(job_id, actor=user)
    return {"success": True, "message": t("job.deleted")}


@router.patch("/{job_id}/toggle")
async def toggle_job_active(
    job_id: UUID,
    user: CurrentUser,
    service: JobServiceDep,
    t: T,
    _: Annotated[None, Depends(require_roles(UserRole.EMPLOYER.value, UserRole.ADMIN.value))],
) -> dict:
    job = await service.toggle_active(job_id, actor=user)
    message_key = "job.activated" if job.is_active else "job.deactivated"
    return {"success": True, "message": t(message_key), "data": job_dict(job)}

"""Application business logic.

Phase 1 bug #1 (CRITICAL): when an employer changes an application's
status, we verify they own the job — without this check, ANY employer
could mark ANY application as accepted/rejected.
"""

from __future__ import annotations

from typing import Sequence
from uuid import UUID

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.models.application import Application
from app.models.enums import ApplicationStatus, UserRole
from app.models.user import User
from app.repositories.application_repository import ApplicationRepository
from app.repositories.job_repository import JobRepository


class ApplicationService:
    def __init__(
        self,
        *,
        application_repo: ApplicationRepository,
        job_repo: JobRepository,
    ) -> None:
        self.applications = application_repo
        self.jobs = job_repo

    async def apply(
        self,
        *,
        applicant: User,
        job_id: UUID,
        resume: str | None,
        cover_letter: str | None,
        phone: str | None,
        telegram: str | None,
    ) -> Application:
        job = await self.jobs.get(job_id)
        if job is None:
            raise NotFoundError("job.notFound")

        if await self.applications.exists_for_user_and_job(applicant.id, job_id):
            raise ConflictError("application.alreadyApplied")

        application = Application(
            user_id=applicant.id,
            job_id=job_id,
            resume=resume or None,
            cover_letter=cover_letter or None,
            phone=phone or applicant.phone,
            telegram=telegram or applicant.telegram,
        )
        return await self.applications.add(application)

    async def list_my(
        self,
        *,
        user: User,
        page: int,
        limit: int,
    ) -> tuple[Sequence[Application], int]:
        return await self.applications.list_by_user(
            user.id, offset=(page - 1) * limit, limit=limit
        )

    async def list_for_job(
        self,
        job_id: UUID,
        *,
        actor: User,
        page: int,
        limit: int,
    ) -> tuple[Sequence[Application], int]:
        job = await self.jobs.get(job_id)
        if job is None:
            raise NotFoundError("job.notFound")
        if actor.role != UserRole.ADMIN and job.created_by != actor.id:
            raise ForbiddenError("auth.forbidden")
        return await self.applications.list_by_job(
            job_id, offset=(page - 1) * limit, limit=limit
        )

    async def update_status(
        self,
        application_id: UUID,
        *,
        actor: User,
        new_status: ApplicationStatus,
    ) -> Application:
        application = await self.applications.get_with_job(application_id)
        if application is None:
            raise NotFoundError("application.notFound")

        # Bug #1 fix: the employer must own the parent job (or be an admin).
        if actor.role != UserRole.ADMIN and application.job.created_by != actor.id:
            raise ForbiddenError("auth.forbidden")

        application.status = new_status
        await self.applications.session.flush()
        await self.applications.session.refresh(application)
        return application

    async def withdraw(self, application_id: UUID, *, user: User) -> None:
        application = await self.applications.get_by_user_and_id(application_id, user.id)
        if application is None:
            raise NotFoundError("application.notFound")
        if application.status != ApplicationStatus.PENDING:
            raise ValidationError("application.cannotWithdraw")
        await self.applications.delete(application)

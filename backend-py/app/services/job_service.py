"""Job business logic.

Bug-fix notes from Phase 1:
- #11 viewCount is only incremented when the viewer is NOT the owner.
- Ownership check is centralised here so it can't be forgotten by a route.
- Pagination is mandatory (no list method returns unbounded results).
"""

from __future__ import annotations

from typing import Sequence
from uuid import UUID

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.enums import ExperienceLevel, JobCategory, JobType, UserRole
from app.models.job import Job
from app.models.user import User
from app.repositories.job_repository import JobRepository
from app.schemas.job import JobCreate, JobUpdate


class JobService:
    def __init__(self, *, job_repo: JobRepository) -> None:
        self.jobs = job_repo

    async def list_jobs(
        self,
        *,
        page: int,
        limit: int,
        search: str | None = None,
        category: JobCategory | None = None,
        location: str | None = None,
        experience: ExperienceLevel | None = None,
        job_type: JobType | None = None,
        min_salary: int | None = None,
        max_salary: int | None = None,
        skills: list[str] | None = None,
    ) -> tuple[Sequence[Job], int]:
        return await self.jobs.list_filtered(
            offset=(page - 1) * limit,
            limit=limit,
            search=search,
            category=category,
            location=location,
            experience=experience,
            job_type=job_type,
            min_salary=min_salary,
            max_salary=max_salary,
            skills=skills,
        )

    async def get_job(self, job_id: UUID, *, viewer: User | None = None) -> Job:
        job = await self.jobs.get_with_creator(job_id)
        if job is None:
            raise NotFoundError("job.notFound")

        # Bug #11 fix: don't inflate analytics for the owner viewing their own post.
        if viewer is None or viewer.id != job.created_by:
            await self.jobs.increment_view_count(job_id)
            job.view_count += 1
        return job

    async def create_job(self, *, creator: User, payload: JobCreate) -> Job:
        job = Job(
            title=payload.title.strip(),
            company=payload.company.strip(),
            location=payload.location.strip(),
            description=payload.description,
            salary_min=payload.salary.min,
            salary_max=payload.salary.max,
            salary_currency=payload.salary.currency.upper(),
            requirements=[r.strip() for r in payload.requirements if r.strip()],
            skills=[s.strip() for s in payload.skills if s.strip()],
            category=payload.category,
            experience=payload.experience,
            job_type=payload.job_type,
            contact_phone=payload.contact.phone or None,
            contact_telegram=payload.contact.telegram or None,
            contact_website=payload.contact.website or None,
            created_by=creator.id,
        )
        return await self.jobs.add(job)

    async def update_job(
        self,
        job_id: UUID,
        *,
        actor: User,
        payload: JobUpdate,
    ) -> Job:
        job = await self.jobs.get(job_id)
        if job is None:
            raise NotFoundError("job.notFound")
        self._assert_can_manage(job, actor)

        data = payload.model_dump(exclude_unset=True, by_alias=False)

        if "salary" in data and data["salary"] is not None:
            salary = data.pop("salary")
            job.salary_min = salary.get("min", job.salary_min)
            job.salary_max = salary.get("max", job.salary_max)
            job.salary_currency = (salary.get("currency") or job.salary_currency).upper()
        if "contact" in data and data["contact"] is not None:
            contact = data.pop("contact")
            job.contact_phone = contact.get("phone") or None
            job.contact_telegram = contact.get("telegram") or None
            job.contact_website = contact.get("website") or None
        if "requirements" in data and data["requirements"] is not None:
            job.requirements = [r.strip() for r in data.pop("requirements") if r.strip()]
        if "skills" in data and data["skills"] is not None:
            job.skills = [s.strip() for s in data.pop("skills") if s.strip()]

        for field, value in data.items():
            if value is not None:
                setattr(job, field, value)

        await self.jobs.session.flush()
        await self.jobs.session.refresh(job)
        return job

    async def delete_job(self, job_id: UUID, *, actor: User) -> None:
        job = await self.jobs.get(job_id)
        if job is None:
            raise NotFoundError("job.notFound")
        self._assert_can_manage(job, actor)
        await self.jobs.delete(job)

    async def list_my_jobs(
        self,
        *,
        actor: User,
        page: int,
        limit: int,
    ) -> tuple[Sequence[Job], int]:
        return await self.jobs.list_by_creator(
            actor.id, offset=(page - 1) * limit, limit=limit
        )

    async def toggle_active(self, job_id: UUID, *, actor: User) -> Job:
        job = await self.jobs.get(job_id)
        if job is None:
            raise NotFoundError("job.notFound")
        self._assert_can_manage(job, actor)
        job.is_active = not job.is_active
        await self.jobs.session.flush()
        await self.jobs.session.refresh(job)
        return job

    # ── Helpers ──────────────────────────────────────────

    @staticmethod
    def _assert_can_manage(job: Job, actor: User) -> None:
        if actor.role != UserRole.ADMIN and job.created_by != actor.id:
            raise ForbiddenError("job.noPermission")

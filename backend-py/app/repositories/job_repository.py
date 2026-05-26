"""Job data access — filtering, search, view-count increment."""

from __future__ import annotations

from typing import Sequence
from uuid import UUID

from sqlalchemy import Select, and_, func, select, update
from sqlalchemy.orm import selectinload

from app.models.enums import ExperienceLevel, JobCategory, JobType
from app.models.job import Job
from app.repositories.base import BaseRepository


class JobRepository(BaseRepository[Job]):
    model = Job

    async def get_with_creator(self, job_id: UUID) -> Job | None:
        result = await self.session.scalars(
            select(Job).options(selectinload(Job.creator)).where(Job.id == job_id)
        )
        return result.first()

    async def increment_view_count(self, job_id: UUID) -> None:
        await self.session.execute(
            update(Job)
            .where(Job.id == job_id)
            .values(view_count=Job.view_count + 1)
            .execution_options(synchronize_session=False)
        )

    async def list_filtered(
        self,
        *,
        offset: int,
        limit: int,
        search: str | None = None,
        category: JobCategory | None = None,
        location: str | None = None,
        experience: ExperienceLevel | None = None,
        job_type: JobType | None = None,
        min_salary: int | None = None,
        max_salary: int | None = None,
        skills: list[str] | None = None,
        active_only: bool = True,
    ) -> tuple[Sequence[Job], int]:
        stmt = select(Job).options(selectinload(Job.creator))
        conditions = []

        if active_only:
            conditions.append(Job.is_active.is_(True))
        if search:
            conditions.append(
                Job.search_vector.op("@@")(func.plainto_tsquery("simple", search))
            )
        if category is not None:
            conditions.append(Job.category == category)
        if location:
            conditions.append(Job.location.ilike(f"%{location}%"))
        if experience is not None:
            conditions.append(Job.experience == experience)
        if job_type is not None:
            conditions.append(Job.job_type == job_type)
        if min_salary is not None:
            conditions.append(Job.salary_min >= min_salary)
        if max_salary is not None:
            conditions.append(Job.salary_max <= max_salary)
        if skills:
            conditions.append(Job.skills.op("&&")(skills))

        if conditions:
            stmt = stmt.where(and_(*conditions))

        total = await self._count(stmt)
        result = await self.session.scalars(
            stmt.order_by(Job.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.all()), total

    async def list_by_creator(
        self,
        creator_id: UUID,
        *,
        offset: int,
        limit: int,
    ) -> tuple[Sequence[Job], int]:
        base = select(Job).where(Job.created_by == creator_id)
        total = await self._count(base)
        result = await self.session.scalars(
            base.order_by(Job.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.all()), total

    async def get_by_ids(self, ids):
        if not ids:
            return []
        result = await self.session.scalars(
            select(Job).where(Job.id.in_(list(ids)))
        )
        return list(result.all())

    async def count_by_category(self) -> dict[str, int]:
        rows = await self.session.execute(
            select(Job.category, func.count()).group_by(Job.category)
        )
        return {str(cat.value if hasattr(cat, "value") else cat): count for cat, count in rows}

    async def count_all(self) -> int:
        return int(await self.session.scalar(select(func.count()).select_from(Job)) or 0)

    async def _count(self, stmt: Select) -> int:
        count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
        return int(await self.session.scalar(count_stmt) or 0)

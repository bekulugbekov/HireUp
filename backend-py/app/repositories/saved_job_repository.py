"""SavedJob data access — atomic toggle via INSERT … ON CONFLICT."""

from __future__ import annotations

from typing import Sequence
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import selectinload

from app.models.job import Job
from app.models.saved_job import SavedJob


class SavedJobRepository:
    def __init__(self, session) -> None:
        self.session = session

    async def add(self, user_id: UUID, job_id: UUID) -> bool:
        """Return True if a new row was inserted, False if it already existed."""
        stmt = (
            insert(SavedJob)
            .values(user_id=user_id, job_id=job_id)
            .on_conflict_do_nothing(index_elements=[SavedJob.user_id, SavedJob.job_id])
        )
        result = await self.session.execute(stmt)
        return (result.rowcount or 0) > 0

    async def remove(self, user_id: UUID, job_id: UUID) -> int:
        result = await self.session.execute(
            delete(SavedJob).where(
                SavedJob.user_id == user_id, SavedJob.job_id == job_id
            )
        )
        return result.rowcount or 0

    async def toggle(self, user_id: UUID, job_id: UUID) -> bool:
        """Add if missing, remove if present. Returns the new saved state."""
        added = await self.add(user_id, job_id)
        if added:
            return True
        await self.remove(user_id, job_id)
        return False

    async def list_jobs_for_user(self, user_id: UUID) -> Sequence[Job]:
        result = await self.session.scalars(
            select(Job)
            .join(SavedJob, SavedJob.job_id == Job.id)
            .options(selectinload(Job.creator))
            .where(SavedJob.user_id == user_id)
            .order_by(SavedJob.saved_at.desc())
        )
        return list(result.all())

    async def list_job_ids_for_user(self, user_id: UUID) -> list[UUID]:
        result = await self.session.scalars(
            select(SavedJob.job_id).where(SavedJob.user_id == user_id)
        )
        return list(result.all())

    async def count_for_user(self, user_id: UUID) -> int:
        return int(
            await self.session.scalar(
                select(func.count())
                .select_from(SavedJob)
                .where(SavedJob.user_id == user_id)
            )
            or 0
        )

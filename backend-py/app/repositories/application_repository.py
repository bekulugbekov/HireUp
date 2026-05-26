"""Application data access."""

from __future__ import annotations

from typing import Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.models.application import Application
from app.repositories.base import BaseRepository


class ApplicationRepository(BaseRepository[Application]):
    model = Application

    async def exists_for_user_and_job(self, user_id: UUID, job_id: UUID) -> bool:
        result = await self.session.scalar(
            select(func.count())
            .select_from(Application)
            .where(Application.user_id == user_id, Application.job_id == job_id)
        )
        return bool(result)

    async def get_by_user_and_id(
        self,
        application_id: UUID,
        user_id: UUID,
    ) -> Application | None:
        result = await self.session.scalars(
            select(Application).where(
                Application.id == application_id,
                Application.user_id == user_id,
            )
        )
        return result.first()

    async def list_by_user(
        self,
        user_id: UUID,
        *,
        offset: int,
        limit: int,
    ) -> tuple[Sequence[Application], int]:
        base = (
            select(Application)
            .options(selectinload(Application.job))
            .where(Application.user_id == user_id)
        )
        total = int(
            await self.session.scalar(
                select(func.count())
                .select_from(Application)
                .where(Application.user_id == user_id)
            )
            or 0
        )
        result = await self.session.scalars(
            base.order_by(Application.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.all()), total

    async def list_by_job(
        self,
        job_id: UUID,
        *,
        offset: int,
        limit: int,
    ) -> tuple[Sequence[Application], int]:
        base = (
            select(Application)
            .options(selectinload(Application.user))
            .where(Application.job_id == job_id)
        )
        total = int(
            await self.session.scalar(
                select(func.count())
                .select_from(Application)
                .where(Application.job_id == job_id)
            )
            or 0
        )
        result = await self.session.scalars(
            base.order_by(Application.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.all()), total

    async def get_with_job(self, application_id: UUID) -> Application | None:
        result = await self.session.scalars(
            select(Application)
            .options(selectinload(Application.job))
            .where(Application.id == application_id)
        )
        return result.first()

"""User data access."""

from __future__ import annotations

from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.scalars(
            select(User).where(User.email == email.lower())
        )
        return result.first()

    async def email_exists(self, email: str) -> bool:
        result = await self.session.scalar(
            select(func.count()).select_from(User).where(User.email == email.lower())
        )
        return bool(result)

    async def list_paginated(
        self,
        *,
        offset: int,
        limit: int,
    ) -> tuple[Sequence[User], int]:
        total = await self.session.scalar(select(func.count()).select_from(User)) or 0
        result = await self.session.scalars(
            select(User).order_by(User.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.all()), int(total)

    async def get_with_saved_jobs(self, user_id) -> User | None:
        result = await self.session.scalars(
            select(User)
            .options(selectinload(User.saved_jobs))
            .where(User.id == user_id)
        )
        return result.first()

    async def get_by_ids(self, ids):
        if not ids:
            return []
        result = await self.session.scalars(
            select(User).where(User.id.in_(list(ids)))
        )
        return list(result.all())

    async def count_by_role(self) -> dict[str, int]:
        rows = await self.session.execute(
            select(User.role, func.count()).group_by(User.role)
        )
        return {str(role.value if hasattr(role, "value") else role): count for role, count in rows}

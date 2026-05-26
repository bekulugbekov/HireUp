"""Base repository — shared CRUD primitives.

Repositories own SQL queries only. No permission checks, no domain rules:
those live in the service layer.
"""

from __future__ import annotations

from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, id: UUID) -> ModelT | None:
        return await self.session.get(self.model, id)

    async def list_all(self) -> list[ModelT]:
        result = await self.session.scalars(select(self.model))
        return list(result.all())

    async def add(self, instance: ModelT) -> ModelT:
        self.session.add(instance)
        await self.session.flush()
        return instance

    async def delete(self, instance: ModelT) -> None:
        await self.session.delete(instance)
        await self.session.flush()

    async def delete_by_id(self, id: UUID) -> int:
        result = await self.session.execute(
            delete(self.model).where(self.model.id == id)  # type: ignore[attr-defined]
        )
        return result.rowcount or 0

    async def update_fields(self, instance: ModelT, **fields: Any) -> ModelT:
        for key, value in fields.items():
            setattr(instance, key, value)
        await self.session.flush()
        return instance

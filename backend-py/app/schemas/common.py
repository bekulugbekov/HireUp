"""Shared Pydantic schemas: response envelope, pagination, base config."""

from __future__ import annotations

from typing import Annotated, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

T = TypeVar("T")


class CamelModel(BaseModel):
    """All API DTOs inherit this — camelCase aliases + snake_case Python names."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class PaginationMeta(CamelModel):
    total: int
    page: int
    pages: int
    limit: int


class ResponseEnvelope(CamelModel, Generic[T]):
    success: bool = True
    message: str | None = None
    data: T | None = None
    pagination: PaginationMeta | None = None


class ErrorEnvelope(CamelModel):
    success: bool = False
    message: str
    details: dict | list | None = None


PageQuery = Annotated[int, Field(ge=1)]
LimitQuery = Annotated[int, Field(ge=1, le=100)]

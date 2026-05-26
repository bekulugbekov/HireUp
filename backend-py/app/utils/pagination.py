"""Reusable pagination math."""

from __future__ import annotations

from math import ceil

from app.schemas.common import PaginationMeta


def build_pagination(total: int, page: int, limit: int) -> PaginationMeta:
    pages = ceil(total / limit) if limit > 0 else 0
    return PaginationMeta(total=total, page=page, pages=pages, limit=limit)


def offset(page: int, limit: int) -> int:
    return (page - 1) * limit

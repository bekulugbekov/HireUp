"""User-facing DTOs.

Frontend compatibility note: the Node.js backend returned `_id` (MongoDB
convention). The `id: UUID = Field(alias="_id")` shape preserves that —
the JSON response uses `_id` while the Python attribute stays `id`.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field

from app.models.enums import LanguageCode, UserRole
from app.schemas.common import CamelModel


class UserPublic(CamelModel):
    """Minimal user snapshot returned alongside login / register."""

    id: UUID = Field(alias="_id")
    full_name: str
    email: EmailStr
    role: UserRole
    language: LanguageCode
    avatar: str | None = None


class UserMe(CamelModel):
    """Full profile returned by GET /api/auth/me."""

    id: UUID = Field(alias="_id")
    full_name: str
    email: EmailStr
    role: UserRole
    language: LanguageCode
    avatar: str | None = None
    phone: str | None = None
    telegram: str | None = None
    bio: str | None = None
    title: str | None = None
    saved_jobs: list[UUID] = Field(default_factory=list)
    created_at: datetime

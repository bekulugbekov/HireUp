"""User profile + admin request schemas."""

from __future__ import annotations

from pydantic import Field

from app.models.enums import LanguageCode
from app.schemas.common import CamelModel


class ChangePasswordRequest(CamelModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=6, max_length=128)


# Note: profile update arrives as multipart/form-data so we can also accept
# an optional avatar file. Field validation happens per-parameter in the
# router; no JSON body schema is needed.


class ProfileUpdate(CamelModel):
    """Used internally by the service to carry the partial update payload."""

    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    language: LanguageCode | None = None
    phone: str | None = Field(default=None, max_length=30)
    telegram: str | None = Field(default=None, max_length=50)
    bio: str | None = Field(default=None, max_length=500)
    title: str | None = Field(default=None, max_length=120)
    avatar: str | None = None  # stored path, not the file itself

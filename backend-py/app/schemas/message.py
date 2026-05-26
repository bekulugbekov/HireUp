"""Message request schemas."""

from __future__ import annotations

from uuid import UUID

from pydantic import Field

from app.schemas.common import CamelModel


class SendMessageRequest(CamelModel):
    receiver_id: UUID
    content: str = Field(min_length=1, max_length=2000)
    job_id: UUID | None = None

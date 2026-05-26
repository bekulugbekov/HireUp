"""SavedJob junction table — replaces `User.savedJobs[]` array.

Composite primary key (user_id, job_id) guarantees atomic toggle via
`INSERT ... ON CONFLICT DO NOTHING` and fixes the race condition in the
Node.js implementation.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.user import User


class SavedJob(Base):
    __tablename__ = "saved_jobs"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    job_id: Mapped[UUID] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"),
        primary_key=True,
    )
    saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    user: Mapped["User"] = relationship(back_populates="saved_jobs")
    job: Mapped["Job"] = relationship()

    def __repr__(self) -> str:
        return f"<SavedJob user={self.user_id} job={self.job_id}>"

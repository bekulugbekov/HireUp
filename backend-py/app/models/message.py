"""Message ORM model — replaces Mongoose `messages` collection."""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.user import User


class Message(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "messages"

    sender_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    receiver_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    job_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("jobs.id", ondelete="SET NULL"),
        nullable=True,
    )

    content: Mapped[str] = mapped_column(String(2000), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))

    # ── Relationships ─────────────────────────────────────
    sender: Mapped["User"] = relationship(
        foreign_keys=[sender_id],
        back_populates="sent_messages",
    )
    receiver: Mapped["User"] = relationship(
        foreign_keys=[receiver_id],
        back_populates="received_messages",
    )
    job: Mapped["Job | None"] = relationship()

    __table_args__ = (
        CheckConstraint("sender_id <> receiver_id", name="ck_messages_no_self_message"),
        CheckConstraint("length(trim(content)) > 0", name="ck_messages_content_non_empty"),
        Index(
            "idx_messages_pair_created",
            text("LEAST(sender_id, receiver_id)"),
            text("GREATEST(sender_id, receiver_id)"),
            text("created_at DESC"),
        ),
        Index(
            "idx_messages_receiver_unread",
            "receiver_id",
            postgresql_where=text("is_read = false"),
        ),
    )

    def __repr__(self) -> str:
        return f"<Message {self.sender_id} → {self.receiver_id}>"

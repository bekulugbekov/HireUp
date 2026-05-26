"""User ORM model — replaces Mongoose `users` collection."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Enum, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import LanguageCode, UserRole

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.job import Job
    from app.models.message import Message
    from app.models.refresh_token import RefreshToken
    from app.models.saved_job import SavedJob


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        server_default=UserRole.USER.value,
    )
    language: Mapped[LanguageCode] = mapped_column(
        Enum(LanguageCode, name="lang_code", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        server_default=LanguageCode.UZ.value,
    )

    avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    telegram: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    title: Mapped[str | None] = mapped_column(String(120), nullable=True)

    # ── Relationships ──────────────────────────────────────
    jobs: Mapped[list["Job"]] = relationship(
        back_populates="creator",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    applications: Mapped[list["Application"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    saved_jobs: Mapped[list["SavedJob"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    sent_messages: Mapped[list["Message"]] = relationship(
        foreign_keys="Message.sender_id",
        back_populates="sender",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    received_messages: Mapped[list["Message"]] = relationship(
        foreign_keys="Message.receiver_id",
        back_populates="receiver",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        CheckConstraint("email = lower(email)", name="ck_users_email_lowercase"),
        Index("idx_users_role", "role"),
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"

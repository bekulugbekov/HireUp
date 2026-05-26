"""Message data access.

The Mongo aggregation pipeline that produced the conversation list is
replaced here by a single `DISTINCT ON` query — semantically equivalent
but a fraction of the cost.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence
from uuid import UUID

from sqlalchemy import case, func, literal_column, or_, select, update
from sqlalchemy.orm import selectinload

from app.models.message import Message
from app.repositories.base import BaseRepository


@dataclass(slots=True)
class ConversationRow:
    partner_id: UUID
    last_message_id: UUID
    last_content: str
    last_created_at: object
    last_is_read: bool
    last_sender_id: UUID
    last_job_id: UUID | None
    unread_count: int


class MessageRepository(BaseRepository[Message]):
    model = Message

    async def list_thread(
        self,
        user_id: UUID,
        partner_id: UUID,
    ) -> Sequence[Message]:
        result = await self.session.scalars(
            select(Message)
            .options(
                selectinload(Message.sender),
                selectinload(Message.receiver),
                selectinload(Message.job),
            )
            .where(
                or_(
                    (Message.sender_id == user_id) & (Message.receiver_id == partner_id),
                    (Message.sender_id == partner_id) & (Message.receiver_id == user_id),
                )
            )
            .order_by(Message.created_at.asc())
        )
        return list(result.all())

    async def mark_thread_read(self, user_id: UUID, partner_id: UUID) -> int:
        result = await self.session.execute(
            update(Message)
            .where(
                Message.sender_id == partner_id,
                Message.receiver_id == user_id,
                Message.is_read.is_(False),
            )
            .values(is_read=True)
        )
        return result.rowcount or 0

    async def unread_count(self, user_id: UUID) -> int:
        return int(
            await self.session.scalar(
                select(func.count())
                .select_from(Message)
                .where(Message.receiver_id == user_id, Message.is_read.is_(False))
            )
            or 0
        )

    async def list_conversations(self, user_id: UUID) -> list[ConversationRow]:
        """Return one row per conversation partner with the latest message + unread count.

        Implemented as a CTE + DISTINCT ON pattern. The Node.js equivalent
        used a 5-stage Mongo aggregation pipeline.
        """
        partner_expr = case(
            (Message.sender_id == user_id, Message.receiver_id),
            else_=Message.sender_id,
        ).label("partner_id")

        ranked = (
            select(
                Message.id.label("message_id"),
                partner_expr,
                Message.content,
                Message.created_at,
                Message.is_read,
                Message.sender_id,
                Message.job_id,
            )
            .where(or_(Message.sender_id == user_id, Message.receiver_id == user_id))
            .order_by(partner_expr, Message.created_at.desc())
            .distinct(partner_expr)
            .subquery("ranked")
        )

        unread_subq = (
            select(
                case(
                    (Message.sender_id == user_id, Message.receiver_id),
                    else_=Message.sender_id,
                ).label("partner_id"),
                func.sum(
                    case(
                        (
                            (Message.receiver_id == user_id) & (Message.is_read.is_(False)),
                            1,
                        ),
                        else_=0,
                    )
                ).label("unread_count"),
            )
            .where(or_(Message.sender_id == user_id, Message.receiver_id == user_id))
            .group_by("partner_id")
            .subquery("unread")
        )

        stmt = (
            select(
                ranked.c.partner_id,
                ranked.c.message_id,
                ranked.c.content,
                ranked.c.created_at,
                ranked.c.is_read,
                ranked.c.sender_id,
                ranked.c.job_id,
                func.coalesce(unread_subq.c.unread_count, 0).label("unread_count"),
            )
            .select_from(
                ranked.join(
                    unread_subq, ranked.c.partner_id == unread_subq.c.partner_id, isouter=True
                )
            )
            .order_by(literal_column("created_at").desc())
        )

        rows = await self.session.execute(stmt)
        return [
            ConversationRow(
                partner_id=row.partner_id,
                last_message_id=row.message_id,
                last_content=row.content,
                last_created_at=row.created_at,
                last_is_read=row.is_read,
                last_sender_id=row.sender_id,
                last_job_id=row.job_id,
                unread_count=int(row.unread_count),
            )
            for row in rows
        ]

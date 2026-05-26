"""Messaging business logic.

The Mongo aggregation pipeline that built the conversation list is now a
single `DISTINCT ON` query in the repo. The service then issues two
batch lookups (partners and jobs) to enrich the rows — replacing the
populate() round-trips in the Node.js controller.
"""

from __future__ import annotations

from typing import Sequence
from uuid import UUID

from app.core.exceptions import NotFoundError, ValidationError
from app.models.message import Message
from app.models.user import User
from app.repositories.job_repository import JobRepository
from app.repositories.message_repository import MessageRepository
from app.repositories.user_repository import UserRepository


class MessageService:
    def __init__(
        self,
        *,
        message_repo: MessageRepository,
        user_repo: UserRepository,
        job_repo: JobRepository,
    ) -> None:
        self.messages = message_repo
        self.users = user_repo
        self.jobs = job_repo

    async def send(
        self,
        *,
        sender: User,
        receiver_id: UUID,
        content: str,
        job_id: UUID | None = None,
    ) -> Message:
        content_clean = content.strip()
        if not content_clean:
            raise ValidationError("message.contentRequired")
        if receiver_id == sender.id:
            raise ValidationError("message.cannotSelfMessage")

        receiver = await self.users.get(receiver_id)
        if receiver is None:
            raise NotFoundError("message.userNotFound")

        message = Message(
            sender_id=sender.id,
            receiver_id=receiver_id,
            job_id=job_id,
            content=content_clean,
        )
        await self.messages.add(message)
        # Eager-load sender/receiver/job so the serializer can populate them.
        return await self._reload_full(message.id)

    async def list_conversations(self, *, user: User) -> list[dict]:
        rows = await self.messages.list_conversations(user.id)
        if not rows:
            return []

        partner_ids = {r.partner_id for r in rows}
        job_ids = {r.last_job_id for r in rows if r.last_job_id is not None}

        partners = {p.id: p for p in await self.users.get_by_ids(partner_ids)}
        jobs = {j.id: j for j in await self.jobs.get_by_ids(job_ids)} if job_ids else {}

        out: list[dict] = []
        for row in rows:
            partner = partners.get(row.partner_id)
            last_job = jobs.get(row.last_job_id) if row.last_job_id else None
            out.append(
                {
                    "partnerId": str(row.partner_id),
                    "partner": (
                        {
                            "_id": str(partner.id),
                            "fullName": partner.full_name,
                            "avatar": partner.avatar or "",
                            "title": partner.title or "",
                        }
                        if partner is not None
                        else None
                    ),
                    "unreadCount": row.unread_count,
                    "lastMessage": {
                        "_id": str(row.last_message_id),
                        "content": row.last_content,
                        "sender": str(row.last_sender_id),
                        "isRead": row.last_is_read,
                        "createdAt": row.last_created_at.isoformat()
                        if hasattr(row.last_created_at, "isoformat")
                        else row.last_created_at,
                        "job": (
                            {
                                "_id": str(last_job.id),
                                "title": last_job.title,
                                "company": last_job.company,
                            }
                            if last_job is not None
                            else None
                        ),
                    },
                }
            )
        return out

    async def list_thread(
        self,
        *,
        user: User,
        partner_id: UUID,
    ) -> Sequence[Message]:
        messages = await self.messages.list_thread(user.id, partner_id)
        await self.messages.mark_thread_read(user.id, partner_id)
        return messages

    async def unread_count(self, *, user: User) -> int:
        return await self.messages.unread_count(user.id)

    async def _reload_full(self, message_id: UUID) -> Message:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        result = await self.messages.session.scalars(
            select(Message)
            .options(
                selectinload(Message.sender),
                selectinload(Message.receiver),
                selectinload(Message.job),
            )
            .where(Message.id == message_id)
        )
        loaded = result.first()
        if loaded is None:
            raise NotFoundError("common.notFound")
        return loaded

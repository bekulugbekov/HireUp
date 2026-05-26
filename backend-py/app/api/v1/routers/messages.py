"""Messages endpoints — 1:1 compatible with the Node.js backend."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import Depends, status

from app.api.v1.deps import CurrentUser, DbSession, T
from app.repositories.job_repository import JobRepository
from app.repositories.message_repository import MessageRepository
from app.repositories.user_repository import UserRepository
from app.schemas.message import SendMessageRequest
from app.services.message_service import MessageService
from app.utils.router import CamelRouter
from app.utils.serialization import message_dict

router = CamelRouter(prefix="/messages", tags=["Messages"])


def get_message_service(db: DbSession) -> MessageService:
    return MessageService(
        message_repo=MessageRepository(db),
        user_repo=UserRepository(db),
        job_repo=JobRepository(db),
    )


MessageServiceDep = Annotated[MessageService, Depends(get_message_service)]


@router.post("", status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: SendMessageRequest,
    user: CurrentUser,
    service: MessageServiceDep,
    t: T,
) -> dict:
    message = await service.send(
        sender=user,
        receiver_id=payload.receiver_id,
        content=payload.content,
        job_id=payload.job_id,
    )
    return {
        "success": True,
        "message": t("message.sent"),
        "data": message_dict(message),
    }


@router.get("")
async def list_conversations(
    user: CurrentUser,
    service: MessageServiceDep,
) -> dict:
    conversations = await service.list_conversations(user=user)
    return {"success": True, "data": conversations}


@router.get("/unread")
async def get_unread_count(
    user: CurrentUser,
    service: MessageServiceDep,
) -> dict:
    count = await service.unread_count(user=user)
    return {"success": True, "data": {"count": count}}


@router.get("/{user_id}")
async def get_thread(
    user_id: UUID,
    user: CurrentUser,
    service: MessageServiceDep,
) -> dict:
    messages = await service.list_thread(user=user, partner_id=user_id)
    return {"success": True, "data": [message_dict(m) for m in messages]}

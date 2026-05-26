"""Messages flow — send, conversations, thread auto-read, unread count."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_send_message_basic(
    client: AsyncClient,
    auth_headers: dict,
    employer_user,
) -> None:
    employer, _ = employer_user
    resp = await client.post(
        "/api/messages/",
        headers=auth_headers,
        json={"receiverId": str(employer.id), "content": "Hello"},
    )
    assert resp.status_code == 201
    assert resp.json()["data"]["content"] == "Hello"


@pytest.mark.asyncio
async def test_cannot_send_to_self(
    client: AsyncClient, auth_headers: dict, regular_user
) -> None:
    me, _ = regular_user
    resp = await client.post(
        "/api/messages/",
        headers=auth_headers,
        json={"receiverId": str(me.id), "content": "Hi me"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_send_to_nonexistent_user_404(
    client: AsyncClient, auth_headers: dict
) -> None:
    import uuid

    resp = await client.post(
        "/api/messages/",
        headers=auth_headers,
        json={"receiverId": str(uuid.uuid4()), "content": "Hi ghost"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_empty_content_rejected_by_schema(
    client: AsyncClient, auth_headers: dict, employer_user
) -> None:
    employer, _ = employer_user
    resp = await client.post(
        "/api/messages/",
        headers=auth_headers,
        json={"receiverId": str(employer.id), "content": ""},
    )
    assert resp.status_code == 422  # Pydantic min_length=1 rejection


@pytest.mark.asyncio
async def test_conversation_list_groups_by_partner(
    client: AsyncClient,
    auth_headers: dict,
    employer_user,
    other_employer,
) -> None:
    e1, _ = employer_user
    e2, _ = other_employer

    await client.post(
        "/api/messages/",
        headers=auth_headers,
        json={"receiverId": str(e1.id), "content": "Hi e1"},
    )
    await client.post(
        "/api/messages/",
        headers=auth_headers,
        json={"receiverId": str(e1.id), "content": "Hi e1 again"},
    )
    await client.post(
        "/api/messages/",
        headers=auth_headers,
        json={"receiverId": str(e2.id), "content": "Hi e2"},
    )

    resp = await client.get("/api/messages/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data) == 2  # two distinct partners
    partners = {row["partnerId"] for row in data}
    assert partners == {str(e1.id), str(e2.id)}


@pytest.mark.asyncio
async def test_get_thread_marks_messages_read(
    client: AsyncClient,
    auth_headers: dict,
    employer_headers: dict,
    regular_user,
    employer_user,
) -> None:
    me, _ = regular_user
    emp, _ = employer_user

    # Employer sends two messages to me
    await client.post(
        "/api/messages/",
        headers=employer_headers,
        json={"receiverId": str(me.id), "content": "Msg 1"},
    )
    await client.post(
        "/api/messages/",
        headers=employer_headers,
        json={"receiverId": str(me.id), "content": "Msg 2"},
    )

    unread = await client.get("/api/messages/unread", headers=auth_headers)
    assert unread.json()["data"]["count"] == 2

    # Opening the thread marks them read
    thread = await client.get(f"/api/messages/{emp.id}", headers=auth_headers)
    assert thread.status_code == 200
    assert len(thread.json()["data"]) == 2

    unread_after = await client.get("/api/messages/unread", headers=auth_headers)
    assert unread_after.json()["data"]["count"] == 0


@pytest.mark.asyncio
async def test_unread_count_for_empty_user_is_zero(
    client: AsyncClient, auth_headers: dict
) -> None:
    resp = await client.get("/api/messages/unread", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["count"] == 0

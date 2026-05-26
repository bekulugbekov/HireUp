"""End-to-end auth flow — register, login, /me, refresh rotation, logout."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_login_me_full_flow(client: AsyncClient) -> None:
    register_resp = await client.post(
        "/api/auth/register",
        json={
            "fullName": "Ali Valiyev",
            "email": "ali@example.com",
            "password": "secret123",
            "language": "uz",
        },
    )
    assert register_resp.status_code == 201, register_resp.text
    body = register_resp.json()
    assert body["success"] is True
    assert body["user"]["_id"]
    assert body["user"]["role"] == "user"
    assert body["token"]
    assert body["refreshToken"]

    login_resp = await client.post(
        "/api/auth/login",
        json={"email": "ali@example.com", "password": "secret123"},
    )
    assert login_resp.status_code == 200
    login_body = login_resp.json()
    token = login_body["token"]

    me_resp = await client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    me_body = me_resp.json()
    assert me_body["user"]["email"] == "ali@example.com"
    assert me_body["user"]["fullName"] == "Ali Valiyev"
    assert "password" not in me_body["user"]
    assert "passwordHash" not in me_body["user"]


@pytest.mark.asyncio
async def test_register_ignores_admin_role(client: AsyncClient) -> None:
    """Phase 1 bug #2: client-supplied role must NEVER become admin."""
    resp = await client.post(
        "/api/auth/register",
        json={
            "fullName": "Mallory",
            "email": "mallory@x.com",
            "password": "secret123",
            "role": "admin",  # ← privilege escalation attempt
        },
    )
    assert resp.status_code == 201
    assert resp.json()["user"]["role"] == "user"


@pytest.mark.asyncio
async def test_register_rejects_duplicate_email(client: AsyncClient) -> None:
    await client.post(
        "/api/auth/register",
        json={"fullName": "A", "email": "dup@x.com", "password": "secret123"},
    )
    second = await client.post(
        "/api/auth/register",
        json={"fullName": "B", "email": "dup@x.com", "password": "other123"},
    )
    assert second.status_code == 409


@pytest.mark.asyncio
async def test_login_wrong_password_returns_401(client: AsyncClient) -> None:
    await client.post(
        "/api/auth/register",
        json={"fullName": "X", "email": "x@y.com", "password": "secret123"},
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": "x@y.com", "password": "WRONG"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_without_token_returns_401(client: AsyncClient) -> None:
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_with_garbage_token_returns_401(client: AsyncClient) -> None:
    resp = await client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-jwt"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_rotates_token(client: AsyncClient) -> None:
    reg = await client.post(
        "/api/auth/register",
        json={"fullName": "A", "email": "rot@x.com", "password": "secret123"},
    )
    r1 = reg.json()["refreshToken"]

    rotated = await client.post("/api/auth/refresh", json={"refreshToken": r1})
    assert rotated.status_code == 200
    r2 = rotated.json()["refreshToken"]
    assert r1 != r2


@pytest.mark.asyncio
async def test_refresh_reuse_revokes_all_sessions(client: AsyncClient) -> None:
    """Phase 5 critical guarantee: reusing a rotated refresh kills every session."""
    await client.post(
        "/api/auth/register",
        json={"fullName": "A", "email": "reuse@x.com", "password": "secret123"},
    )

    # Two independent sessions
    s1 = await client.post(
        "/api/auth/login", json={"email": "reuse@x.com", "password": "secret123"}
    )
    s2 = await client.post(
        "/api/auth/login", json={"email": "reuse@x.com", "password": "secret123"}
    )
    r1 = s1.json()["refreshToken"]
    r2 = s2.json()["refreshToken"]

    # Rotate session 1
    rotated = await client.post("/api/auth/refresh", json={"refreshToken": r1})
    assert rotated.status_code == 200
    r1_new = rotated.json()["refreshToken"]

    # Reuse the (now revoked) original token → server treats as compromise
    reuse = await client.post("/api/auth/refresh", json={"refreshToken": r1})
    assert reuse.status_code == 401

    # Every other session for that user is also dead
    assert (
        await client.post("/api/auth/refresh", json={"refreshToken": r1_new})
    ).status_code == 401
    assert (
        await client.post("/api/auth/refresh", json={"refreshToken": r2})
    ).status_code == 401


@pytest.mark.asyncio
async def test_logout_invalidates_only_that_session(client: AsyncClient) -> None:
    await client.post(
        "/api/auth/register",
        json={"fullName": "A", "email": "lo@x.com", "password": "secret123"},
    )
    s1 = (
        await client.post("/api/auth/login", json={"email": "lo@x.com", "password": "secret123"})
    ).json()
    s2 = (
        await client.post("/api/auth/login", json={"email": "lo@x.com", "password": "secret123"})
    ).json()

    await client.post("/api/auth/logout", json={"refreshToken": s1["refreshToken"]})

    # Session 1 dead, session 2 still alive
    assert (
        await client.post("/api/auth/refresh", json={"refreshToken": s1["refreshToken"]})
    ).status_code == 401
    assert (
        await client.post("/api/auth/refresh", json={"refreshToken": s2["refreshToken"]})
    ).status_code == 200


@pytest.mark.asyncio
async def test_logout_all_kills_every_session(client: AsyncClient) -> None:
    reg = await client.post(
        "/api/auth/register",
        json={"fullName": "A", "email": "la@x.com", "password": "secret123"},
    )
    token = reg.json()["token"]
    r_first = reg.json()["refreshToken"]
    r_extra = (
        await client.post("/api/auth/login", json={"email": "la@x.com", "password": "secret123"})
    ).json()["refreshToken"]

    resp = await client.post(
        "/api/auth/logout-all", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200

    assert (
        await client.post("/api/auth/refresh", json={"refreshToken": r_first})
    ).status_code == 401
    assert (
        await client.post("/api/auth/refresh", json={"refreshToken": r_extra})
    ).status_code == 401


@pytest.mark.asyncio
async def test_i18n_messages_localised(client: AsyncClient) -> None:
    en = await client.post(
        "/api/auth/login",
        json={"email": "ghost@x.com", "password": "x"},
        headers={"Accept-Language": "en"},
    )
    ru = await client.post(
        "/api/auth/login",
        json={"email": "ghost@x.com", "password": "x"},
        headers={"Accept-Language": "ru"},
    )
    uz = await client.post(
        "/api/auth/login",
        json={"email": "ghost@x.com", "password": "x"},
        headers={"Accept-Language": "uz"},
    )
    assert en.json()["message"] == "Invalid email or password"
    assert ru.json()["message"] == "Неверный email или пароль"
    assert uz.json()["message"] == "Email yoki parol noto'g'ri"

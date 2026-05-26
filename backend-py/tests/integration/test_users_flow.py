"""Users flow — profile, password, saved jobs, admin endpoints."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_update_profile_text_fields(
    client: AsyncClient, auth_headers: dict
) -> None:
    resp = await client.put(
        "/api/users/profile",
        headers=auth_headers,
        data={
            "fullName": "Ali Updated",
            "bio": "Backend dev",
            "title": "Engineer",
            "phone": "+998999999999",
        },
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["fullName"] == "Ali Updated"
    assert data["bio"] == "Backend dev"
    assert data["phone"] == "+998999999999"


@pytest.mark.asyncio
async def test_change_password_round_trip(
    client: AsyncClient, regular_user, auth_headers: dict
) -> None:
    user, password = regular_user

    resp = await client.patch(
        "/api/users/change-password",
        headers=auth_headers,
        json={"currentPassword": password, "newPassword": "brand-new-pw"},
    )
    assert resp.status_code == 200

    # Old password no longer works
    bad = await client.post(
        "/api/auth/login", json={"email": user.email, "password": password}
    )
    assert bad.status_code == 401

    # New password works
    good = await client.post(
        "/api/auth/login", json={"email": user.email, "password": "brand-new-pw"}
    )
    assert good.status_code == 200


@pytest.mark.asyncio
async def test_change_password_rejects_wrong_current(
    client: AsyncClient, auth_headers: dict
) -> None:
    resp = await client.patch(
        "/api/users/change-password",
        headers=auth_headers,
        json={"currentPassword": "WRONG", "newPassword": "abcdefg"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_save_job_toggle_atomic(
    client: AsyncClient,
    auth_headers: dict,
    employer_user,
    make_job,
) -> None:
    """Phase 1 bug #14: toggle saves are atomic at the DB layer."""
    employer, _ = employer_user
    job = await make_job(creator=employer)

    first = await client.post(f"/api/users/saved/{job.id}", headers=auth_headers)
    assert first.status_code == 200
    assert str(job.id) in first.json()["savedJobs"]

    second = await client.post(f"/api/users/saved/{job.id}", headers=auth_headers)
    assert second.status_code == 200
    assert str(job.id) not in second.json()["savedJobs"]


@pytest.mark.asyncio
async def test_saved_list_returns_saved_jobs(
    client: AsyncClient, auth_headers: dict, employer_user, make_job
) -> None:
    employer, _ = employer_user
    j1 = await make_job(creator=employer, title="First Saved")
    j2 = await make_job(creator=employer, title="Second Saved")
    await client.post(f"/api/users/saved/{j1.id}", headers=auth_headers)
    await client.post(f"/api/users/saved/{j2.id}", headers=auth_headers)

    resp = await client.get("/api/users/saved", headers=auth_headers)
    assert resp.status_code == 200
    titles = {j["title"] for j in resp.json()["data"]}
    assert titles == {"First Saved", "Second Saved"}


@pytest.mark.asyncio
async def test_admin_user_list_never_exposes_password(
    client: AsyncClient,
    admin_headers: dict,
    regular_user,
) -> None:
    """Phase 1 bug #3: GET /api/users (admin) must not include password hash."""
    resp = await client.get("/api/users/", headers=admin_headers)
    assert resp.status_code == 200
    for user in resp.json()["data"]:
        assert "password" not in user
        assert "passwordHash" not in user
        assert "password_hash" not in user


@pytest.mark.asyncio
async def test_non_admin_cannot_list_users(
    client: AsyncClient, auth_headers: dict
) -> None:
    resp = await client.get("/api/users/", headers=auth_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_stats_returns_counts(
    client: AsyncClient,
    admin_headers: dict,
    regular_user,
    employer_user,
    make_job,
) -> None:
    employer, _ = employer_user
    await make_job(creator=employer)

    resp = await client.get("/api/users/stats", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["totalUsers"] >= 2
    assert data["totalJobs"] >= 1
    role_ids = {r["_id"] for r in data["byRole"]}
    assert {"user", "employer", "admin"} <= role_ids


@pytest.mark.asyncio
async def test_admin_delete_user(
    client: AsyncClient,
    admin_headers: dict,
    regular_user,
) -> None:
    user, _ = regular_user
    resp = await client.delete(f"/api/users/{user.id}", headers=admin_headers)
    assert resp.status_code == 200

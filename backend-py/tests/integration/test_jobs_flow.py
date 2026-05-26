"""Jobs CRUD + filters + ownership + view-count behaviour."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


def _job_payload(**overrides):
    base = {
        "title": "Backend Engineer",
        "company": "HireUp",
        "location": "Tashkent",
        "description": "Build APIs",
        "category": "IT",
        "experience": "mid",
        "type": "remote",
        "salary": {"min": 1500, "max": 3500, "currency": "USD"},
        "skills": ["python", "fastapi"],
        "requirements": ["3+ years"],
        "contact": {"phone": "+998901234567"},
    }
    base.update(overrides)
    return base


@pytest.mark.asyncio
async def test_regular_user_cannot_create_job(
    client: AsyncClient, auth_headers: dict
) -> None:
    resp = await client.post("/api/jobs/", json=_job_payload(), headers=auth_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_employer_creates_job(
    client: AsyncClient, employer_headers: dict
) -> None:
    resp = await client.post(
        "/api/jobs/", json=_job_payload(), headers=employer_headers
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["data"]["title"] == "Backend Engineer"
    assert body["data"]["salary"]["min"] == 1500
    assert body["data"]["type"] == "remote"
    assert body["data"]["contact"]["phone"] == "+998901234567"


@pytest.mark.asyncio
async def test_list_jobs_paginated_and_filtered(
    client: AsyncClient, employer_user, make_job
) -> None:
    employer, _ = employer_user
    await make_job(creator=employer, title="Python Backend", skills=["python"])
    await make_job(creator=employer, title="React Frontend", skills=["react"], category="Design".__class__("Design"))  # type: ignore[arg-type]

    resp = await client.get("/api/jobs/", params={"search": "python"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["pagination"]["total"] >= 1
    titles = [j["title"] for j in data["data"]]
    assert "Python Backend" in titles


@pytest.mark.asyncio
async def test_list_jobs_skill_filter(
    client: AsyncClient, employer_user, make_job
) -> None:
    employer, _ = employer_user
    await make_job(creator=employer, title="Has Python", skills=["python", "fastapi"])
    await make_job(creator=employer, title="Has React", skills=["react"])

    resp = await client.get("/api/jobs/", params={"skills": "python"})
    titles = [j["title"] for j in resp.json()["data"]]
    assert "Has Python" in titles
    assert "Has React" not in titles


@pytest.mark.asyncio
async def test_get_single_job_increments_view_count_for_non_owner(
    client: AsyncClient, employer_user, make_job, auth_headers
) -> None:
    employer, _ = employer_user
    job = await make_job(creator=employer)

    resp = await client.get(f"/api/jobs/{job.id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["viewCount"] == 1

    await client.get(f"/api/jobs/{job.id}", headers=auth_headers)
    again = await client.get(f"/api/jobs/{job.id}", headers=auth_headers)
    assert again.json()["data"]["viewCount"] == 3


@pytest.mark.asyncio
async def test_get_single_job_does_not_increment_for_owner(
    client: AsyncClient, employer_user, employer_headers, make_job
) -> None:
    """Phase 1 bug #11: owner viewing their own post must not inflate analytics."""
    employer, _ = employer_user
    job = await make_job(creator=employer)

    for _ in range(3):
        resp = await client.get(f"/api/jobs/{job.id}", headers=employer_headers)
        assert resp.status_code == 200

    assert resp.json()["data"]["viewCount"] == 0


@pytest.mark.asyncio
async def test_update_other_employers_job_returns_403(
    client: AsyncClient,
    employer_user,
    other_employer_headers,
    make_job,
) -> None:
    employer, _ = employer_user
    job = await make_job(creator=employer)

    resp = await client.put(
        f"/api/jobs/{job.id}",
        json={"title": "Hacked"},
        headers=other_employer_headers,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_update_any_job(
    client: AsyncClient, employer_user, admin_headers, make_job
) -> None:
    employer, _ = employer_user
    job = await make_job(creator=employer)

    resp = await client.put(
        f"/api/jobs/{job.id}",
        json={"title": "Admin Edited"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["title"] == "Admin Edited"


@pytest.mark.asyncio
async def test_toggle_active_flips_state(
    client: AsyncClient, employer_user, employer_headers, make_job
) -> None:
    employer, _ = employer_user
    job = await make_job(creator=employer, is_active=True)

    first = await client.patch(f"/api/jobs/{job.id}/toggle", headers=employer_headers)
    assert first.json()["data"]["isActive"] is False

    second = await client.patch(f"/api/jobs/{job.id}/toggle", headers=employer_headers)
    assert second.json()["data"]["isActive"] is True


@pytest.mark.asyncio
async def test_delete_own_job(
    client: AsyncClient, employer_user, employer_headers, make_job
) -> None:
    employer, _ = employer_user
    job = await make_job(creator=employer)

    resp = await client.delete(f"/api/jobs/{job.id}", headers=employer_headers)
    assert resp.status_code == 200

    missing = await client.get(f"/api/jobs/{job.id}")
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_get_my_jobs(
    client: AsyncClient, employer_user, employer_headers, make_job, other_employer
) -> None:
    me, _ = employer_user
    other, _ = other_employer
    await make_job(creator=me, title="Mine A")
    await make_job(creator=me, title="Mine B")
    await make_job(creator=other, title="Not Mine")

    resp = await client.get("/api/jobs/my", headers=employer_headers)
    assert resp.status_code == 200
    titles = {j["title"] for j in resp.json()["data"]}
    assert titles == {"Mine A", "Mine B"}

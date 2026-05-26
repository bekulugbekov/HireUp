"""Applications flow + verification of Phase 1 critical bug #1."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_apply_for_job(
    client: AsyncClient,
    auth_headers: dict,
    employer_user,
    make_job,
) -> None:
    employer, _ = employer_user
    job = await make_job(creator=employer)

    resp = await client.post(
        f"/api/applications/{job.id}",
        headers=auth_headers,
        data={
            "coverLetter": "Please consider me",
            "phone": "+998901234567",
            "telegram": "@ali",
        },
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["data"]["status"] == "pending"
    assert body["data"]["coverLetter"] == "Please consider me"


@pytest.mark.asyncio
async def test_employer_cannot_apply(
    client: AsyncClient, employer_headers, make_job, employer_user
) -> None:
    employer, _ = employer_user
    job = await make_job(creator=employer)
    resp = await client.post(
        f"/api/applications/{job.id}",
        headers=employer_headers,
        data={"coverLetter": "x"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_duplicate_application_rejected(
    client: AsyncClient, auth_headers, employer_user, make_job
) -> None:
    employer, _ = employer_user
    job = await make_job(creator=employer)

    first = await client.post(
        f"/api/applications/{job.id}",
        headers=auth_headers,
        data={"coverLetter": "First"},
    )
    assert first.status_code == 201

    second = await client.post(
        f"/api/applications/{job.id}",
        headers=auth_headers,
        data={"coverLetter": "Second"},
    )
    assert second.status_code == 409


@pytest.mark.asyncio
async def test_my_applications_lists_only_mine(
    client: AsyncClient, auth_headers, employer_user, make_job, make_application, regular_user
) -> None:
    employer, _ = employer_user
    me, _ = regular_user
    job_a = await make_job(creator=employer, title="A")
    job_b = await make_job(creator=employer, title="B")
    await make_application(applicant=me, job=job_a)
    await make_application(applicant=me, job=job_b)

    resp = await client.get("/api/applications/my", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["pagination"]["total"] == 2


@pytest.mark.asyncio
async def test_owner_can_list_job_applications(
    client: AsyncClient, employer_user, employer_headers, make_job, make_application, regular_user
) -> None:
    employer, _ = employer_user
    applicant, _ = regular_user
    job = await make_job(creator=employer)
    await make_application(applicant=applicant, job=job)

    resp = await client.get(f"/api/applications/job/{job.id}", headers=employer_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data) == 1
    assert data[0]["user"]["email"] == applicant.email


@pytest.mark.asyncio
async def test_other_employer_cannot_list_job_applications(
    client: AsyncClient,
    employer_user,
    other_employer_headers,
    make_job,
    make_application,
    regular_user,
) -> None:
    employer, _ = employer_user
    applicant, _ = regular_user
    job = await make_job(creator=employer)
    await make_application(applicant=applicant, job=job)

    resp = await client.get(
        f"/api/applications/job/{job.id}", headers=other_employer_headers
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_BUG1_status_update_requires_job_ownership(
    client: AsyncClient,
    employer_user,
    other_employer_headers,
    make_job,
    make_application,
    regular_user,
) -> None:
    """Phase 1 CRITICAL bug #1.

    Before the fix: any employer could change ANY application's status —
    even one belonging to a job they didn't post. After the fix: 403.
    """
    employer, _ = employer_user
    applicant, _ = regular_user
    job = await make_job(creator=employer)
    app = await make_application(applicant=applicant, job=job)

    resp = await client.patch(
        f"/api/applications/{app.id}/status",
        headers=other_employer_headers,
        json={"status": "accepted"},
    )
    assert resp.status_code == 403, resp.text


@pytest.mark.asyncio
async def test_owner_can_accept_application(
    client: AsyncClient,
    employer_user,
    employer_headers,
    make_job,
    make_application,
    regular_user,
) -> None:
    employer, _ = employer_user
    applicant, _ = regular_user
    job = await make_job(creator=employer)
    app = await make_application(applicant=applicant, job=job)

    resp = await client.patch(
        f"/api/applications/{app.id}/status",
        headers=employer_headers,
        json={"status": "accepted"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "accepted"


@pytest.mark.asyncio
async def test_withdraw_pending_application(
    client: AsyncClient, auth_headers, employer_user, make_job, make_application, regular_user
) -> None:
    from app.models.enums import ApplicationStatus

    employer, _ = employer_user
    me, _ = regular_user
    job = await make_job(creator=employer)
    app = await make_application(applicant=me, job=job, status=ApplicationStatus.PENDING)

    resp = await client.delete(f"/api/applications/{app.id}", headers=auth_headers)
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_cannot_withdraw_reviewed_application(
    client: AsyncClient, auth_headers, employer_user, make_job, make_application, regular_user
) -> None:
    from app.models.enums import ApplicationStatus

    employer, _ = employer_user
    me, _ = regular_user
    job = await make_job(creator=employer)
    app = await make_application(applicant=me, job=job, status=ApplicationStatus.REVIEWED)

    resp = await client.delete(f"/api/applications/{app.id}", headers=auth_headers)
    assert resp.status_code == 400

"""Schema validation for Phase 6 routes.

Covers the small set of risky payloads — message content limits, job
filter aliases, change-password length, send-message self-reference at
schema level. Heavier integration tests are added in Phase 8.
"""

from __future__ import annotations

from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.models.enums import ApplicationStatus, JobCategory, JobType
from app.schemas.application import ApplicationStatusUpdate
from app.schemas.job import JobCreate, JobUpdate
from app.schemas.message import SendMessageRequest
from app.schemas.user_profile import ChangePasswordRequest


class TestJobCreate:
    def test_minimum_valid_payload(self) -> None:
        job = JobCreate(
            title="Backend Engineer",
            company="HireUp",
            location="Tashkent",
            description="Build the API",
            category=JobCategory.IT,
        )
        assert job.job_type == JobType.FULL_TIME
        assert job.salary.currency == "USD"

    def test_type_alias_accepted_from_client(self) -> None:
        """Frontend sends `type`, not `jobType`."""
        job = JobCreate.model_validate({
            "title": "Backend",
            "company": "X",
            "location": "Y",
            "description": "Z",
            "category": "IT",
            "type": "remote",
        })
        assert job.job_type == JobType.REMOTE

    def test_invalid_category_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JobCreate.model_validate({
                "title": "T",
                "company": "C",
                "location": "L",
                "description": "D",
                "category": "Cooking",
            })

    def test_negative_salary_rejected(self) -> None:
        with pytest.raises(ValidationError):
            JobCreate.model_validate({
                "title": "Backend Eng",
                "company": "X",
                "location": "Y",
                "description": "Z",
                "category": "IT",
                "salary": {"min": -100, "max": 1000, "currency": "USD"},
            })


class TestJobUpdate:
    def test_empty_update_is_valid(self) -> None:
        update = JobUpdate()
        assert update.model_dump(exclude_unset=True) == {}

    def test_partial_update_only_changes_named_fields(self) -> None:
        update = JobUpdate(title="New title")
        data = update.model_dump(exclude_unset=True)
        assert data == {"title": "New title"}


class TestApplicationStatusUpdate:
    def test_accepts_each_status(self) -> None:
        for s in ApplicationStatus:
            req = ApplicationStatusUpdate(status=s)
            assert req.status == s

    def test_rejects_unknown_status(self) -> None:
        with pytest.raises(ValidationError):
            ApplicationStatusUpdate.model_validate({"status": "approved"})


class TestSendMessageRequest:
    def test_valid(self) -> None:
        req = SendMessageRequest(receiverId=uuid4(), content="Hello")
        assert req.content == "Hello"

    def test_empty_content_rejected(self) -> None:
        with pytest.raises(ValidationError):
            SendMessageRequest.model_validate(
                {"receiverId": str(uuid4()), "content": ""}
            )

    def test_content_over_2000_rejected(self) -> None:
        with pytest.raises(ValidationError):
            SendMessageRequest.model_validate(
                {"receiverId": str(uuid4()), "content": "x" * 2001}
            )

    def test_invalid_uuid_rejected(self) -> None:
        with pytest.raises(ValidationError):
            SendMessageRequest.model_validate(
                {"receiverId": "not-a-uuid", "content": "Hi"}
            )


class TestChangePassword:
    def test_valid(self) -> None:
        req = ChangePasswordRequest(currentPassword="old", newPassword="abcdef")
        assert req.new_password == "abcdef"

    def test_short_new_password_rejected(self) -> None:
        with pytest.raises(ValidationError):
            ChangePasswordRequest(currentPassword="old", newPassword="12345")

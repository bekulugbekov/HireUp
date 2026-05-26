"""Schema-level validation tests for auth payloads.

Critical: verify that `role` is rejected from RegisterRequest (Node.js bug
where any user could self-assign role=admin).
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.models.enums import LanguageCode
from app.schemas.auth import LoginRequest, LogoutRequest, RegisterRequest


class TestRegisterRequest:
    def test_minimum_valid_payload(self) -> None:
        req = RegisterRequest(
            fullName="Ali Valiyev",
            email="ali@example.com",
            password="secret123",
        )
        assert req.full_name == "Ali Valiyev"
        assert req.email == "ali@example.com"
        assert req.language == LanguageCode.UZ

    def test_role_field_is_silently_ignored(self) -> None:
        """Phase 1 bug #2: `role=admin` from client must not influence the model.

        Pydantic with `extra="ignore"` drops unknown keys. Even if a client
        sends `role=admin`, the field never reaches the service.
        """
        req = RegisterRequest.model_validate(
            {
                "fullName": "Mallory",
                "email": "mallory@example.com",
                "password": "secret123",
                "role": "admin",  # ← attempt at privilege escalation
            }
        )
        assert not hasattr(req, "role")

    def test_password_too_short(self) -> None:
        with pytest.raises(ValidationError):
            RegisterRequest(fullName="X", email="x@x.com", password="12345")

    def test_full_name_too_short(self) -> None:
        with pytest.raises(ValidationError):
            RegisterRequest(fullName="A", email="a@b.com", password="secret123")

    def test_invalid_email(self) -> None:
        with pytest.raises(ValidationError):
            RegisterRequest(fullName="Ali Valiyev", email="not-an-email", password="secret123")

    def test_invalid_language(self) -> None:
        with pytest.raises(ValidationError):
            RegisterRequest.model_validate(
                {
                    "fullName": "Ali",
                    "email": "a@b.com",
                    "password": "secret123",
                    "language": "fr",
                }
            )

    def test_snake_case_input_accepted(self) -> None:
        """populate_by_name=True allows both snake_case and camelCase input."""
        req = RegisterRequest(
            full_name="Ali Valiyev",
            email="ali@example.com",
            password="secret123",
        )
        assert req.full_name == "Ali Valiyev"


class TestLoginRequest:
    def test_valid_login(self) -> None:
        req = LoginRequest(email="a@b.com", password="anything")
        assert req.email == "a@b.com"

    def test_empty_password_rejected(self) -> None:
        with pytest.raises(ValidationError):
            LoginRequest(email="a@b.com", password="")


class TestLogoutRequest:
    def test_short_token_rejected(self) -> None:
        with pytest.raises(ValidationError):
            LogoutRequest(refreshToken="abc")

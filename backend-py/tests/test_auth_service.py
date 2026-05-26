"""Unit tests for AuthService with fake repositories.

No real DB. Confirms business rules: role is always `user`, duplicate
emails rejected, refresh rotation revokes the old token, refresh reuse
triggers global revoke.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import pytest

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.services.auth_service import AuthService


# ── Fakes ────────────────────────────────────────────────


class _FakeUserRepo:
    def __init__(self) -> None:
        self.by_id: dict[UUID, User] = {}
        self.by_email: dict[str, User] = {}

    async def email_exists(self, email: str) -> bool:
        return email.lower() in self.by_email

    async def get(self, id: UUID) -> User | None:
        return self.by_id.get(id)

    async def get_by_email(self, email: str) -> User | None:
        return self.by_email.get(email.lower())

    async def add(self, user: User) -> User:
        if user.id is None:
            user.id = uuid4()
        self.by_id[user.id] = user
        self.by_email[user.email] = user
        return user


class _FakeRefreshRepo:
    def __init__(self) -> None:
        self.by_hash: dict[str, RefreshToken] = {}
        self.by_id: dict[UUID, RefreshToken] = {}

    async def create(self, *, user_id, token_hash, expires_at, user_agent=None, ip_address=None):
        token = RefreshToken(
            id=uuid4(),
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        self.by_hash[token_hash] = token
        self.by_id[token.id] = token
        return token

    async def get_by_hash(self, token_hash):
        return self.by_hash.get(token_hash)

    async def revoke(self, token, *, replaced_by_id=None):
        token.revoked_at = datetime.now(UTC)
        if replaced_by_id is not None:
            token.replaced_by_id = replaced_by_id

    async def revoke_all_for_user(self, user_id):
        n = 0
        for t in self.by_hash.values():
            if t.user_id == user_id and t.revoked_at is None:
                t.revoked_at = datetime.now(UTC)
                n += 1
        return n


@pytest.fixture
def service() -> AuthService:
    return AuthService(user_repo=_FakeUserRepo(), refresh_token_repo=_FakeRefreshRepo())  # type: ignore[arg-type]


# ── Register ─────────────────────────────────────────────


@pytest.mark.asyncio
async def test_register_creates_user_with_role_user(service: AuthService) -> None:
    user = await service.register(
        full_name="Ali Valiyev",
        email="ALI@example.com",
        password="secret123",
    )
    assert user.role == UserRole.USER, "role must always default to 'user'"
    assert user.email == "ali@example.com", "email is lowercased"


@pytest.mark.asyncio
async def test_register_rejects_duplicate_email(service: AuthService) -> None:
    await service.register(full_name="A", email="dup@x.com", password="secret123")
    with pytest.raises(ConflictError):
        await service.register(full_name="B", email="dup@x.com", password="other123")


# ── Login ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_login_with_wrong_password_raises(service: AuthService) -> None:
    await service.register(full_name="Ali", email="ali@x.com", password="secret123")
    with pytest.raises(UnauthorizedError):
        await service.login(email="ali@x.com", password="wrong-password")


@pytest.mark.asyncio
async def test_login_for_unknown_email_raises(service: AuthService) -> None:
    with pytest.raises(UnauthorizedError):
        await service.login(email="ghost@x.com", password="whatever")


@pytest.mark.asyncio
async def test_login_returns_tokens(service: AuthService) -> None:
    await service.register(full_name="Ali", email="ali@x.com", password="secret123")
    user, access, refresh = await service.login(email="ali@x.com", password="secret123")
    assert access and refresh
    assert access != refresh


# ── Refresh rotation + reuse detection ───────────────────


@pytest.mark.asyncio
async def test_refresh_rotates_token(service: AuthService) -> None:
    await service.register(full_name="A", email="a@x.com", password="secret123")
    _, _, refresh_1 = await service.login(email="a@x.com", password="secret123")
    _, _, refresh_2 = await service.refresh(refresh_token=refresh_1)
    assert refresh_1 != refresh_2


@pytest.mark.asyncio
async def test_refresh_reuse_revokes_all_user_tokens(service: AuthService) -> None:
    await service.register(full_name="A", email="a@x.com", password="secret123")
    _, _, refresh_1 = await service.login(email="a@x.com", password="secret123")
    # Establish a second active session
    _, _, refresh_other = await service.login(email="a@x.com", password="secret123")

    # First rotation succeeds
    _, _, refresh_1_new = await service.refresh(refresh_token=refresh_1)

    # Reusing the original (now revoked) token must wipe the entire user's sessions
    with pytest.raises(UnauthorizedError):
        await service.refresh(refresh_token=refresh_1)

    # The fresh refresh issued at rotation, AND the unrelated session, are both revoked
    with pytest.raises(UnauthorizedError):
        await service.refresh(refresh_token=refresh_1_new)
    with pytest.raises(UnauthorizedError):
        await service.refresh(refresh_token=refresh_other)


@pytest.mark.asyncio
async def test_refresh_rejects_unknown_token(service: AuthService) -> None:
    with pytest.raises(UnauthorizedError):
        await service.refresh(refresh_token="nonexistent-token-value")


@pytest.mark.asyncio
async def test_refresh_rejects_expired_token(service: AuthService) -> None:
    await service.register(full_name="A", email="a@x.com", password="secret123")
    _, _, refresh = await service.login(email="a@x.com", password="secret123")
    # Forcefully expire it
    repo = service.refresh_tokens
    for t in repo.by_hash.values():  # type: ignore[attr-defined]
        t.expires_at = datetime.now(UTC) - timedelta(minutes=1)
    with pytest.raises(UnauthorizedError):
        await service.refresh(refresh_token=refresh)


# ── Logout ───────────────────────────────────────────────


@pytest.mark.asyncio
async def test_logout_revokes_specific_token(service: AuthService) -> None:
    await service.register(full_name="A", email="a@x.com", password="secret123")
    _, _, refresh = await service.login(email="a@x.com", password="secret123")
    await service.logout(refresh_token=refresh)
    with pytest.raises(UnauthorizedError):
        await service.refresh(refresh_token=refresh)


@pytest.mark.asyncio
async def test_logout_unknown_token_is_silent(service: AuthService) -> None:
    # Should not raise — idempotent
    await service.logout(refresh_token="never-existed")


@pytest.mark.asyncio
async def test_logout_all_revokes_every_active_token(service: AuthService) -> None:
    await service.register(full_name="A", email="a@x.com", password="secret123")
    _, _, r1 = await service.login(email="a@x.com", password="secret123")
    _, _, r2 = await service.login(email="a@x.com", password="secret123")
    user_id = (await service.users.get_by_email("a@x.com")).id  # type: ignore[union-attr]
    revoked = await service.logout_all(user_id=user_id)
    assert revoked == 2
    with pytest.raises(UnauthorizedError):
        await service.refresh(refresh_token=r1)
    with pytest.raises(UnauthorizedError):
        await service.refresh(refresh_token=r2)


# ── Helper: hashed password from register is verifiable ──


def test_password_helpers_compat_with_register() -> None:
    """Confirm hash_password output round-trips."""
    from app.core.security import verify_password

    hashed = hash_password("hello-world")
    assert verify_password("hello-world", hashed) is True

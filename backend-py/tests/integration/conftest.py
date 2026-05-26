"""Integration-test fixtures.

Requires a real PostgreSQL test database. Provide one via the
`TEST_DATABASE_URL` env var, or use the default (matches docker-compose).

Default URL: postgresql+asyncpg://hireup:hireup_dev_password@localhost:5432/hireup_test

Quick setup:
    docker compose up -d postgres
    docker compose exec postgres psql -U hireup -d hireup -c \
        "CREATE DATABASE hireup_test;"

If the DB is unreachable, every integration test is skipped with a clear
message — no failures, no flakiness.
"""

from __future__ import annotations

import os
from collections.abc import AsyncIterator
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.v1.deps import get_db
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.main import app
from app.models import (  # noqa: F401 — register every table on Base.metadata
    Application,
    Job,
    Message,
    RefreshToken,
    SavedJob,
    User,
)
from app.models.enums import (
    ApplicationStatus,
    ExperienceLevel,
    JobCategory,
    JobType,
    LanguageCode,
    UserRole,
)

pytestmark = pytest.mark.integration


TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://hireup:hireup_dev_password@localhost:5432/hireup_test",
)


# ── Engine + schema (session scope) ──────────────────────


@pytest.fixture(scope="session")
async def _test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, future=True, pool_pre_ping=True)

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        await engine.dispose()
        pytest.skip(
            f"Test database unreachable at {TEST_DATABASE_URL}: {exc}",
            allow_module_level=False,
        )

    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


# ── Per-test cleanup ─────────────────────────────────────


@pytest.fixture(autouse=True)
async def _reset_db_after_test(_test_engine) -> AsyncIterator[None]:
    yield
    async with _test_engine.begin() as conn:
        # FK CASCADE handles dependency order, but RESTART IDENTITY needs all tables.
        table_names = ", ".join(f'"{t.name}"' for t in reversed(Base.metadata.sorted_tables))
        await conn.execute(text(f"TRUNCATE TABLE {table_names} RESTART IDENTITY CASCADE"))


# ── DB session for direct setup ──────────────────────────


@pytest.fixture
async def db_session(_test_engine) -> AsyncIterator[AsyncSession]:
    factory = async_sessionmaker(_test_engine, expire_on_commit=False)
    async with factory() as session:
        yield session


# ── HTTP client (overrides root conftest) ────────────────


@pytest.fixture
async def client(_test_engine) -> AsyncIterator[AsyncClient]:
    factory = async_sessionmaker(_test_engine, expire_on_commit=False)

    async def _override_get_db() -> AsyncIterator[AsyncSession]:
        async with factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ── User factories ───────────────────────────────────────


async def _create_user(
    db: AsyncSession,
    *,
    email: str,
    password: str = "secret123",
    role: UserRole = UserRole.USER,
    full_name: str = "Test User",
) -> User:
    user = User(
        full_name=full_name,
        email=email.lower(),
        password_hash=hash_password(password),
        role=role,
        language=LanguageCode.UZ,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
def make_user(db_session: AsyncSession):
    async def _factory(**kwargs: Any) -> tuple[User, str]:
        kwargs.setdefault("email", f"u{_next_id()}@x.com")
        password = kwargs.pop("password", "secret123")
        user = await _create_user(db_session, password=password, **kwargs)
        return user, password

    return _factory


_counter = {"i": 0}


def _next_id() -> int:
    _counter["i"] += 1
    return _counter["i"]


@pytest.fixture
async def regular_user(make_user) -> tuple[User, str]:
    return await make_user(email="user@x.com", role=UserRole.USER, full_name="Regular User")


@pytest.fixture
async def employer_user(make_user) -> tuple[User, str]:
    return await make_user(email="emp@x.com", role=UserRole.EMPLOYER, full_name="Employer One")


@pytest.fixture
async def other_employer(make_user) -> tuple[User, str]:
    return await make_user(email="emp2@x.com", role=UserRole.EMPLOYER, full_name="Employer Two")


@pytest.fixture
async def admin_user(make_user) -> tuple[User, str]:
    return await make_user(email="admin@x.com", role=UserRole.ADMIN, full_name="Admin")


# ── Auth headers ────────────────────────────────────────


def _token_for(user: User) -> dict[str, str]:
    token, _ = create_access_token(user.id, role=user.role.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers(regular_user):
    user, _ = regular_user
    return _token_for(user)


@pytest.fixture
def employer_headers(employer_user):
    user, _ = employer_user
    return _token_for(user)


@pytest.fixture
def other_employer_headers(other_employer):
    user, _ = other_employer
    return _token_for(user)


@pytest.fixture
def admin_headers(admin_user):
    user, _ = admin_user
    return _token_for(user)


# ── Job factory ──────────────────────────────────────────


@pytest.fixture
def make_job(db_session: AsyncSession):
    async def _factory(
        *,
        creator: User,
        title: str = "Backend Engineer",
        category: JobCategory = JobCategory.IT,
        location: str = "Tashkent",
        is_active: bool = True,
        salary_min: int = 1000,
        salary_max: int = 3000,
        skills: list[str] | None = None,
        experience: ExperienceLevel = ExperienceLevel.MID,
        job_type: JobType = JobType.FULL_TIME,
    ) -> Job:
        job = Job(
            title=title,
            company="HireUp",
            location=location,
            description="Build APIs",
            category=category,
            created_by=creator.id,
            is_active=is_active,
            salary_min=salary_min,
            salary_max=salary_max,
            salary_currency="USD",
            requirements=["Python", "FastAPI"],
            skills=skills or ["python"],
            experience=experience,
            job_type=job_type,
        )
        db_session.add(job)
        await db_session.commit()
        await db_session.refresh(job)
        return job

    return _factory


# ── Application factory ──────────────────────────────────


@pytest.fixture
def make_application(db_session: AsyncSession):
    async def _factory(
        *,
        applicant: User,
        job: Job,
        status: ApplicationStatus = ApplicationStatus.PENDING,
    ) -> Application:
        application = Application(
            user_id=applicant.id,
            job_id=job.id,
            cover_letter="Please consider me",
            phone="+998901234567",
            status=status,
        )
        db_session.add(application)
        await db_session.commit()
        await db_session.refresh(application)
        return application

    return _factory

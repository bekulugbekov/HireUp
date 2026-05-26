"""Async engine, session factory, and a get_db dependency for FastAPI.

Tuning notes:
- `pool_pre_ping` issues a cheap SELECT 1 before checkout so stale
  connections (e.g. recycled by the DB) are detected up-front.
- `pool_recycle` proactively reopens connections older than the limit,
  side-stepping PgBouncer / Postgres idle-timeout drops.
- `statement_timeout` is set per-connection via asyncpg's
  `server_settings`, capping any single query at the configured ms.
- `application_name` makes long-running queries identifiable in
  `pg_stat_activity` during incident response.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

engine: AsyncEngine = create_async_engine(
    settings.sqlalchemy_database_uri,
    echo=settings.app_debug,
    future=True,
    pool_pre_ping=True,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_recycle=settings.db_pool_recycle_seconds,
    connect_args={
        "server_settings": {
            "application_name": f"{settings.app_name.lower()}-api",
            "statement_timeout": str(settings.db_statement_timeout_ms),
        }
    },
)

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
    class_=AsyncSession,
)


async def get_db() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency that yields an `AsyncSession`.

    Commits on a clean exit, rolls back on any raised exception, and always
    closes the session.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

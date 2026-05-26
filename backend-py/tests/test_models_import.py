"""Verify every ORM model is registered with Base.metadata.

This is a cheap guardrail: a typo in a model module would silently
exclude it from Alembic autogenerate.
"""

from __future__ import annotations

from app.db.base import Base
from app.models import (
    Application,
    Job,
    Message,
    RefreshToken,
    SavedJob,
    User,
)

EXPECTED_TABLES = {
    "users",
    "jobs",
    "applications",
    "messages",
    "saved_jobs",
    "refresh_tokens",
}


def test_all_tables_registered() -> None:
    registered = set(Base.metadata.tables.keys())
    missing = EXPECTED_TABLES - registered
    assert not missing, f"Missing tables in metadata: {missing}"


def test_model_table_names() -> None:
    assert User.__tablename__ == "users"
    assert Job.__tablename__ == "jobs"
    assert Application.__tablename__ == "applications"
    assert Message.__tablename__ == "messages"
    assert SavedJob.__tablename__ == "saved_jobs"
    assert RefreshToken.__tablename__ == "refresh_tokens"


def test_application_unique_constraint() -> None:
    cons = {c.name for c in Application.__table__.constraints if c.name}
    assert "uq_applications_user_job" in cons


def test_message_self_check_constraint() -> None:
    cons = {c.name for c in Message.__table__.constraints if c.name}
    assert "ck_messages_no_self_message" in cons


def test_saved_job_composite_primary_key() -> None:
    pk_cols = {c.name for c in SavedJob.__table__.primary_key.columns}
    assert pk_cols == {"user_id", "job_id"}

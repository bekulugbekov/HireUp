"""ORM model registry.

Importing this package registers every model with `Base.metadata`, which
is required for Alembic autogenerate and `create_all` in tests.
"""

from app.models.application import Application
from app.models.enums import (
    ApplicationStatus,
    ExperienceLevel,
    JobCategory,
    JobType,
    LanguageCode,
    UserRole,
)
from app.models.job import Job
from app.models.message import Message
from app.models.refresh_token import RefreshToken
from app.models.saved_job import SavedJob
from app.models.user import User

__all__ = [
    "Application",
    "ApplicationStatus",
    "ExperienceLevel",
    "Job",
    "JobCategory",
    "JobType",
    "LanguageCode",
    "Message",
    "RefreshToken",
    "SavedJob",
    "User",
    "UserRole",
]

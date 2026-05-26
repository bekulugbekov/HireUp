"""Domain enums shared by ORM models and Pydantic schemas.

Values match the Mongoose enum values from the Node.js backend exactly
(including hyphens, e.g. 'no-experience'), so the existing frontend keeps
working without any client-side mapping.
"""

from __future__ import annotations

from enum import StrEnum


class UserRole(StrEnum):
    USER = "user"
    EMPLOYER = "employer"
    ADMIN = "admin"


class LanguageCode(StrEnum):
    UZ = "uz"
    RU = "ru"
    EN = "en"


class JobCategory(StrEnum):
    IT = "IT"
    MARKETING = "Marketing"
    DESIGN = "Design"
    FINANCE = "Finance"
    EDUCATION = "Education"
    HEALTHCARE = "Healthcare"
    ENGINEERING = "Engineering"
    SALES = "Sales"
    OTHER = "Other"


class ExperienceLevel(StrEnum):
    NO_EXPERIENCE = "no-experience"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"


class JobType(StrEnum):
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    REMOTE = "remote"
    CONTRACT = "contract"
    INTERNSHIP = "internship"


class ApplicationStatus(StrEnum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


PG_ENUM_NAMES: dict[str, type[StrEnum]] = {
    "user_role": UserRole,
    "lang_code": LanguageCode,
    "job_category": JobCategory,
    "experience_level": ExperienceLevel,
    "job_type": JobType,
    "application_status": ApplicationStatus,
}

"""Job request schemas (responses are built with serialization helpers)."""

from __future__ import annotations

from pydantic import Field

from app.models.enums import ExperienceLevel, JobCategory, JobType
from app.schemas.common import CamelModel


class SalaryInput(CamelModel):
    min: int = Field(default=0, ge=0)
    max: int = Field(default=0, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)


class ContactInput(CamelModel):
    phone: str | None = None
    telegram: str | None = None
    website: str | None = None


class JobCreate(CamelModel):
    title: str = Field(min_length=2, max_length=200)
    company: str = Field(min_length=1, max_length=150)
    location: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1)
    salary: SalaryInput = Field(default_factory=SalaryInput)
    requirements: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    category: JobCategory
    experience: ExperienceLevel = ExperienceLevel.JUNIOR
    job_type: JobType = Field(default=JobType.FULL_TIME, alias="type")
    contact: ContactInput = Field(default_factory=ContactInput)


class JobUpdate(CamelModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    company: str | None = Field(default=None, min_length=1, max_length=150)
    location: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, min_length=1)
    salary: SalaryInput | None = None
    requirements: list[str] | None = None
    skills: list[str] | None = None
    category: JobCategory | None = None
    experience: ExperienceLevel | None = None
    job_type: JobType | None = Field(default=None, alias="type")
    contact: ContactInput | None = None
    is_active: bool | None = None

"""Helpers for turning ORM rows into the camelCase dicts the frontend expects.

Two reasons we serialize by hand instead of relying on Pydantic
``from_attributes`` end-to-end:

1. Flat → nested mapping: ``salary_min/max/currency`` columns must surface
   as a nested ``salary: {min, max, currency}`` object to match the
   existing Mongoose response shape.
2. Conditional population: relationships like ``Job.creator`` may or may
   not be eagerly loaded depending on the route — these helpers handle
   both cases without triggering implicit lazy I/O in async sessions.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import inspect

from app.models.application import Application
from app.models.job import Job
from app.models.message import Message
from app.models.user import User


def _iso(value: Any) -> Any:
    return value.isoformat() if hasattr(value, "isoformat") else value


def _is_loaded(instance: Any, attr: str) -> bool:
    """True if a SQLAlchemy relationship is eager-loaded on this instance."""
    state = inspect(instance)
    return attr not in state.unloaded


# ── User ─────────────────────────────────────────────────


def user_brief_dict(user: User, *, with_contact: bool = False) -> dict:
    """Used inside populated jobs / applications. Mirrors `populate('createdBy', 'fullName email avatar')`."""
    data = {
        "_id": str(user.id),
        "fullName": user.full_name,
        "email": user.email,
        "avatar": user.avatar or "",
    }
    if with_contact:
        data["phone"] = user.phone or ""
        data["telegram"] = user.telegram or ""
    return data


def user_full_dict(user: User, *, saved_job_ids: list[UUID] | None = None) -> dict:
    """Full user shape returned by /me and admin endpoints. NEVER includes password."""
    return {
        "_id": str(user.id),
        "fullName": user.full_name,
        "email": user.email,
        "role": user.role.value,
        "language": user.language.value,
        "avatar": user.avatar or "",
        "phone": user.phone or "",
        "telegram": user.telegram or "",
        "bio": user.bio or "",
        "title": user.title or "",
        "savedJobs": [str(j) for j in (saved_job_ids or [])],
        "createdAt": _iso(user.created_at),
        "updatedAt": _iso(user.updated_at),
    }


# ── Job ──────────────────────────────────────────────────


def job_dict(job: Job, *, creator_with_contact: bool = False) -> dict:
    """Standard job shape — embedded salary / contact, optional populated creator."""
    if _is_loaded(job, "creator") and job.creator is not None:
        created_by: dict | str = user_brief_dict(job.creator, with_contact=creator_with_contact)
    else:
        created_by = str(job.created_by)

    return {
        "_id": str(job.id),
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "description": job.description,
        "salary": {
            "min": job.salary_min,
            "max": job.salary_max,
            "currency": job.salary_currency,
        },
        "requirements": list(job.requirements or []),
        "skills": list(job.skills or []),
        "category": job.category.value,
        "experience": job.experience.value,
        "type": job.job_type.value,
        "contact": {
            "phone": job.contact_phone or "",
            "telegram": job.contact_telegram or "",
            "website": job.contact_website or "",
        },
        "viewCount": job.view_count,
        "isActive": job.is_active,
        "createdBy": created_by,
        "createdAt": _iso(job.created_at),
        "updatedAt": _iso(job.updated_at),
    }


def job_brief_dict(job: Job) -> dict:
    """Reduced job shape — used inside applications/messages where the full description is noise."""
    return {
        "_id": str(job.id),
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "salary": {
            "min": job.salary_min,
            "max": job.salary_max,
            "currency": job.salary_currency,
        },
        "type": job.job_type.value,
        "contact": {
            "phone": job.contact_phone or "",
            "telegram": job.contact_telegram or "",
            "website": job.contact_website or "",
        },
    }


# ── Application ──────────────────────────────────────────


def application_dict(
    application: Application,
    *,
    populate_user: bool = False,
    populate_job: bool = False,
) -> dict:
    data: dict = {
        "_id": str(application.id),
        "user": (
            user_brief_dict(application.user, with_contact=True)
            if populate_user and _is_loaded(application, "user") and application.user is not None
            else str(application.user_id)
        ),
        "job": (
            job_brief_dict(application.job)
            if populate_job and _is_loaded(application, "job") and application.job is not None
            else str(application.job_id)
        ),
        "resume": application.resume or "",
        "coverLetter": application.cover_letter or "",
        "phone": application.phone or "",
        "telegram": application.telegram or "",
        "status": application.status.value,
        "createdAt": _iso(application.created_at),
        "updatedAt": _iso(application.updated_at),
    }
    return data


# ── Message ──────────────────────────────────────────────


def message_dict(message: Message) -> dict:
    """Full message with populated sender, receiver, and optional job."""
    sender = (
        user_brief_dict(message.sender)
        if _is_loaded(message, "sender") and message.sender is not None
        else str(message.sender_id)
    )
    receiver = (
        user_brief_dict(message.receiver)
        if _is_loaded(message, "receiver") and message.receiver is not None
        else str(message.receiver_id)
    )
    job_data: Any
    if message.job_id is None:
        job_data = None
    elif _is_loaded(message, "job") and message.job is not None:
        job_data = {
            "_id": str(message.job.id),
            "title": message.job.title,
            "company": message.job.company,
        }
    else:
        job_data = str(message.job_id)

    return {
        "_id": str(message.id),
        "sender": sender,
        "receiver": receiver,
        "job": job_data,
        "content": message.content,
        "isRead": message.is_read,
        "createdAt": _iso(message.created_at),
        "updatedAt": _iso(message.updated_at),
    }

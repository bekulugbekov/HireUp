"""User business logic — profile, password, saved jobs, admin actions."""

from __future__ import annotations

from typing import Sequence
from uuid import UUID

from sqlalchemy import func, select

from app.core.exceptions import NotFoundError, ValidationError
from app.core.security import hash_password, verify_password
from app.models.application import Application
from app.models.enums import UserRole
from app.models.job import Job
from app.models.user import User
from app.repositories.job_repository import JobRepository
from app.repositories.saved_job_repository import SavedJobRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user_profile import ProfileUpdate


class UserService:
    def __init__(
        self,
        *,
        user_repo: UserRepository,
        job_repo: JobRepository,
        saved_job_repo: SavedJobRepository,
    ) -> None:
        self.users = user_repo
        self.jobs = job_repo
        self.saved_jobs = saved_job_repo

    # ── Profile ──────────────────────────────────────────

    async def update_profile(self, *, user: User, payload: ProfileUpdate) -> User:
        data = payload.model_dump(exclude_unset=True, by_alias=False)
        if "full_name" in data and data["full_name"] is not None:
            user.full_name = data["full_name"].strip()
        if "language" in data and data["language"] is not None:
            user.language = data["language"]
        if "phone" in data:
            user.phone = (data["phone"] or "").strip() or None
        if "telegram" in data:
            user.telegram = (data["telegram"] or "").strip() or None
        if "bio" in data:
            user.bio = data["bio"] or None
        if "title" in data:
            user.title = (data["title"] or "").strip() or None
        if "avatar" in data and data["avatar"] is not None:
            user.avatar = data["avatar"]
        await self.users.session.flush()
        await self.users.session.refresh(user)
        return user

    async def change_password(
        self,
        *,
        user: User,
        current_password: str,
        new_password: str,
    ) -> None:
        if not verify_password(current_password, user.password_hash):
            raise ValidationError("auth.wrongPassword")
        user.password_hash = hash_password(new_password)
        await self.users.session.flush()

    # ── Saved jobs ───────────────────────────────────────

    async def toggle_saved_job(self, *, user: User, job_id: UUID) -> list[UUID]:
        job = await self.jobs.get(job_id)
        if job is None:
            raise NotFoundError("job.notFound")
        # Bug #14 fix: atomic toggle via INSERT … ON CONFLICT in the repo.
        await self.saved_jobs.toggle(user.id, job_id)
        return await self.saved_jobs.list_job_ids_for_user(user.id)

    async def list_saved_jobs(self, *, user: User) -> Sequence[Job]:
        return await self.saved_jobs.list_jobs_for_user(user.id)

    # ── Admin ────────────────────────────────────────────

    async def list_all(
        self,
        *,
        page: int,
        limit: int,
    ) -> tuple[Sequence[User], int]:
        return await self.users.list_paginated(offset=(page - 1) * limit, limit=limit)

    async def delete_user(self, user_id: UUID) -> None:
        user = await self.users.get(user_id)
        if user is None:
            raise NotFoundError("user.notFound")
        await self.users.delete(user)

    async def stats(self) -> dict:
        session = self.users.session
        total_users = int(await session.scalar(select(func.count()).select_from(User)) or 0)
        total_jobs = int(await session.scalar(select(func.count()).select_from(Job)) or 0)
        total_applications = int(
            await session.scalar(select(func.count()).select_from(Application)) or 0
        )

        role_rows = await session.execute(
            select(User.role, func.count()).group_by(User.role)
        )
        by_role = [
            {"_id": (role.value if hasattr(role, "value") else role), "count": int(count)}
            for role, count in role_rows
        ]

        category_rows = await session.execute(
            select(Job.category, func.count()).group_by(Job.category)
        )
        by_category = [
            {"_id": (cat.value if hasattr(cat, "value") else cat), "count": int(count)}
            for cat, count in category_rows
        ]

        return {
            "totalUsers": total_users,
            "totalJobs": total_jobs,
            "totalApplications": total_applications,
            "byRole": by_role,
            "byCategory": by_category,
        }

    @staticmethod
    def is_admin(user: User) -> bool:
        return user.role == UserRole.ADMIN

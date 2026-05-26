"""Aggregates every v1 sub-router and exposes a single APIRouter."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.routers import applications, auth, health, jobs, messages, users

api_router = APIRouter(prefix="/api")

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(jobs.router)
api_router.include_router(applications.router)
api_router.include_router(users.router)
api_router.include_router(messages.router)

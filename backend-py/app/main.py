"""FastAPI application factory.

Middleware order (outermost first):
    1. SecurityHeadersMiddleware  — set Helmet-equivalent headers
    2. RequestIDMiddleware        — bind X-Request-ID for logs
    3. BodySizeLimitMiddleware    — reject oversized payloads early
    4. GZipMiddleware             — compress responses
    5. CORSMiddleware             — origin allowlist
    6. TrustedHostMiddleware      — accept only configured Host headers
    7. SlowAPIMiddleware          — request-rate enforcement

Static `/uploads` is mounted only in non-production. In production, Nginx
(or an S3 + CDN combo) should serve uploaded files.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import AppError
from app.core.i18n import Translator, parse_accept_language
from app.core.logging import configure_logging
from app.core.rate_limits import limiter
from app.middleware.body_size_limit import BodySizeLimitMiddleware
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware

configure_logging()
log = structlog.get_logger(__name__)


OPENAPI_TAGS = [
    {"name": "Health", "description": "Liveness and readiness probes."},
    {"name": "Auth", "description": "Registration, login, JWT refresh, logout."},
    {"name": "Jobs", "description": "Job posting CRUD, filtering, and search."},
    {"name": "Applications", "description": "Apply, view, and manage applications."},
    {"name": "Users", "description": "Profile, password, saved jobs, admin actions."},
    {"name": "Messages", "description": "Direct messaging between users."},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info(
        "app.startup",
        env=settings.app_env,
        debug=settings.app_debug,
        cors_origins=settings.cors_origins or ["*"],
    )
    yield
    log.info("app.shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title=f"{settings.app_name} API",
        version="1.0.0",
        description="HireUp Job Platform — FastAPI backend",
        lifespan=lifespan,
        docs_url="/api-docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        openapi_tags=OPENAPI_TAGS,
        redirect_slashes=False,
    )

    # ── Middleware (outermost-first) ────────────────────────
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(BodySizeLimitMiddleware, max_bytes=settings.body_max_bytes)
    app.add_middleware(GZipMiddleware, minimum_size=settings.gzip_minimum_size)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    if settings.trusted_hosts and settings.trusted_hosts != ["*"]:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)

    # ── Exception handlers ─────────────────────────────────
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        t = Translator(parse_accept_language(request.headers.get("accept-language")))
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.message or t(exc.message_key),
                **({"details": exc.details} if exc.details is not None else {}),
            },
        )

    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ── Routes ─────────────────────────────────────────────
    app.include_router(api_router)

    if settings.app_env in ("development", "test"):
        app.mount(
            "/uploads",
            StaticFiles(directory=str(settings.upload_path)),
            name="uploads",
        )

    return app


app = create_app()

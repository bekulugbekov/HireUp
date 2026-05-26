"""Application-wide exception hierarchy.

Routers and services raise these instead of returning HTTP responses directly.
A single exception handler in `app.main` translates them into the unified
`{success, message, ...}` response envelope expected by the frontend.
"""

from typing import Any


class AppError(Exception):
    """Base for all expected application errors."""

    status_code: int = 500
    default_message_key: str = "server.error"

    def __init__(
        self,
        message_key: str | None = None,
        *,
        message: str | None = None,
        details: Any = None,
    ) -> None:
        self.message_key = message_key or self.default_message_key
        self.message = message
        self.details = details
        super().__init__(message or self.message_key)


class NotFoundError(AppError):
    status_code = 404
    default_message_key = "common.notFound"


class UnauthorizedError(AppError):
    status_code = 401
    default_message_key = "auth.unauthorized"


class ForbiddenError(AppError):
    status_code = 403
    default_message_key = "auth.forbidden"


class ConflictError(AppError):
    status_code = 409
    default_message_key = "common.conflict"


class ValidationError(AppError):
    status_code = 400
    default_message_key = "validation.failed"


class RateLimitError(AppError):
    status_code = 429
    default_message_key = "common.rateLimited"

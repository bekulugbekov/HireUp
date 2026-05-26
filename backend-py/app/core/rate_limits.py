"""Centralised slowapi limiter and per-endpoint limit constants.

Lives in `core` so both `app.main` (which wires the middleware) and the
individual routers (which decorate handlers) can import it without
creating a circular dependency on `app.main`.
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.rate_limit_per_minute}/minute"],
)

# Stricter limits for sensitive endpoints. Strings use slowapi syntax.
LOGIN_LIMIT = settings.login_rate_limit
REGISTER_LIMIT = settings.register_rate_limit
REFRESH_LIMIT = settings.refresh_rate_limit

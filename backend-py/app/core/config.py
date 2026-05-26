"""Application configuration loaded from environment variables.

All settings are validated at import time via Pydantic. If a required
variable is missing or malformed, the process refuses to start — surfacing
config errors loudly rather than at the first request.
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


def _parse_str_list(value: str, *, default: list[str] | None = None) -> list[str]:
    """Parse a list from a plain string, comma-separated string, or JSON array string.

    Accepts any of:
      - ``["a","b"]``   (JSON array — pydantic-settings v2 blueprint format)
      - ``a,b``         (comma-separated)
      - ``a``           (single value)
    """
    v = (value or "").strip()
    if not v:
        return default if default is not None else []
    if v.startswith("["):
        try:
            result = json.loads(v)
            if isinstance(result, list):
                return [str(x).strip() for x in result if str(x).strip()]
        except (json.JSONDecodeError, ValueError):
            pass
    return [x.strip() for x in v.split(",") if x.strip()]

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────
    app_name: str = "HireUp"
    app_env: Literal["development", "staging", "production", "test"] = "development"
    app_debug: bool = False
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # ── CORS ─────────────────────────────────────────────
    # Stored as raw string so pydantic-settings v2 does NOT attempt JSON-decode.
    # Use the `cors_origins` property everywhere — it handles JSON arrays,
    # comma-separated values, and plain single-origin strings transparently.
    cors_origins_raw: str = Field(default="", alias="cors_origins")

    # ── Database ─────────────────────────────────────────
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_user: str = "hireup"
    postgres_password: str = "hireup"
    postgres_db: str = "hireup"
    database_url: PostgresDsn | None = None

    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_recycle_seconds: int = 1800
    db_statement_timeout_ms: int = 10_000

    @property
    def sqlalchemy_database_uri(self) -> str:
        if self.database_url is not None:
            # Render (and Heroku) supply postgres:// or postgresql:// but
            # asyncpg requires the postgresql+asyncpg:// scheme.
            url = str(self.database_url)
            if url.startswith("postgres://"):
                url = "postgresql+asyncpg://" + url[len("postgres://"):]
            elif url.startswith("postgresql://"):
                url = "postgresql+asyncpg://" + url[len("postgresql://"):]
            return url
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    # ── JWT ──────────────────────────────────────────────
    jwt_secret: str = Field(min_length=16)
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440
    jwt_refresh_token_expire_days: int = 30

    # ── Bcrypt ───────────────────────────────────────────
    bcrypt_rounds: int = 12

    # ── Uploads ──────────────────────────────────────────
    upload_dir: str = "uploads"
    upload_max_bytes: int = 5 * 1024 * 1024

    @property
    def upload_path(self) -> Path:
        path = BASE_DIR / self.upload_dir
        path.mkdir(parents=True, exist_ok=True)
        return path

    # ── Rate limiting ────────────────────────────────────
    rate_limit_per_minute: int = 100
    login_rate_limit: str = "10/minute"
    register_rate_limit: str = "5/minute"
    refresh_rate_limit: str = "30/minute"

    # ── HTTP hardening ───────────────────────────────────
    # Same raw-string pattern as cors_origins_raw — see note above.
    trusted_hosts_raw: str = Field(default="*", alias="trusted_hosts")
    body_max_bytes: int = 10 * 1024 * 1024  # JSON / form bodies (uploads enforced separately)
    gzip_minimum_size: int = 1024

    # ── Logging ──────────────────────────────────────────
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    # ── i18n ─────────────────────────────────────────────
    default_language: Literal["uz", "ru", "en"] = "uz"

    # ── Computed list properties ──────────────────────────
    # These parse the raw string fields so callers get list[str] without
    # pydantic-settings ever attempting a JSON-decode on the env var.

    @property
    def cors_origins(self) -> list[str]:
        return _parse_str_list(self.cors_origins_raw)

    @property
    def trusted_hosts(self) -> list[str]:
        return _parse_str_list(self.trusted_hosts_raw, default=["*"])


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()

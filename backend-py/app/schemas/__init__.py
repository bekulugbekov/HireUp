"""Public Pydantic schemas."""

from app.schemas.application import ApplicationStatusUpdate
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    LogoutRequest,
    MeResponse,
    MessageOnlyResponse,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
)
from app.schemas.common import (
    CamelModel,
    ErrorEnvelope,
    LimitQuery,
    PageQuery,
    PaginationMeta,
    ResponseEnvelope,
)
from app.schemas.job import (
    ContactInput,
    JobCreate,
    JobUpdate,
    SalaryInput,
)
from app.schemas.message import SendMessageRequest
from app.schemas.user import UserMe, UserPublic
from app.schemas.user_profile import ChangePasswordRequest, ProfileUpdate

__all__ = [
    "ApplicationStatusUpdate",
    "AuthResponse",
    "CamelModel",
    "ChangePasswordRequest",
    "ContactInput",
    "ErrorEnvelope",
    "JobCreate",
    "JobUpdate",
    "LimitQuery",
    "LoginRequest",
    "LogoutRequest",
    "MeResponse",
    "MessageOnlyResponse",
    "PageQuery",
    "PaginationMeta",
    "ProfileUpdate",
    "RefreshRequest",
    "RefreshResponse",
    "RegisterRequest",
    "ResponseEnvelope",
    "SalaryInput",
    "SendMessageRequest",
    "UserMe",
    "UserPublic",
]

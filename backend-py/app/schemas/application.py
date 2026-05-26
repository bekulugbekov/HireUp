"""Application request schemas.

The apply request comes in as multipart/form-data (resume file + text
fields), so there is no JSON body schema for it — fields are validated
per-parameter in the router.
"""

from __future__ import annotations

from app.models.enums import ApplicationStatus
from app.schemas.common import CamelModel


class ApplicationStatusUpdate(CamelModel):
    status: ApplicationStatus

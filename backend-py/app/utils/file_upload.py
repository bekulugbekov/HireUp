"""Validate and persist uploaded files.

- Filenames are random UUIDs (Phase 1 bug #4 partial fix: not guessable).
- MIME type sniffed via python-magic (Phase 1 bug from Multer that only
  checked the extension).
- Size limit enforced against the buffered bytes.
"""

from __future__ import annotations

from pathlib import Path
from uuid import uuid4

import magic
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import ValidationError

# ── Allowed MIME types per upload kind ───────────────────

RESUME_MIME_TYPES: frozenset[str] = frozenset({
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
})

AVATAR_MIME_TYPES: frozenset[str] = frozenset({
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
})

# Map MIME → preferred file extension (we ignore the client-supplied one)
_MIME_EXTENSIONS: dict[str, str] = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


async def save_upload(
    file: UploadFile,
    *,
    allowed_mime_types: frozenset[str],
    subfolder: str = "",
    max_bytes: int | None = None,
) -> str:
    """Save the upload, return the URL path relative to the app root.

    Example return value: ``uploads/avatars/3f9c0a...e8.png`` — directly
    usable as the value of a ``<img src=...>`` or response field, matching
    the Node.js convention of storing relative paths in the DB.
    """
    limit = max_bytes if max_bytes is not None else settings.upload_max_bytes

    data = await file.read()
    if len(data) > limit:
        raise ValidationError("validation.fileTooLarge")

    detected_mime = magic.from_buffer(data, mime=True)
    if detected_mime not in allowed_mime_types:
        raise ValidationError("validation.invalidFileType")

    extension = _MIME_EXTENSIONS.get(detected_mime, Path(file.filename or "").suffix.lower())
    filename = f"{uuid4().hex}{extension}"

    target_dir = settings.upload_path / subfolder if subfolder else settings.upload_path
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / filename
    target_path.write_bytes(data)

    relative = target_path.relative_to(settings.upload_path.parent).as_posix()
    return relative

"""Reject requests whose Content-Length exceeds a configured cap.

This is a cheap pre-filter — it only inspects the header. For uploads
that stream past the limit without declaring Content-Length, the
upload util in `app.utils.file_upload` enforces a second cap on the
read bytes.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, *, max_bytes: int) -> None:
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                if int(content_length) > self.max_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "success": False,
                            "message": "Request body too large",
                        },
                    )
            except ValueError:
                pass
        return await call_next(request)

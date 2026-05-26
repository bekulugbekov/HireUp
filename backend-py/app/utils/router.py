"""Custom APIRouter that defaults to camelCase serialization.

Saves us from spelling `response_model_by_alias=True` on every endpoint.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter


class CamelRouter(APIRouter):
    def add_api_route(self, *args: Any, **kwargs: Any) -> None:
        kwargs.setdefault("response_model_by_alias", True)
        super().add_api_route(*args, **kwargs)

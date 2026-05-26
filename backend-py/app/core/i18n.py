"""Translation helper compatible with the existing Node.js locale JSONs.

Locale files are loaded once at import time from `app/locales/<lang>.json`.
Translator resolves dot-notation keys like `auth.invalidCredentials` and
falls back to the default language, then to the raw key if nothing matches.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.core.config import settings

SUPPORTED_LANGUAGES: tuple[str, ...] = ("uz", "ru", "en")

_LOCALES_DIR = Path(__file__).resolve().parent.parent / "locales"
_translations: dict[str, dict[str, Any]] = {}


def _load_locales() -> None:
    for lang in SUPPORTED_LANGUAGES:
        file = _LOCALES_DIR / f"{lang}.json"
        if file.is_file():
            with file.open(encoding="utf-8") as f:
                _translations[lang] = json.load(f)
        else:
            _translations[lang] = {}


_load_locales()


def _resolve(d: dict[str, Any], key: str) -> str | None:
    parts = key.split(".")
    node: Any = d
    for part in parts:
        if not isinstance(node, dict) or part not in node:
            return None
        node = node[part]
    return node if isinstance(node, str) else None


class Translator:
    """Resolve a key in the chosen language, falling back to the default."""

    __slots__ = ("language",)

    def __init__(self, language: str) -> None:
        self.language = language if language in SUPPORTED_LANGUAGES else settings.default_language

    def __call__(self, key: str, **kwargs: Any) -> str:
        text = _resolve(_translations.get(self.language, {}), key)
        if text is None and self.language != settings.default_language:
            text = _resolve(_translations.get(settings.default_language, {}), key)
        if text is None:
            text = key
        return text.format(**kwargs) if kwargs else text


def parse_accept_language(header: str | None) -> str:
    """Pick the first supported language from an Accept-Language header.

    Honors the simplified rule used by the Node.js backend — read the raw
    header value, otherwise fall back to settings.default_language.
    """
    if not header:
        return settings.default_language
    candidate = header.split(",")[0].strip().split("-")[0].lower()
    return candidate if candidate in SUPPORTED_LANGUAGES else settings.default_language

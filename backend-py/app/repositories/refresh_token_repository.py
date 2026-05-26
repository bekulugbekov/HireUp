"""Refresh-token storage with rotation + reuse detection support."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select, update

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, session) -> None:
        self.session = session

    async def create(
        self,
        *,
        user_id: UUID,
        token_hash: str,
        expires_at: datetime,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> RefreshToken:
        token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        self.session.add(token)
        await self.session.flush()
        return token

    async def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        result = await self.session.scalars(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.first()

    async def revoke(self, token: RefreshToken, *, replaced_by_id: UUID | None = None) -> None:
        token.revoked_at = datetime.now(UTC)
        if replaced_by_id is not None:
            token.replaced_by_id = replaced_by_id
        await self.session.flush()

    async def revoke_all_for_user(self, user_id: UUID) -> int:
        result = await self.session.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=datetime.now(UTC))
        )
        return result.rowcount or 0

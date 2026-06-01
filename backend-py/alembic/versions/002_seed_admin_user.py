"""seed_admin_user

Revision ID: 002
Revises: 001_initial_schema
Create Date: 2026-05-26

Inserts a default admin user on first deploy.
Password: Admin@12345  (change after first login!)
Uses ON CONFLICT DO NOTHING — safe to run multiple times.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "002"
down_revision: str | Sequence[str] | None = "001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# bcrypt hash of "Admin@12345" (rounds=12)
_ADMIN_PASSWORD_HASH = "$2b$12$9zdtgPSfaG6w9yVqV7pWveFBwXl60BChaAemYHSRCxDzOiON03RRG"


def upgrade() -> None:
    op.execute(
        f"""
        INSERT INTO users (full_name, email, password_hash, role, language, is_active)
        VALUES (
            'Admin',
            'admin@hireup.uz',
            '{_ADMIN_PASSWORD_HASH}',
            'admin',
            'uz',
            true
        )
        ON CONFLICT (email) DO NOTHING;
        """
    )


def downgrade() -> None:
    op.execute("DELETE FROM users WHERE email = 'admin@hireup.uz';")

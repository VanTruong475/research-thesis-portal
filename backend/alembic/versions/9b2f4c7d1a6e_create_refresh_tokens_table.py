"""create refresh tokens table

Revision ID: 9b2f4c7d1a6e
Revises: 70eec2ac9b85
Create Date: 2026-08-06 00:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "9b2f4c7d1a6e"
down_revision: str | None = "70eec2ac9b85"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("replaced_by_token_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_ip", postgresql.INET(), nullable=True),
        sa.Column("user_agent", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["replaced_by_token_id"], ["refresh_tokens.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("refresh_tokens_user_idx", "refresh_tokens", ["user_id"])
    op.create_index("refresh_tokens_expires_at_idx", "refresh_tokens", ["expires_at"])
    op.create_index("refresh_tokens_revoked_at_idx", "refresh_tokens", ["revoked_at"])
    op.create_index(
        "refresh_tokens_active_idx",
        "refresh_tokens",
        ["user_id", "expires_at"],
        postgresql_where=sa.text("revoked_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("refresh_tokens_active_idx", table_name="refresh_tokens")
    op.drop_index("refresh_tokens_revoked_at_idx", table_name="refresh_tokens")
    op.drop_index("refresh_tokens_expires_at_idx", table_name="refresh_tokens")
    op.drop_index("refresh_tokens_user_idx", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")

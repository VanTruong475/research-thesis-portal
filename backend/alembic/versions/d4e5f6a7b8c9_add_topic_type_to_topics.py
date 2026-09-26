"""add topic_type to topics

Revision ID: d4e5f6a7b8c9
Revises: 663056e13f16
Create Date: 2026-09-26 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6a7b8c9"
down_revision: str | None = "663056e13f16"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    topic_type_enum = sa.Enum(
        "graduation_thesis",
        "scientific_research",
        name="topic_type",
    )
    topic_type_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "topics",
        sa.Column(
            "topic_type",
            topic_type_enum,
            server_default="graduation_thesis",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("topics", "topic_type")

    topic_type_enum = sa.Enum(
        "graduation_thesis",
        "scientific_research",
        name="topic_type",
    )
    topic_type_enum.drop(op.get_bind(), checkfirst=True)

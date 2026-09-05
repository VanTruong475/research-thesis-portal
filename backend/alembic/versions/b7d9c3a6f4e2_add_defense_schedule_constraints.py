"""add defense schedule constraints

Revision ID: b7d9c3a6f4e2
Revises: a1f4d9c2e8b7
Create Date: 2026-09-04 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b7d9c3a6f4e2"
down_revision: str | None = "a1f4d9c2e8b7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_defense_schedules_registration",
        "defense_schedules",
        ["registration_id"],
    )
    op.create_check_constraint(
        "defense_schedule_duration_positive",
        "defense_schedules",
        "duration_minutes > 0",
    )
    op.create_check_constraint(
        "defense_schedule_presentation_order_positive",
        "defense_schedules",
        "presentation_order IS NULL OR presentation_order >= 1",
    )
    op.create_index(
        "uq_defense_schedules_council_presentation_order",
        "defense_schedules",
        ["council_id", "presentation_order"],
        unique=True,
        postgresql_where=sa.text("presentation_order IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_defense_schedules_council_presentation_order",
        table_name="defense_schedules",
    )
    op.drop_constraint(
        "defense_schedule_presentation_order_positive",
        "defense_schedules",
        type_="check",
    )
    op.drop_constraint(
        "defense_schedule_duration_positive",
        "defense_schedules",
        type_="check",
    )
    op.drop_constraint(
        "uq_defense_schedules_registration",
        "defense_schedules",
        type_="unique",
    )

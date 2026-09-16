"""add evaluation constraints

Revision ID: c2f4e8a9b1d3
Revises: b7d9c3a6f4e2
Create Date: 2026-09-05 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c2f4e8a9b1d3"
down_revision: str | None = "b7d9c3a6f4e2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "scores",
        sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_check_constraint(
        "scores_score_range",
        "scores",
        "score >= 0 AND score <= 10",
    )
    op.create_check_constraint(
        "scores_council_requires_council_id",
        "scores",
        "evaluation_type NOT IN ('COUNCIL', 'council') OR council_id IS NOT NULL",
    )
    op.create_check_constraint(
        "scores_supervisor_requires_no_council_id",
        "scores",
        "evaluation_type NOT IN ('SUPERVISOR', 'supervisor') OR council_id IS NULL",
    )
    op.create_check_constraint(
        "final_results_supervisor_score_range",
        "final_results",
        "supervisor_score >= 0 AND supervisor_score <= 10",
    )
    op.create_check_constraint(
        "final_results_council_average_score_range",
        "final_results",
        "council_average_score >= 0 AND council_average_score <= 10",
    )
    op.create_check_constraint(
        "final_results_final_score_range",
        "final_results",
        "final_score >= 0 AND final_score <= 10",
    )
    op.create_check_constraint(
        "final_results_weight_non_negative",
        "final_results",
        "supervisor_weight >= 0 AND council_weight >= 0",
    )
    op.create_check_constraint(
        "final_results_weight_total_100",
        "final_results",
        "supervisor_weight + council_weight = 100",
    )
    op.create_check_constraint(
        "final_results_published_metadata_required",
        "final_results",
        "status NOT IN ('PUBLISHED', 'published') OR "
        "(published_at IS NOT NULL AND published_by_id IS NOT NULL)",
    )


def downgrade() -> None:
    op.drop_constraint(
        "final_results_published_metadata_required",
        "final_results",
        type_="check",
    )
    op.drop_constraint("final_results_weight_total_100", "final_results", type_="check")
    op.drop_constraint("final_results_weight_non_negative", "final_results", type_="check")
    op.drop_constraint("final_results_final_score_range", "final_results", type_="check")
    op.drop_constraint(
        "final_results_council_average_score_range",
        "final_results",
        type_="check",
    )
    op.drop_constraint(
        "final_results_supervisor_score_range",
        "final_results",
        type_="check",
    )
    op.drop_constraint(
        "scores_supervisor_requires_no_council_id",
        "scores",
        type_="check",
    )
    op.drop_constraint(
        "scores_council_requires_council_id",
        "scores",
        type_="check",
    )
    op.drop_constraint("scores_score_range", "scores", type_="check")
    op.drop_column("scores", "locked_at")

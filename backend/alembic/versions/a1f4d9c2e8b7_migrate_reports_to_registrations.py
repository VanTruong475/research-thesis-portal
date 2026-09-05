"""migrate reports to registrations

Revision ID: a1f4d9c2e8b7
Revises: e6bc1dd47c01
Create Date: 2026-09-04 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "a1f4d9c2e8b7"
down_revision: str | None = "e6bc1dd47c01"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("reports", sa.Column("registration_id", sa.UUID(), nullable=True))
    op.create_index("reports_registration_idx", "reports", ["registration_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_reports_registration_id_registrations"),
        "reports",
        "registrations",
        ["registration_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    op.execute(
        """
        WITH unambiguous_matches AS (
            SELECT
                r.id AS report_id,
                MIN(reg.id::text)::uuid AS registration_id,
                COUNT(reg.id) AS match_count
            FROM reports r
            JOIN registrations reg
                ON reg.topic_id = r.topic_id
               AND reg.student_id = r.student_id
            WHERE r.registration_id IS NULL
            GROUP BY r.id
            HAVING COUNT(reg.id) = 1
        )
        UPDATE reports r
        SET registration_id = um.registration_id
        FROM unambiguous_matches um
        WHERE r.id = um.report_id
        """
    )

    op.drop_constraint(op.f("fk_reports_topic_id_topics"), "reports", type_="foreignkey")
    op.alter_column("reports", "topic_id", existing_type=sa.UUID(), nullable=True)
    op.create_foreign_key(
        op.f("fk_reports_topic_id_topics"),
        "reports",
        "topics",
        ["topic_id"],
        ["id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint(op.f("fk_reports_topic_id_topics"), "reports", type_="foreignkey")
    op.alter_column("reports", "topic_id", existing_type=sa.UUID(), nullable=False)
    op.create_foreign_key(
        op.f("fk_reports_topic_id_topics"),
        "reports",
        "topics",
        ["topic_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.drop_constraint(op.f("fk_reports_registration_id_registrations"), "reports", type_="foreignkey")
    op.drop_index("reports_registration_idx", table_name="reports")
    op.drop_column("reports", "registration_id")

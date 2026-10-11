from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    UniqueConstraint,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel
from app.db.enums import AcademicPeriodStatus, enum_values

if TYPE_CHECKING:
    from app.modules.registrations.model import Registration
    from app.modules.topics.model import Topic
    from app.modules.users.model import User


class AcademicPeriod(BaseModel):
    __tablename__ = "academic_periods"
    __table_args__ = (
        UniqueConstraint("code"),
        CheckConstraint(
            "semester IS NULL OR semester BETWEEN 1 AND 3",
            name="semester_range",
        ),
        CheckConstraint(
            "proposal_start_at < proposal_end_at",
            name="proposal_time_order",
        ),
        CheckConstraint(
            "registration_start_at < registration_end_at",
            name="registration_time_order",
        ),
        CheckConstraint(
            "execution_start_at IS NULL OR execution_end_at IS NULL "
            "OR execution_start_at < execution_end_at",
            name="execution_time_order",
        ),
        CheckConstraint(
            "defense_start_at IS NULL OR defense_end_at IS NULL "
            "OR defense_start_at < defense_end_at",
            name="defense_time_order",
        ),
        Index("academic_periods_status_idx", "status"),
        Index("academic_periods_academic_year_idx", "academic_year"),
        Index(
            "academic_periods_registration_time_idx",
            "registration_start_at",
            "registration_end_at",
        ),
    )

    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False)
    semester: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    proposal_start_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    proposal_end_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    registration_start_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    registration_end_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    execution_start_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    execution_end_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    report_deadline_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    defense_start_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    defense_end_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[AcademicPeriodStatus] = mapped_column(
        SQLEnum(
            AcademicPeriodStatus,
            name="academic_period_status",
            values_callable=enum_values,
            validate_strings=True,
        ),
        default=AcademicPeriodStatus.DRAFT,
        server_default=AcademicPeriodStatus.DRAFT.value,
        nullable=False,
    )
    created_by_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )

    created_by: Mapped[User] = relationship(
        back_populates="created_academic_periods",
        foreign_keys=[created_by_id],
    )
    topics: Mapped[list[Topic]] = relationship(back_populates="academic_period")
    registrations: Mapped[list[Registration]] = relationship(
        back_populates="academic_period"
    )

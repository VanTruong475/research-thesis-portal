from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Text, func, text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel, utc_now
from app.db.enums import RegistrationStatus, enum_values

if TYPE_CHECKING:
    from app.modules.academic_periods.model import AcademicPeriod
    from app.modules.topics.model import Topic
    from app.modules.users.model import User


class Registration(BaseModel):
    __tablename__ = "registrations"
    __table_args__ = (
        CheckConstraint(
            "status NOT IN ('approved', 'in_progress') OR supervisor_id IS NOT NULL",
            name="supervisor_required_when_approved_or_in_progress",
        ),
        CheckConstraint(
            "status != 'rejected' OR reviewed_at IS NOT NULL",
            name="reviewed_at_required_when_rejected",
        ),
        CheckConstraint(
            "status != 'cancelled' OR cancelled_at IS NOT NULL",
            name="cancelled_at_required_when_cancelled",
        ),
        Index("registrations_period_idx", "academic_period_id"),
        Index("registrations_topic_idx", "topic_id"),
        Index("registrations_student_idx", "student_id"),
        Index("registrations_supervisor_idx", "supervisor_id"),
        Index("registrations_status_idx", "status"),
        Index("registrations_topic_status_idx", "topic_id", "status"),
        Index(
            "registrations_one_effective_per_student_period",
            "student_id",
            "academic_period_id",
            unique=True,
            postgresql_where=text("status IN ('pending', 'approved', 'in_progress')"),
        ),
    )

    academic_period_id: Mapped[UUID] = mapped_column(
        ForeignKey("academic_periods.id", ondelete="RESTRICT"), nullable=False
    )
    topic_id: Mapped[UUID] = mapped_column(
        ForeignKey("topics.id", ondelete="RESTRICT"), nullable=False
    )
    student_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    supervisor_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=True
    )
    status: Mapped[RegistrationStatus] = mapped_column(
        SQLEnum(
            RegistrationStatus,
            name="registration_status",
            values_callable=enum_values,
            validate_strings=True,
        ),
        default=RegistrationStatus.PENDING,
        server_default=RegistrationStatus.PENDING.value,
        nullable=False,
    )
    student_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    review_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=True
    )
    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
        nullable=False,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    supervisor_assigned_by_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=True
    )
    supervisor_assigned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    academic_period: Mapped[AcademicPeriod] = relationship(back_populates="registrations")
    topic: Mapped[Topic] = relationship(back_populates="registrations")
    student: Mapped[User] = relationship(
        back_populates="student_registrations",
        foreign_keys=[student_id],
    )
    supervisor: Mapped[User | None] = relationship(
        back_populates="supervised_registrations",
        foreign_keys=[supervisor_id],
    )
    reviewed_by: Mapped[User | None] = relationship(
        back_populates="reviewed_registrations",
        foreign_keys=[reviewed_by_id],
    )
    supervisor_assigned_by: Mapped[User | None] = relationship(
        back_populates="supervisor_assigned_registrations",
        foreign_keys=[supervisor_assigned_by_id],
    )

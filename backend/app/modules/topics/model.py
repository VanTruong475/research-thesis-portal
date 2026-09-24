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
    Text,
    UniqueConstraint,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel
from app.db.enums import TopicStatus, enum_values

if TYPE_CHECKING:
    from app.modules.academic_periods.model import AcademicPeriod
    from app.modules.registrations.model import Registration
    from app.modules.users.model import User


class Topic(BaseModel):
    __tablename__ = "topics"
    __table_args__ = (
        UniqueConstraint("academic_period_id", "code"),
        CheckConstraint("max_students >= 1", name="max_students_positive"),
        CheckConstraint(
            "status != 'rejected' OR rejection_reason IS NOT NULL",
            name="rejection_reason_required_when_rejected",
        ),
        CheckConstraint(
            "status NOT IN ('approved', 'closed') OR approved_by_id IS NOT NULL",
            name="approved_by_required_when_approved_or_closed",
        ),
        Index("topics_period_idx", "academic_period_id"),
        Index("topics_status_idx", "status"),
        Index("topics_proposed_by_idx", "proposed_by_id"),
        Index("topics_title_idx", "title"),
    )

    academic_period_id: Mapped[UUID] = mapped_column(
        ForeignKey("academic_periods.id", ondelete="RESTRICT"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    max_students: Mapped[int] = mapped_column(
        SmallInteger, default=1, server_default="1", nullable=False
    )
    proposed_by_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    approved_by_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=True
    )
    status: Mapped[TopicStatus] = mapped_column(
        SQLEnum(
            TopicStatus,
            name="topic_status",
            values_callable=enum_values,
            validate_strings=True,
        ),
        default=TopicStatus.PENDING_APPROVAL,
        server_default=TopicStatus.PENDING_APPROVAL.value,
        nullable=False,
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    academic_period: Mapped[AcademicPeriod] = relationship(back_populates="topics")
    proposed_by: Mapped[User] = relationship(
        back_populates="proposed_topics",
        foreign_keys=[proposed_by_id],
    )
    approved_by: Mapped[User | None] = relationship(
        back_populates="approved_topics",
        foreign_keys=[approved_by_id],
    )
    registrations: Mapped[list[Registration]] = relationship(back_populates="topic")

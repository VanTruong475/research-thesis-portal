from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Index, Text, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel, utc_now

if TYPE_CHECKING:
    from app.modules.registrations.model import Registration
    from app.modules.users.model import User


# Bảng quản lý Cột mốc tiến độ (Milestones)
class Milestone(BaseModel):
    __tablename__ = "milestones"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, server_default=func.now(), nullable=False
    )


# Bảng lưu vết báo cáo tiến độ của Sinh viên (Progress Logs)
class ProgressLog(BaseModel):
    __tablename__ = "progress_logs"
    __table_args__ = (
        Index("progress_logs_registration_idx", "registration_id"),
        Index("progress_logs_student_idx", "student_id"),
    )

    registration_id: Mapped[UUID] = mapped_column(
        ForeignKey("registrations.id", ondelete="CASCADE"), nullable=False
    )
    student_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    milestone_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("milestones.id", ondelete="SET NULL"), nullable=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, server_default=func.now(), nullable=False
    )
    teacher_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    commented_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    registration: Mapped[Registration] = relationship()
    student: Mapped[User] = relationship()
    milestone: Mapped[Milestone | None] = relationship()

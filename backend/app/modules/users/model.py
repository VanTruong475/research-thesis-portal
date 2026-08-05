from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Index, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel
from app.db.enums import UserRole, UserStatus, enum_values

if TYPE_CHECKING:
    from app.modules.academic_periods.model import AcademicPeriod
    from app.modules.registrations.model import Registration
    from app.modules.topics.model import Topic


class User(BaseModel):
    __tablename__ = "users"
    __table_args__ = (
        Index("users_role_idx", "role"),
        Index("users_status_idx", "status"),
        Index("users_full_name_idx", "full_name"),
    )

    institutional_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(
            UserRole,
            name="user_role",
            values_callable=enum_values,
            validate_strings=True,
        ),
        nullable=False,
    )
    status: Mapped[UserStatus] = mapped_column(
        SQLEnum(
            UserStatus,
            name="user_status",
            values_callable=enum_values,
            validate_strings=True,
        ),
        default=UserStatus.ACTIVE,
        server_default=UserStatus.ACTIVE.value,
        nullable=False,
    )
    class_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    department: Mapped[str | None] = mapped_column(String(150), nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_academic_periods: Mapped[list[AcademicPeriod]] = relationship(
        back_populates="created_by",
        foreign_keys="AcademicPeriod.created_by_id",
    )
    proposed_topics: Mapped[list[Topic]] = relationship(
        back_populates="proposed_by",
        foreign_keys="Topic.proposed_by_id",
    )
    approved_topics: Mapped[list[Topic]] = relationship(
        back_populates="approved_by",
        foreign_keys="Topic.approved_by_id",
    )
    student_registrations: Mapped[list[Registration]] = relationship(
        back_populates="student",
        foreign_keys="Registration.student_id",
    )
    supervised_registrations: Mapped[list[Registration]] = relationship(
        back_populates="supervisor",
        foreign_keys="Registration.supervisor_id",
    )
    reviewed_registrations: Mapped[list[Registration]] = relationship(
        back_populates="reviewed_by",
        foreign_keys="Registration.reviewed_by_id",
    )
    supervisor_assigned_registrations: Mapped[list[Registration]] = relationship(
        back_populates="supervisor_assigned_by",
        foreign_keys="Registration.supervisor_assigned_by_id",
    )

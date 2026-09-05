# backend/app/modules/councils/model.py
# File định nghĩa các SQLAlchemy ORM Models cho Module Hội đồng đánh giá & Lịch bảo vệ (Councils Module).

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel
from app.db.enums import (
    CouncilMemberRole,
    CouncilMemberStatus,
    CouncilStatus,
    DefenseScheduleStatus,
)

if TYPE_CHECKING:
    from app.modules.registrations.model import Registration
    from app.modules.users.model import User


class Council(BaseModel):
    """
    Model đại diện cho bảng 'councils' trong Cơ sở dữ liệu.
    Lưu trữ thông tin Hội đồng chấm bảo vệ khóa luận/đồ án do Admin thành lập.
    """

    __tablename__ = "councils"

    # Khóa ngoại liên kết tới Học kỳ/Đợt đăng ký (AcademicPeriod)
    academic_period_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("academic_periods.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Mã hội đồng (VD: HD001, HD_CNTT_01) - Duy nhất trong mỗi Học kỳ
    code: Mapped[str] = mapped_column(String(50), nullable=False)

    # Tên hiển thị của Hội đồng (VD: Hội đồng bảo vệ Đồ án Kế hoạch 1 - Khoa CNTT)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Mô tả thêm về hội đồng (nếu có)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Phòng bảo vệ mặc định (VD: Phòng A201, Hội trường B)
    default_room: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Trạng thái của hội đồng: draft, scheduled, in_progress, completed, cancelled
    status: Mapped[CouncilStatus] = mapped_column(
        Enum(CouncilStatus, native_enum=False),
        default=CouncilStatus.DRAFT,
        nullable=False,
        index=True,
    )

    # ID người tạo hội đồng (Admin)
    created_by_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Constraint: Mã hội đồng (code) không được trùng lặp trong cùng 1 Học kỳ (academic_period_id)
    __table_args__ = (
        UniqueConstraint("academic_period_id", "code", name="uq_councils_period_code"),
    )

    # Relationship với danh sách các thành viên hội đồng
    members: Mapped[list[CouncilMember]] = relationship(
        "CouncilMember",
        back_populates="council",
    )

    # Relationship với danh sách lịch bảo vệ của sinh viên
    schedules: Mapped[list[DefenseSchedule]] = relationship(
        "DefenseSchedule",
        back_populates="council",
    )


class CouncilMember(BaseModel):
    """
    Model đại diện cho bảng 'council_members'.
    Lưu thông tin Giảng viên tham gia vào Hội đồng và vai trò cụ thể (Chủ tịch, Thư ký, Phản biện, Ủy viên).
    """

    __tablename__ = "council_members"

    # ID Hội đồng mà Giảng viên thuộc về
    council_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("councils.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # ID Giảng viên (Liên kết tới bảng users)
    lecturer_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Vai trò trong hội đồng: chairperson (Chủ tịch), secretary (Thư ký), reviewer (Phản biện), member (Ủy viên)
    member_role: Mapped[CouncilMemberRole] = mapped_column(
        Enum(CouncilMemberRole, native_enum=False),
        default=CouncilMemberRole.MEMBER,
        nullable=False,
        index=True,
    )

    # Admin phân công giảng viên này vào hội đồng
    assigned_by_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Trạng thái phân công thành viên: active, inactive, removed
    status: Mapped[CouncilMemberStatus] = mapped_column(
        Enum(CouncilMemberStatus, native_enum=False),
        default=CouncilMemberStatus.ACTIVE,
        nullable=False,
    )

    # Constraint: Mỗi Giảng viên chỉ xuất hiện tối đa 1 lần trong 1 Hội đồng cụ thể
    __table_args__ = (
        UniqueConstraint(
            "council_id",
            "lecturer_id",
            name="uq_council_members_council_lecturer",
        ),
    )

    # Relationship tới Hội đồng
    council: Mapped[Council] = relationship("Council", back_populates="members")

    # Relationship tới Giảng viên (User)
    lecturer: Mapped[User] = relationship("User", foreign_keys=[lecturer_id])


class DefenseSchedule(BaseModel):
    """
    Model đại diện cho bảng 'defense_schedules'.
    Lưu lịch bảo vệ chi tiết của từng đăng ký đồ án (Registration) với Hội đồng.
    """

    __tablename__ = "defense_schedules"

    # ID Hội đồng thực hiện chấm bảo vệ
    council_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("councils.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # ID Đăng ký đồ án/khóa luận của Sinh viên (Registration)
    registration_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("registrations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Thời gian bắt đầu bảo vệ (Ngày và Giờ cụ thể)
    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    # Thời lượng bảo vệ dự kiến (đơn vị: phút, mặc định 45 phút)
    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        default=45,
        nullable=False,
    )

    # Phòng bảo vệ (VD: Phòng A201)
    room: Mapped[str] = mapped_column(String(100), nullable=False)

    # Thứ tự trình bày trong buổi bảo vệ (1, 2, 3...)
    presentation_order: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Trạng thái lịch bảo vệ: scheduled, in_progress, completed, cancelled, postponed
    status: Mapped[DefenseScheduleStatus] = mapped_column(
        Enum(DefenseScheduleStatus, native_enum=False),
        default=DefenseScheduleStatus.SCHEDULED,
        nullable=False,
    )

    # Ghi chú hành chính thêm (nếu có)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ID Admin người xếp lịch
    created_by_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("registration_id", name="uq_defense_schedules_registration"),
        CheckConstraint("duration_minutes > 0", name="defense_schedule_duration_positive"),
        CheckConstraint(
            "presentation_order IS NULL OR presentation_order >= 1",
            name="defense_schedule_presentation_order_positive",
        ),
        Index(
            "uq_defense_schedules_council_presentation_order",
            "council_id",
            "presentation_order",
            unique=True,
            postgresql_where=text("presentation_order IS NOT NULL"),
        ),
    )

    # Relationship tới Hội đồng
    council: Mapped[Council] = relationship("Council", back_populates="schedules")

    # Relationship tới Đăng ký đồ án (Registration)
    registration: Mapped[Registration] = relationship("Registration")

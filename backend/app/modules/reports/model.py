from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel, utc_now

if TYPE_CHECKING:
    from app.modules.topics.model import Topic
    from app.modules.users.model import User


class Report(BaseModel):
    __tablename__ = "reports"
    __table_args__ = (
        Index("reports_topic_idx", "topic_id"),
        Index("reports_student_idx", "student_id"),
    )

    # Đề tài được nộp báo cáo
    topic_id: Mapped[UUID] = mapped_column(
        ForeignKey("topics.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Sinh viên thực hiện nộp
    student_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    # Tên gốc của file do người dùng upload (vd: Báo_Cáo_Tốt_Nghiệp.pdf)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Đường dẫn lưu file trên máy chủ / storage (vd: uploads/reports/uuid_file.pdf)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    # Kích thước file tính bằng Bytes
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    # Số phiên bản (Tự động tăng: 1, 2, 3...) cho từng lần nộp lại của đề tài
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    # Thời điểm nộp file
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
        nullable=False,
    )

    # Các mối quan hệ (Relationships)
    topic: Mapped[Topic] = relationship()
    student: Mapped[User] = relationship()

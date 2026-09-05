# backend/app/modules/evaluation/model.py
# File định nghĩa các SQLAlchemy ORM Models cho Module Chấm điểm (Scores) & Kết quả cuối cùng (Final Results).

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel, utc_now
from app.db.enums import (
    EvaluationType,
    FinalResultStatus,
    ResultClassification,
    ScoreStatus,
)

if TYPE_CHECKING:
    from app.modules.councils.model import Council
    from app.modules.registrations.model import Registration
    from app.modules.users.model import User


class Score(BaseModel):
    """
    Model đại diện cho bảng 'scores' trong CSDL.
    Lưu trữ chi tiết điểm số do GVHD chấm hoặc do Giảng viên Hội đồng chấm.
    """

    __tablename__ = "scores"

    # Đăng ký đồ án/khóa luận của Sinh viên được chấm điểm (Foreign Key)
    registration_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("registrations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Giảng viên chấm điểm (GVHD hoặc Thành viên Hội đồng) (Foreign Key)
    evaluator_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Hội đồng tương ứng (Bắt buộc nếu evaluation_type = council, NULL nếu evaluation_type = supervisor)
    council_id: Mapped[UUID | None] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("councils.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    # Phân loại chấm điểm: 'supervisor' (GVHD) hoặc 'council' (Hội đồng)
    evaluation_type: Mapped[EvaluationType] = mapped_column(
        Enum(EvaluationType, native_enum=False),
        nullable=False,
        index=True,
    )

    # Giá trị điểm số (Thang điểm 0 - 10, chính xác tới 2 chữ số thập phân)
    score: Mapped[float] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    # Nhận xét / Đánh giá chi tiết từ giảng viên
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Trạng thái điểm: draft (nháp), submitted (đã nộp), locked (đã khóa khi công bố)
    status: Mapped[ScoreStatus] = mapped_column(
        Enum(ScoreStatus, native_enum=False),
        default=ScoreStatus.DRAFT,
        nullable=False,
        index=True,
    )

    # Thời gian nộp điểm chính thức
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Thời gian khóa điểm khi kết quả cuối cùng được công bố
    locked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Constraint: Mỗi Giảng viên chỉ chấm 1 điểm duy nhất cho 1 Đăng ký (với loại đánh giá tương ứng)
    __table_args__ = (
        UniqueConstraint(
            "registration_id",
            "evaluator_id",
            "evaluation_type",
            name="uq_scores_registration_evaluator_type",
        ),
        CheckConstraint("score >= 0 AND score <= 10", name="scores_score_range"),
        CheckConstraint(
            "evaluation_type NOT IN ('COUNCIL', 'council') OR council_id IS NOT NULL",
            name="scores_council_requires_council_id",
        ),
        CheckConstraint(
            "evaluation_type NOT IN ('SUPERVISOR', 'supervisor') OR council_id IS NULL",
            name="scores_supervisor_requires_no_council_id",
        ),
    )

    # Relationships (Liên kết ORM)
    registration: Mapped["Registration"] = relationship("Registration")
    evaluator: Mapped["User"] = relationship("User", foreign_keys=[evaluator_id])
    council: Mapped["Council | None"] = relationship("Council")


class FinalResult(BaseModel):
    """
    Model đại diện cho bảng 'final_results' trong CSDL.
    Lưu trữ kết quả đánh giá tổng kết cuối cùng của sinh viên sau khi tổng hợp điểm.
    """

    __tablename__ = "final_results"

    # Đăng ký đồ án/khóa luận tương ứng (Khóa ngoại & Duy nhất 1:1)
    registration_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("registrations.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Điểm lưu lại từ GVHD (Snapshot)
    supervisor_score: Mapped[float] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    # Điểm trung bình lưu lại từ các Thành viên Hội đồng (Snapshot)
    council_average_score: Mapped[float] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    # Trọng số điểm GVHD (Mặc định 40.00%)
    supervisor_weight: Mapped[float] = mapped_column(
        Numeric(5, 2),
        default=40.00,
        nullable=False,
    )

    # Trọng số điểm Hội đồng (Mặc định 60.00%)
    council_weight: Mapped[float] = mapped_column(
        Numeric(5, 2),
        default=60.00,
        nullable=False,
    )

    # Điểm tổng kết cuối cùng (VD: 40% GVHD + 60% Hội đồng)
    final_score: Mapped[float] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        index=True,
    )

    # Xếp loại kết quả (Xuất sắc, Giỏi, Khá, Trung bình, Không đạt)
    classification: Mapped[ResultClassification | None] = mapped_column(
        Enum(ResultClassification, native_enum=False),
        nullable=True,
    )

    # Trạng thái kết quả: draft, calculated, published, cancelled
    status: Mapped[FinalResultStatus] = mapped_column(
        Enum(FinalResultStatus, native_enum=False),
        default=FinalResultStatus.DRAFT,
        nullable=False,
        index=True,
    )

    # Thời điểm thực hiện tính toán điểm tổng kết
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    # ID người thực hiện tính toán (Admin/Hệ thống)
    calculated_by_id: Mapped[UUID | None] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
    )

    # Thời điểm Admin duyệt công bố kết quả công khai
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    # ID Admin duyệt công bố kết quả
    published_by_id: Mapped[UUID | None] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
    )

    __table_args__ = (
        CheckConstraint(
            "supervisor_score >= 0 AND supervisor_score <= 10",
            name="final_results_supervisor_score_range",
        ),
        CheckConstraint(
            "council_average_score >= 0 AND council_average_score <= 10",
            name="final_results_council_average_score_range",
        ),
        CheckConstraint(
            "final_score >= 0 AND final_score <= 10",
            name="final_results_final_score_range",
        ),
        CheckConstraint(
            "supervisor_weight >= 0 AND council_weight >= 0",
            name="final_results_weight_non_negative",
        ),
        CheckConstraint(
            "supervisor_weight + council_weight = 100",
            name="final_results_weight_total_100",
        ),
        CheckConstraint(
            "status NOT IN ('PUBLISHED', 'published') OR "
            "(published_at IS NOT NULL AND published_by_id IS NOT NULL)",
            name="final_results_published_metadata_required",
        ),
    )

    # Relationships (Liên kết ORM)
    registration: Mapped["Registration"] = relationship("Registration")
    calculated_by: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[calculated_by_id],
    )
    published_by: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[published_by_id],
    )

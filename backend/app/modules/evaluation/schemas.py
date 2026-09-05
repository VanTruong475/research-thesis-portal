# backend/app/modules/evaluation/schemas.py
# File định nghĩa các Pydantic Schemas phục vụ Request và Response cho Module Chấm điểm (Scoring) & Kết quả (Final Results).

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.db.enums import (
    EvaluationType,
    FinalResultStatus,
    ResultClassification,
    ScoreStatus,
)

# ==========================================
# 1. SCHEMAS CHO CHẤM ĐIỂM (SCORES)
# ==========================================


class ScoreCreate(BaseModel):
    """
    Schema nhận dữ liệu khi Giảng viên (GVHD hoặc Thành viên Hội đồng) nhập điểm chấm.
    """

    # ID Đăng ký đồ án/khóa luận của Sinh viên cần chấm điểm
    registration_id: UUID = Field(..., description="ID đăng ký đồ án của sinh viên")

    # ID Hội đồng (Chỉ bắt buộc đối với Giảng viên Hội đồng chấm bảo vệ)
    council_id: UUID | None = Field(None, description="ID Hội đồng (bắt buộc nếu chấm điểm bảo vệ)")

    # Loại đánh giá: 'supervisor' (GVHD) hoặc 'council' (Hội đồng)
    evaluation_type: EvaluationType = Field(..., description="Loại chấm điểm: supervisor hoặc council")

    # Điểm số (Thang điểm 0.0 - 10.0)
    score: float = Field(..., ge=0.0, le=10.0, description="Điểm số từ 0.0 đến 10.0")

    # Nhận xét / Đánh giá chi tiết
    comments: str | None = Field(None, description="Ghi chú nhận xét chi tiết của giảng viên")

    # Tùy chọn nộp ngay hay lưu nháp (True: Nộp chính thức SUBMITTED, False: Lưu nháp DRAFT)
    is_submit: bool = Field(default=True, description="True để nộp chính thức, False để lưu nháp")


class ScoreUpdate(BaseModel):
    """
    Schema nhận dữ liệu khi Giảng viên cập nhật/sửa đổi điểm đã chấm (chưa bị khóa).
    """

    # Cập nhật điểm số (0.0 - 10.0)
    score: float | None = Field(None, ge=0.0, le=10.0, description="Điểm số mới từ 0.0 đến 10.0")

    # Cập nhật ghi chú nhận xét
    comments: str | None = Field(None, description="Cập nhật ghi chú nhận xét")

    # Cập nhật trạng thái nộp
    is_submit: bool | None = Field(None, description="True để chuyển từ DRAFT sang SUBMITTED")


class ScoreResponse(BaseModel):
    """
    Schema trả về thông tin phiếu điểm chi tiết qua API.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    registration_id: UUID
    evaluator_id: UUID
    council_id: UUID | None = None
    evaluation_type: EvaluationType
    score: float
    comments: str | None = None
    status: ScoreStatus
    submitted_at: datetime | None = None
    locked_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    topic_id: UUID | None = None
    topic_code: str | None = None
    topic_title: str | None = None
    student_id: UUID | None = None
    student_full_name: str | None = None
    student_institutional_code: str | None = None
    supervisor_id: UUID | None = None
    supervisor_full_name: str | None = None
    evaluator_full_name: str | None = None
    evaluator_institutional_code: str | None = None
    academic_period_id: UUID | None = None
    academic_period_code: str | None = None
    academic_period_name: str | None = None

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        data = super().model_validate(obj, *args, **kwargs)
        registration = getattr(obj, "registration", None)
        evaluator = getattr(obj, "evaluator", None)

        if evaluator is not None:
            data.evaluator_full_name = evaluator.full_name
            data.evaluator_institutional_code = evaluator.institutional_code

        if registration is None:
            return data

        topic = getattr(registration, "topic", None)
        student = getattr(registration, "student", None)
        supervisor = getattr(registration, "supervisor", None)
        academic_period = getattr(registration, "academic_period", None)

        data.academic_period_id = registration.academic_period_id
        data.topic_id = registration.topic_id
        data.student_id = registration.student_id
        data.supervisor_id = registration.supervisor_id

        if topic is not None:
            data.topic_code = topic.code
            data.topic_title = topic.title
        if student is not None:
            data.student_full_name = student.full_name
            data.student_institutional_code = student.institutional_code
        if supervisor is not None:
            data.supervisor_full_name = supervisor.full_name
        if academic_period is not None:
            data.academic_period_code = academic_period.code
            data.academic_period_name = academic_period.name

        return data


# ==========================================
# 2. SCHEMAS CHO KẾT QUẢ CUỐI CÙNG (FINAL RESULTS)
# ==========================================


class FinalResultCalculateRequest(BaseModel):
    """
    Schema nhận yêu cầu tính toán điểm tổng kết cho 1 Sinh viên (Đăng ký).
    """

    supervisor_weight: float = Field(default=40.0, ge=0.0, le=100.0, description="Tỷ lệ % điểm GVHD (mặc định 40%)")
    council_weight: float = Field(default=60.0, ge=0.0, le=100.0, description="Tỷ lệ % điểm Hội đồng (mặc định 60%)")

    @model_validator(mode="after")
    def weights_must_total_100(self) -> "FinalResultCalculateRequest":
        if round(self.supervisor_weight + self.council_weight, 2) != 100.0:
            raise ValueError("Supervisor weight and council weight must total 100.")
        return self


class FinalResultResponse(BaseModel):
    """
    Schema trả về kết quả đánh giá tổng kết cuối cùng qua API.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    registration_id: UUID
    supervisor_score: float
    council_average_score: float
    supervisor_weight: float
    council_weight: float
    final_score: float
    classification: ResultClassification | None = None
    status: FinalResultStatus
    calculated_at: datetime
    calculated_by_id: UUID | None = None
    published_at: datetime | None = None
    published_by_id: UUID | None = None
    created_at: datetime
    updated_at: datetime
    topic_id: UUID | None = None
    topic_code: str | None = None
    topic_title: str | None = None
    student_id: UUID | None = None
    student_full_name: str | None = None
    student_institutional_code: str | None = None
    supervisor_id: UUID | None = None
    supervisor_full_name: str | None = None
    academic_period_id: UUID | None = None
    academic_period_code: str | None = None
    academic_period_name: str | None = None
    calculated_by_full_name: str | None = None
    published_by_full_name: str | None = None

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        data = super().model_validate(obj, *args, **kwargs)
        registration = getattr(obj, "registration", None)
        calculated_by = getattr(obj, "calculated_by", None)
        published_by = getattr(obj, "published_by", None)

        if calculated_by is not None:
            data.calculated_by_full_name = calculated_by.full_name
        if published_by is not None:
            data.published_by_full_name = published_by.full_name

        if registration is None:
            return data

        topic = getattr(registration, "topic", None)
        student = getattr(registration, "student", None)
        supervisor = getattr(registration, "supervisor", None)
        academic_period = getattr(registration, "academic_period", None)

        data.academic_period_id = registration.academic_period_id
        data.topic_id = registration.topic_id
        data.student_id = registration.student_id
        data.supervisor_id = registration.supervisor_id

        if topic is not None:
            data.topic_code = topic.code
            data.topic_title = topic.title
        if student is not None:
            data.student_full_name = student.full_name
            data.student_institutional_code = student.institutional_code
        if supervisor is not None:
            data.supervisor_full_name = supervisor.full_name
        if academic_period is not None:
            data.academic_period_code = academic_period.code
            data.academic_period_name = academic_period.name

        return data

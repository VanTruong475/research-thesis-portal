# backend/app/modules/evaluation/schemas.py
# File định nghĩa các Pydantic Schemas phục vụ Request và Response cho Module Chấm điểm (Scoring) & Kết quả (Final Results).

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

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
    created_at: datetime
    updated_at: datetime


# ==========================================
# 2. SCHEMAS CHO KẾT QUẢ CUỐI CÙNG (FINAL RESULTS)
# ==========================================

class FinalResultCalculateRequest(BaseModel):
    """
    Schema nhận yêu cầu tính toán điểm tổng kết cho 1 Sinh viên (Đăng ký).
    """

    registration_id: UUID = Field(..., description="ID đăng ký đồ án cần tính điểm tổng kết")
    supervisor_weight: float = Field(default=40.0, ge=0.0, le=100.0, description="Tỷ lệ % điểm GVHD (mặc định 40%)")
    council_weight: float = Field(default=60.0, ge=0.0, le=100.0, description="Tỷ lệ % điểm Hội đồng (mặc định 60%)")


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

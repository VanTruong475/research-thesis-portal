from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# DTO Nộp báo cáo tiến độ mới (Dành cho Sinh viên - FR-13)
class CreateProgressLogRequest(BaseModel):
    # ID của đơn đăng ký đề tài mà sinh viên đang thực hiện
    registration_id: UUID = Field(..., description="ID của đơn đăng ký đề tài")
    # ID của cột mốc deadline (nếu báo cáo theo mốc cụ thể)
    milestone_id: UUID | None = Field(
        default=None,
        description="ID của mốc tiến độ (nếu có)",
    )
    # Nội dung chi tiết các công việc đã làm
    content: str = Field(
        ...,
        min_length=5,
        description="Nội dung báo cáo tiến độ (tối thiểu 5 ký tự)",
    )


# DTO Thêm/Cập nhật nhận xét của Giảng viên hướng dẫn (Dành cho GVHD - FR-14)
class AddTeacherCommentRequest(BaseModel):
    # Nội dung nhận xét, góp ý của giảng viên dành cho báo cáo tiến độ này
    teacher_comment: str = Field(
        ...,
        min_length=2,
        description="Nội dung nhận xét của giảng viên",
    )


# DTO Trả về chi tiết báo cáo tiến độ đầy đủ (Dùng cho cả SV và GV xem)
class ProgressLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    registration_id: UUID
    student_id: UUID
    milestone_id: UUID | None = None
    content: str
    submitted_at: datetime
    teacher_comment: str | None = None
    commented_at: datetime | None = None

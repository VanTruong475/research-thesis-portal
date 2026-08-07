from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


# Request Schema khi nộp báo cáo tiến độ mới
class CreateProgressLogRequest(BaseModel):
    registration_id: UUID = Field(..., description="ID của đơn đăng ký đề tài")
    milestone_id: UUID | None = Field(default=None, description="ID của mốc tiến độ (nếu có)")
    content: str = Field(..., min_length=1, description="Nội dung báo cáo tiến độ")


# Response Schema trả về chi tiết báo cáo tiến độ
class ProgressLogResponse(BaseModel):
    id: UUID
    registration_id: UUID
    student_id: UUID
    milestone_id: UUID | None = None
    content: str
    submitted_at: datetime
    teacher_comment: str | None = None
    commented_at: datetime | None = None

    class Config:
        from_attributes = True

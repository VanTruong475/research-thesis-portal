from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.db.enums import RegistrationStatus


# DTO (Data Transfer Object) nhận dữ liệu từ Client khi Admin phân công/thay đổi GVHD
class AssignSupervisorRequest(BaseModel):
    # ID của giảng viên được phân công làm GVHD
    supervisor_id: UUID = Field(
        ..., 
        description="ID của Giảng viên hướng dẫn được phân công"
    )


# DTO trả về thông tin đăng ký đề tài sau khi xử lý (chuẩn hóa dữ liệu đầu ra)
class RegistrationResponse(BaseModel):
    id: UUID
    academic_period_id: UUID
    topic_id: UUID
    student_id: UUID
    supervisor_id: UUID | None = None
    status: RegistrationStatus
    student_note: str | None = None
    review_reason: str | None = None
    reviewed_by_id: UUID | None = None
    registered_at: datetime
    reviewed_at: datetime | None = None
    supervisor_assigned_by_id: UUID | None = None
    supervisor_assigned_at: datetime | None = None

    class Config:
        # Cho phép Pydantic đọc dữ liệu trực tiếp từ các đối tượng ORM (SQLAlchemy model)
        from_attributes = True

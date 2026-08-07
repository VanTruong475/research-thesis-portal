from uuid import UUID
from pydantic import BaseModel, Field


# DTO trả về thông tin khối lượng tải hướng dẫn của một Giảng viên
class LecturerWorkloadResponse(BaseModel):
    lecturer_id: UUID = Field(..., description="ID của Giảng viên")
    lecturer_name: str = Field(..., description="Họ và tên Giảng viên")
    email: str = Field(..., description="Email Giảng viên")
    max_quota: int = Field(default=5, description="Số lượng sinh viên/đề tài tối đa được hướng dẫn")
    current_assigned_count: int = Field(..., description="Số lượng đề tài/sinh viên hiện tại đang hướng dẫn trong học kỳ")

    class Config:
        from_attributes = True

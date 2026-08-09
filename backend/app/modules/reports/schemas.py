from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

# DTO Trả về thông tin chi tiết một bản ghi nộp báo cáo
class ReportResponse(BaseModel):
    id: UUID = Field(..., description="ID duy nhất của bản ghi báo cáo")
    topic_id: UUID = Field(..., description="ID của đề tài")
    student_id: UUID = Field(..., description="ID của sinh viên nộp báo cáo")
    file_name: str = Field(..., description="Tên gốc của file báo cáo")
    file_path: str = Field(..., description="Đường dẫn lưu file trên máy chủ")
    file_size: int = Field(..., description="Dung lượng file tính theo bytes")
    version: int = Field(..., description="Số phiên bản báo cáo (1, 2, 3...)")
    submitted_at: datetime = Field(..., description="Thời điểm nộp file")

    class Config:
        # Cho phép Pydantic tự động đọc dữ liệu từ SQLAlchemy Model
        from_attributes = True

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# DTO Trả về thông tin chi tiết một bản ghi nộp báo cáo
class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(..., description="ID duy nhất của bản ghi báo cáo")
    registration_id: UUID | None = Field(None, description="ID của đơn đăng ký thực hiện đề tài")
    topic_id: UUID | None = Field(None, description="ID đề tài legacy/hiển thị từ đơn đăng ký")
    student_id: UUID = Field(..., description="ID của sinh viên nộp báo cáo")
    file_name: str = Field(..., description="Tên gốc của file báo cáo")
    file_path: str = Field(..., description="Đường dẫn lưu file trên máy chủ")
    file_size: int = Field(..., description="Dung lượng file tính theo bytes")
    version: int = Field(..., description="Số phiên bản báo cáo (1, 2, 3...)")
    submitted_at: datetime = Field(..., description="Thời điểm nộp file")
    topic_code: str | None = None
    topic_title: str | None = None
    academic_period_code: str | None = None
    academic_period_name: str | None = None
    student_full_name: str | None = None
    supervisor_full_name: str | None = None

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        data = super().model_validate(obj, *args, **kwargs)
        registration = getattr(obj, "registration", None)
        topic = getattr(registration, "topic", None) or getattr(obj, "topic", None)
        academic_period = getattr(registration, "academic_period", None)
        student = getattr(registration, "student", None) or getattr(obj, "student", None)
        supervisor = getattr(registration, "supervisor", None)

        if topic is not None:
            data.topic_id = getattr(topic, "id", data.topic_id)
            data.topic_code = topic.code
            data.topic_title = topic.title
        if academic_period is not None:
            data.academic_period_code = academic_period.code
            data.academic_period_name = academic_period.name
        if student is not None:
            data.student_full_name = student.full_name
        if supervisor is not None:
            data.supervisor_full_name = supervisor.full_name

        return data

# backend/app/modules/councils/schemas.py
# File định nghĩa các Pydantic Schemas (Data Transfer Objects - DTO) cho Module Councils.

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.db.enums import (
    CouncilMemberRole,
    CouncilMemberStatus,
    CouncilStatus,
    DefenseScheduleStatus,
)

# --- DTO CHO THÀNH VIÊN HỘI ĐỒNG (COUNCIL MEMBERS) ---


class CouncilMemberAssignRequest(BaseModel):
    """
    DTO cho Yêu cầu Phân công Giảng viên vào Hội đồng (Admin thực hiện).
    """

    lecturer_id: UUID = Field(..., description="ID của Giảng viên (liên kết bảng users)")
    member_role: CouncilMemberRole = Field(
        default=CouncilMemberRole.MEMBER,
        description=(
            "Vai trò trong hội đồng: chairperson (Chủ tịch), secretary (Thư ký), "
            "reviewer (Phản biện), member (Ủy viên)"
        ),
    )


class CouncilMemberResponse(BaseModel):
    """
    DTO trả về thông tin thành viên hội đồng.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    council_id: UUID
    lecturer_id: UUID
    member_role: CouncilMemberRole
    status: CouncilMemberStatus
    assigned_at: datetime = Field(validation_alias="created_at")
    lecturer_full_name: str | None = None
    lecturer_institutional_code: str | None = None

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        data = super().model_validate(obj, *args, **kwargs)
        lecturer = getattr(obj, "lecturer", None)
        if lecturer is not None:
            data.lecturer_full_name = lecturer.full_name
            data.lecturer_institutional_code = lecturer.institutional_code
        return data


# --- DTO CHO LỊCH BẢO VỆ (DEFENSE SCHEDULES) ---


class DefenseScheduleCreateRequest(BaseModel):
    """
    DTO cho Yêu cầu Xếp lịch bảo vệ đồ án cho một sinh viên vào Hội đồng.
    """

    registration_id: UUID = Field(
        ...,
        description="ID Đăng ký đồ án/khóa luận của Sinh viên",
    )
    scheduled_at: datetime = Field(
        ...,
        description="Thời gian bắt đầu buổi bảo vệ (ISO datetime)",
    )
    duration_minutes: int = Field(
        default=45,
        ge=15,
        le=180,
        description="Thời lượng bảo vệ dự kiến (phút)",
    )
    room: str = Field(..., max_length=100, description="Phòng bảo vệ (VD: Phòng A201)")
    presentation_order: int | None = Field(
        default=None,
        ge=1,
        description="Thứ tự trình bày trong buổi bảo vệ",
    )
    note: str | None = Field(default=None, description="Ghi chú bổ sung (nếu có)")

    @field_validator("room")
    @classmethod
    def room_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Defense room is required.")
        return value


class DefenseScheduleResponse(BaseModel):
    """
    DTO trả về chi tiết lịch bảo vệ của sinh viên.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    council_id: UUID
    registration_id: UUID
    scheduled_at: datetime
    duration_minutes: int
    room: str
    presentation_order: int | None = None
    status: DefenseScheduleStatus
    note: str | None = None
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

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        data = super().model_validate(obj, *args, **kwargs)
        registration = getattr(obj, "registration", None)
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


# --- DTO CHO HỘI ĐỒNG (COUNCILS) ---


class CouncilCreateRequest(BaseModel):
    """
    DTO cho Yêu cầu Thành lập Hội đồng mới do Admin gửi lên.
    """

    academic_period_id: UUID = Field(..., description="ID Học kỳ/Đợt đăng ký")
    code: str = Field(..., max_length=50, description="Mã hội đồng (VD: HD001, HD_CNTT_01)")
    name: str = Field(..., max_length=255, description="Tên hội đồng hiển thị")
    description: str | None = Field(default=None, description="Mô tả chi tiết hội đồng")
    default_room: str | None = Field(
        default=None,
        max_length=100,
        description="Phòng bảo vệ mặc định",
    )

    @field_validator("code", "name")
    @classmethod
    def required_text_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("This field is required.")
        return value


class CouncilResponse(BaseModel):
    """
    DTO trả về thông tin chi tiết Hội đồng (bao gồm danh sách thành viên và lịch bảo vệ).
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    academic_period_id: UUID
    code: str
    name: str
    description: str | None = None
    default_room: str | None = None
    status: CouncilStatus
    created_at: datetime
    members: list[CouncilMemberResponse] = Field(default_factory=list)
    schedules: list[DefenseScheduleResponse] = Field(default_factory=list)

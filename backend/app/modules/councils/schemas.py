# backend/app/modules/councils/schemas.py
# File định nghĩa các Pydantic Schemas (Data Transfer Objects - DTO) cho Module Councils.

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

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
    assigned_at: datetime


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
        description="Thứ tự trình bày trong buổi bảo vệ",
    )
    note: str | None = Field(default=None, description="Ghi chú bổ sung (nếu có)")


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

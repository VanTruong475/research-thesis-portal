from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.db.enums import UserRole, UserStatus


class UserCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    institutional_code: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Mã định danh (MSSV hoặc MSGV), VD: SV002, GV002",
    )
    email: EmailStr = Field(..., description="Email người dùng, VD: sv002@university.edu.vn")
    password: str = Field(..., min_length=6, description="Mật khẩu khởi tạo (tối thiểu 6 ký tự)")
    full_name: str = Field(..., min_length=1, max_length=150, description="Họ và tên đầy đủ")
    role: UserRole = Field(..., description="Vai trò: student, lecturer hoặc admin")
    class_name: str | None = Field(default=None, max_length=100, description="Tên lớp (Dành cho Sinh viên)")
    department: str | None = Field(default=None, max_length=150, description="Khoa/Bộ môn")


class UserProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    phone: str | None = Field(default=None, max_length=20)
    class_name: str | None = Field(default=None, max_length=100)
    department: str | None = Field(default=None, max_length=150)


class UserStatusUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: UserStatus


class UserPasswordUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)



class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    institutional_code: str
    email: str
    full_name: str
    phone: str | None = None
    role: UserRole
    status: UserStatus
    class_name: str | None = None
    department: str | None = None
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class PaginationResponse(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class UserListResponse(BaseModel):
    items: list[UserResponse]
    pagination: PaginationResponse


class LecturerWorkloadResponse(BaseModel):
    lecturer_id: UUID = Field(..., description="ID của Giảng viên")
    lecturer_name: str = Field(..., description="Họ và tên Giảng viên")
    email: str = Field(..., description="Email Giảng viên")
    max_quota: int = Field(default=5, description="Số lượng sinh viên/đề tài tối đa được hướng dẫn")
    current_assigned_count: int = Field(..., description="Số lượng đề tài/sinh viên hiện tại đang hướng dẫn trong học kỳ")

    class Config:
        from_attributes = True

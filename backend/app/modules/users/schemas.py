from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from app.db.enums import UserRole, UserStatus


# DTO Dữ liệu đầu vào để Admin tạo tài khoản người dùng mới
class UserCreateRequest(BaseModel):
    institutional_code: str = Field(..., description="Mã định danh (MSSV hoặc MSGV), VD: SV002, GV002")
    email: EmailStr = Field(..., description="Email người dùng, VD: sv002@university.edu.vn")
    password: str = Field(..., min_length=6, description="Mật khẩu khởi tạo (tối thiểu 6 ký tự)")
    full_name: str = Field(..., description="Họ và tên đầy đủ")
    role: UserRole = Field(..., description="Vai trò: student (Sinh viên) hoặc lecturer (Giảng viên)")
    class_name: str | None = Field(default=None, description="Tên lớp (Dành cho Sinh viên)")
    department: str | None = Field(default=None, description="Khoa/Bộ môn (Dành cho Giảng viên)")


# DTO Dữ liệu trả về chi tiết thông tin Người dùng (không chứa mật khẩu)
class UserResponse(BaseModel):
    id: UUID
    institutional_code: str
    email: str
    full_name: str
    role: UserRole
    status: UserStatus
    class_name: str | None = None
    department: str | None = None

    class Config:
        from_attributes = True


# DTO trả về thông tin khối lượng tải hướng dẫn của một Giảng viên
class LecturerWorkloadResponse(BaseModel):
    lecturer_id: UUID = Field(..., description="ID của Giảng viên")
    lecturer_name: str = Field(..., description="Họ và tên Giảng viên")
    email: str = Field(..., description="Email Giảng viên")
    max_quota: int = Field(default=5, description="Số lượng sinh viên/đề tài tối đa được hướng dẫn")
    current_assigned_count: int = Field(..., description="Số lượng đề tài/sinh viên hiện tại đang hướng dẫn trong học kỳ")

    class Config:
        from_attributes = True

# backend/app/modules/users/service.py
# File này chứa Service xử lý logic nghiệp vụ Quản lý người dùng (User Management Service).

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import AppException
from app.core.security import hash_password
from app.db.enums import UserStatus
from app.modules.users.model import User
from app.modules.users.schemas import UserCreateRequest, UserResponse


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_user(self, payload: UserCreateRequest) -> UserResponse:
        """
        Hàm xử lý tạo tài khoản người dùng mới (Sinh viên hoặc Giảng viên).
        Chỉ dành riêng cho Admin gọi.
        """
        # 1. Kiểm tra xem Mã định danh (institutional_code) hoặc Email đã tồn tại chưa
        stmt = select(User).where(
            or_(
                User.institutional_code == payload.institutional_code,
                User.email == payload.email,
            )
        )
        result = await self.db.execute(stmt)
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise AppException(
                status_code=400,
                message="Mã người dùng (MSSV/MSGV) hoặc Email đã tồn tại trong hệ thống.",
                code="USER_ALREADY_EXISTS",
            )

        # 2. Tạo đối tượng User mới với mật khẩu được băm (Argon2)
        new_user = User(
            institutional_code=payload.institutional_code,
            email=payload.email,
            password_hash=hash_password(payload.password),  # Băm mật khẩu bằng Argon2
            full_name=payload.full_name,
            role=payload.role,
            status=UserStatus.ACTIVE,
            class_name=payload.class_name if payload.role.value == "student" else None,
            department=payload.department if payload.role.value == "lecturer" else None,
        )

        # 3. Lưu người dùng vào cơ sở dữ liệu PostgreSQL
        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)

        # 4. Trả về DTO UserResponse
        return UserResponse(
            id=new_user.id,
            institutional_code=new_user.institutional_code,
            email=new_user.email,
            full_name=new_user.full_name,
            role=new_user.role,
            status=new_user.status,
            class_name=new_user.class_name,
            department=new_user.department,
        )

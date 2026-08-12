# backend/app/modules/users/router.py
# Router quản lý người dùng (Dành riêng cho Admin)

from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.responses import create_success_response
from app.db.enums import UserRole
from app.db.session import get_db
from app.modules.auth.dependencies import require_roles
from app.modules.users.schemas import UserCreateRequest
from app.modules.users.service import UserService

router = APIRouter(prefix="/users", tags=["Users & Admin Management"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Admin tạo tài khoản Sinh viên hoặc Giảng viên mới",
)
async def create_user_by_admin(
    payload: UserCreateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[dict, Depends(require_roles(UserRole.ADMIN))],
):
    """
    Endpoint cho phép Quản trị viên (Admin) tạo tài khoản cho Sinh viên hoặc Giảng viên.
    Yêu cầu Header Bearer Token của tài khoản Admin.
    """
    user_data = await UserService(db).create_user(payload)
    return create_success_response(
        data=user_data.model_dump(mode="json"),
        message="Tạo tài khoản người dùng mới thành công.",
        status_code=status.HTTP_201_CREATED,
    )

import math
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import AppException, NotFoundException
from app.core.security import hash_password
from app.db.enums import UserRole, UserStatus
from app.modules.users.model import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import (
    PaginationResponse,
    UserCreateRequest,
    UserListResponse,
    UserPasswordUpdateRequest,
    UserProfileUpdateRequest,
    UserResponse,
    UserStatusUpdateRequest,
)


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repository = UserRepository(db)

    async def get_current_profile(self, current_user: User) -> UserResponse:
        return UserResponse.model_validate(current_user)

    async def update_current_profile(
        self,
        current_user: User,
        payload: UserProfileUpdateRequest,
    ) -> UserResponse:
        update_data = payload.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(current_user, field, value)

        await self.repository.update_user(current_user)
        await self.db.commit()
        return UserResponse.model_validate(current_user)

    async def change_password(
        self,
        current_user: User,
        payload: UserPasswordUpdateRequest,
    ) -> UserResponse:
        from app.core.security import hash_password, verify_password
        if not verify_password(payload.current_password, current_user.password_hash):
            raise AppException(
                status_code=400,
                message="Mật khẩu hiện tại không chính xác.",
                code="INVALID_PASSWORD",
            )
        
        current_user.password_hash = hash_password(payload.new_password)
        await self.repository.update_user(current_user)
        await self.db.commit()
        return UserResponse.model_validate(current_user)

    async def list_users(self, *, page: int, page_size: int) -> UserListResponse:
        users, total_items = await self.repository.list_users(page=page, page_size=page_size)
        total_pages = math.ceil(total_items / page_size) if total_items else 0

        return UserListResponse(
            items=[UserResponse.model_validate(user) for user in users],
            pagination=PaginationResponse(
                page=page,
                page_size=page_size,
                total_items=total_items,
                total_pages=total_pages,
            ),
        )

    async def create_user(self, payload: UserCreateRequest) -> UserResponse:
        existing_user = await self.repository.get_by_email_or_code(
            email=str(payload.email),
            institutional_code=payload.institutional_code,
        )

        if existing_user:
            raise AppException(
                status_code=409,
                message="Institutional code or email already exists.",
                code="USER_ALREADY_EXISTS",
            )

        new_user = User(
            institutional_code=payload.institutional_code,
            email=str(payload.email).lower(),
            password_hash=hash_password(payload.password),
            full_name=payload.full_name,
            role=payload.role,
            status=UserStatus.ACTIVE,
            class_name=payload.class_name if payload.role == UserRole.STUDENT else None,
            department=payload.department if payload.role in (UserRole.LECTURER, UserRole.ADMIN) else None,
        )

        await self.repository.create_user(new_user)
        await self.db.commit()
        return UserResponse.model_validate(new_user)

    async def update_status(
        self,
        user_id: UUID,
        payload: UserStatusUpdateRequest,
    ) -> UserResponse:
        user = await self.repository.get_by_id(user_id)
        if user is None:
            raise NotFoundException(
                message="User not found.",
                error_code="USER_NOT_FOUND",
            )

        user.status = payload.status
        await self.repository.update_user(user)
        await self.db.commit()
        return UserResponse.model_validate(user)

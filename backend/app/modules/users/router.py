from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.responses import create_success_response
from app.db.enums import UserRole
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.users.model import User
from app.modules.users.schemas import (
    UserCreateRequest,
    UserProfileUpdateRequest,
    UserPasswordUpdateRequest,
    UserStatusUpdateRequest,
)
from app.modules.users.service import UserService

router = APIRouter(prefix="/users", tags=["Users & Admin Management"])


@router.get(
    "/me",
    status_code=status.HTTP_200_OK,
    summary="Get current user's profile",
)
async def get_my_profile(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user_data = await UserService(db).get_current_profile(current_user)
    return create_success_response(
        data=user_data.model_dump(mode="json"),
        message="Current user retrieved successfully.",
    )


@router.put(
    "/me",
    status_code=status.HTTP_200_OK,
    summary="Update current user's profile",
)
async def update_my_profile(
    payload: UserProfileUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user_data = await UserService(db).update_current_profile(current_user, payload)
    return create_success_response(
        data=user_data.model_dump(mode="json"),
        message="Profile updated successfully.",
    )


@router.put(
    "/me/password",
    status_code=status.HTTP_200_OK,
    summary="Update current user's password",
)
async def update_my_password(
    payload: UserPasswordUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user_data = await UserService(db).change_password(current_user, payload)
    return create_success_response(
        data=user_data.model_dump(mode="json"),
        message="Password updated successfully.",
    )


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="Admin list users",
)
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
):
    users_data = await UserService(db).list_users(page=page, page_size=page_size)
    return create_success_response(
        data=users_data.model_dump(mode="json"),
        message="Users retrieved successfully.",
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Admin create a user account",
)
async def create_user_by_admin(
    payload: UserCreateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
):
    user_data = await UserService(db).create_user(payload)
    return create_success_response(
        data=user_data.model_dump(mode="json"),
        message="User created successfully.",
        status_code=status.HTTP_201_CREATED,
    )


@router.patch(
    "/{user_id}/status",
    status_code=status.HTTP_200_OK,
    summary="Admin update user status",
)
async def update_user_status(
    user_id: UUID,
    payload: UserStatusUpdateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
):
    user_data = await UserService(db).update_status(user_id, payload)
    return create_success_response(
        data=user_data.model_dump(mode="json"),
        message="User status updated successfully.",
    )

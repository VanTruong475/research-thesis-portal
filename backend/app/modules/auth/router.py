from ipaddress import ip_address
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.responses import SuccessResponse
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schema import (
    CurrentUserApiResponse,
    LoginApiResponse,
    LoginRequest,
    LogoutApiResponse,
    LogoutRequest,
    RefreshTokenRequest,
    TokenApiResponse,
    UserResponse,
)
from app.modules.auth.service import AuthService
from app.modules.users.model import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _client_ip(request: Request) -> str | None:
    if request.client is None:
        return None
    try:
        ip_address(request.client.host)
    except ValueError:
        return None
    return request.client.host


def _user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


@router.post("/login", response_model=LoginApiResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SuccessResponse:
    data = await AuthService(db).login(
        identifier=payload.identifier,
        password=payload.password,
        created_ip=_client_ip(request),
        user_agent=_user_agent(request),
    )
    return SuccessResponse(message="Login successful.", data=data)


@router.post("/refresh", response_model=TokenApiResponse)
async def refresh_token(
    payload: RefreshTokenRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SuccessResponse:
    data = await AuthService(db).refresh(
        raw_refresh_token=payload.refresh_token,
        created_ip=_client_ip(request),
        user_agent=_user_agent(request),
    )
    return SuccessResponse(message="Token refreshed successfully.", data=data)


@router.post("/logout", response_model=LogoutApiResponse)
async def logout(
    payload: LogoutRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SuccessResponse:
    await AuthService(db).logout(payload.refresh_token)
    return SuccessResponse(message="Logout successful.", data=None)


@router.get("/me", response_model=CurrentUserApiResponse)
async def me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> SuccessResponse:
    return SuccessResponse(
        message="Current user retrieved successfully.",
        data=UserResponse.model_validate(current_user),
    )

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.db.enums import UserRole, UserStatus


class UserResponse(BaseModel):
    id: UUID
    institutional_code: str
    email: str
    full_name: str
    role: UserRole
    status: UserStatus

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=255)


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class LogoutRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int


class LoginResponse(TokenResponse):
    user: UserResponse


class LoginApiResponse(BaseModel):
    success: bool = True
    message: str
    data: LoginResponse


class TokenApiResponse(BaseModel):
    success: bool = True
    message: str
    data: TokenResponse


class LogoutApiResponse(BaseModel):
    success: bool = True
    message: str
    data: None = None


class CurrentUserApiResponse(BaseModel):
    success: bool = True
    message: str
    data: UserResponse

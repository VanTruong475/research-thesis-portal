from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import AppException
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    refresh_token_expires_at,
    utc_now,
    verify_password,
)
from app.db.enums import UserRole, UserStatus
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schema import LoginResponse, TokenResponse, UserResponse
from app.modules.users.model import User


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repository = AuthRepository(db)

    async def login(
        self,
        identifier: str,
        password: str,
        created_ip: str | None = None,
        user_agent: str | None = None,
    ) -> LoginResponse:
        async with self.db.begin():
            user = await self.repository.get_user_by_identifier(identifier)
            if user is None or not verify_password(password, user.password_hash):
                raise AppException(
                    status_code=401,
                    message="Invalid email, institutional code, or password.",
                    code="AUTH_INVALID_CREDENTIALS",
                )

            self._ensure_user_can_authenticate(user)

            access_token, expires_in = create_access_token(user.id, user.role)
            raw_refresh_token = generate_refresh_token()
            await self.repository.create_refresh_token(
                user_id=user.id,
                token_hash=hash_refresh_token(raw_refresh_token),
                expires_at=refresh_token_expires_at(),
                created_ip=created_ip,
                user_agent=user_agent,
            )
            await self.repository.update_last_login(user, utc_now())

        return LoginResponse(
            access_token=access_token,
            refresh_token=raw_refresh_token,
            token_type="bearer",
            expires_in=expires_in,
            user=UserResponse.model_validate(user),
        )

    async def refresh(
        self,
        raw_refresh_token: str,
        created_ip: str | None = None,
        user_agent: str | None = None,
    ) -> TokenResponse:
        async with self.db.begin():
            old_token = await self.repository.get_refresh_token_by_hash_for_update(
                hash_refresh_token(raw_refresh_token)
            )
            if old_token is None:
                raise self._invalid_refresh_token()

            now = utc_now()
            if old_token.revoked_at is not None or old_token.replaced_by_token_id is not None:
                raise self._invalid_refresh_token()

            if old_token.expires_at <= now:
                raise AppException(
                    status_code=401,
                    message="Refresh token has expired.",
                    code="AUTH_TOKEN_EXPIRED",
                )

            user = await self.repository.get_user_by_id(old_token.user_id)
            if user is None:
                raise self._invalid_refresh_token()
            self._ensure_user_can_authenticate(user)

            access_token, expires_in = create_access_token(user.id, user.role)
            new_raw_refresh_token = generate_refresh_token()
            new_refresh_token = await self.repository.create_refresh_token(
                user_id=user.id,
                token_hash=hash_refresh_token(new_raw_refresh_token),
                expires_at=refresh_token_expires_at(),
                created_ip=created_ip,
                user_agent=user_agent,
            )
            await self.repository.revoke_refresh_token(
                old_token,
                revoked_at=now,
                replaced_by_token_id=new_refresh_token.id,
            )

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_raw_refresh_token,
            token_type="bearer",
            expires_in=expires_in,
        )

    async def logout(self, raw_refresh_token: str) -> None:
        async with self.db.begin():
            refresh_token = await self.repository.get_refresh_token_by_hash_for_update(
                hash_refresh_token(raw_refresh_token)
            )
            if refresh_token is None:
                raise self._invalid_refresh_token()

            if refresh_token.revoked_at is None:
                await self.repository.revoke_refresh_token(
                    refresh_token,
                    revoked_at=utc_now(),
                )

    async def get_user_by_id(self, user_id: UUID) -> User:
        user = await self.repository.get_user_by_id(user_id)
        if user is None or user.status != UserStatus.ACTIVE:
            raise AppException(
                status_code=401,
                message="Authentication is required.",
                code="AUTHENTICATION_REQUIRED",
            )
        return user

    def _ensure_user_can_authenticate(self, user: User) -> None:
        if user.status == UserStatus.ACTIVE:
            return
        raise AppException(
            status_code=403,
            message="Account is locked or inactive.",
            code="AUTH_ACCOUNT_LOCKED",
        )

    def _invalid_refresh_token(self) -> AppException:
        return AppException(
            status_code=401,
            message="Refresh token is invalid.",
            code="AUTH_REFRESH_TOKEN_INVALID",
        )


def require_role(user: User, allowed_roles: tuple[UserRole, ...]) -> None:
    if user.role not in allowed_roles:
        raise AppException(
            status_code=403,
            message="You do not have permission to perform this action.",
            code="PERMISSION_DENIED",
        )

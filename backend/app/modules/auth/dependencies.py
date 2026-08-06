from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import AppException
from app.core.security import decode_access_token
from app.db.enums import UserRole
from app.db.session import get_db
from app.modules.auth.service import AuthService, require_role
from app.modules.users.model import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AppException(
            status_code=401,
            message="Authentication is required.",
            code="AUTHENTICATION_REQUIRED",
        )

    payload = decode_access_token(credentials.credentials)
    try:
        user_id = UUID(str(payload["sub"]))
    except ValueError as exc:
        raise AppException(
            status_code=401,
            message="Authentication is required.",
            code="AUTHENTICATION_REQUIRED",
        ) from exc

    return await AuthService(db).get_user_by_id(user_id)


def require_roles(*allowed_roles: UserRole) -> Callable[[User], User]:
    def dependency(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        require_role(current_user, allowed_roles)
        return current_user

    return dependency

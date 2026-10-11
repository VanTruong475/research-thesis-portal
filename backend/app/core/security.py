from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe
from uuid import UUID

from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError
from jose import ExpiredSignatureError, JWTError, jwt

from app.common.exceptions import AppException
from app.core.config import settings
from app.db.enums import UserRole

_password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError):
        return False


def hash_refresh_token(refresh_token: str) -> str:
    import hashlib

    return hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()


def generate_refresh_token() -> str:
    return token_urlsafe(64)


def utc_now() -> datetime:
    return datetime.now(UTC)


def refresh_token_expires_at() -> datetime:
    return utc_now() + timedelta(days=settings.refresh_token_expire_days)


def create_access_token(user_id: UUID, role: UserRole) -> tuple[str, int]:
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    expire_at = utc_now() + expires_delta
    payload = {
        "sub": str(user_id),
        "role": role.value,
        "type": "access",
        "iat": int(utc_now().timestamp()),
        "exp": expire_at,
    }
    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return token, int(expires_delta.total_seconds())


def decode_access_token(token: str) -> dict[str, str]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except ExpiredSignatureError as exc:
        raise AppException(
            status_code=401,
            message="Access token has expired.",
            code="AUTH_TOKEN_EXPIRED",
        ) from exc
    except JWTError as exc:
        raise AppException(
            status_code=401,
            message="Authentication is required.",
            code="AUTHENTICATION_REQUIRED",
        ) from exc

    if payload.get("type") != "access" or not payload.get("sub"):
        raise AppException(
            status_code=401,
            message="Authentication is required.",
            code="AUTHENTICATION_REQUIRED",
        )

    return payload

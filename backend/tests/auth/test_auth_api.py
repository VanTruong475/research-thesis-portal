from datetime import timedelta
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, hash_refresh_token, utc_now
from app.db.enums import UserRole, UserStatus
from app.modules.auth.model import RefreshToken
from app.modules.users.model import User


async def create_user(
    test_session: AsyncSession,
    *,
    password: str = "StrongPassword123!",
    status: UserStatus = UserStatus.ACTIVE,
    role: UserRole = UserRole.STUDENT,
) -> User:
    suffix = uuid4().hex[:12]
    user = User(
        institutional_code=f"ST{suffix}",
        email=f"student-{suffix}@example.edu.vn",
        password_hash=hash_password(password),
        full_name="Nguyen Van A",
        role=role,
        status=status,
    )
    test_session.add(user)
    await test_session.flush()
    await test_session.commit()
    return user


async def get_refresh_token_records(
    test_session: AsyncSession,
) -> list[RefreshToken]:
    result = await test_session.execute(select(RefreshToken))
    return list(result.scalars().all())


@pytest.mark.asyncio
async def test_login_success_returns_tokens_and_user(
    client: AsyncClient,
    test_session: AsyncSession,
):
    user = await create_user(test_session)

    response = await client.post(
        "/api/v1/auth/login",
        json={"identifier": user.email, "password": "StrongPassword123!"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["message"] == "Login successful."
    assert body["data"]["access_token"]
    assert body["data"]["refresh_token"]
    assert body["data"]["token_type"] == "bearer"
    assert body["data"]["expires_in"] == 1800
    assert body["data"]["user"]["id"] == str(user.id)
    assert "password_hash" not in body["data"]["user"]

    refresh_tokens = await get_refresh_token_records(test_session)
    assert len(refresh_tokens) == 1
    assert refresh_tokens[0].token_hash == hash_refresh_token(body["data"]["refresh_token"])
    assert refresh_tokens[0].token_hash != body["data"]["refresh_token"]


@pytest.mark.asyncio
async def test_login_accepts_institutional_code(
    client: AsyncClient,
    test_session: AsyncSession,
):
    user = await create_user(test_session)

    response = await client.post(
        "/api/v1/auth/login",
        json={"identifier": user.institutional_code, "password": "StrongPassword123!"},
    )

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_login_failure_does_not_reveal_account_existence(
    client: AsyncClient,
    test_session: AsyncSession,
):
    user = await create_user(test_session)

    response = await client.post(
        "/api/v1/auth/login",
        json={"identifier": user.email, "password": "wrong-password"},
    )

    assert response.status_code == 401
    body = response.json()
    assert body == {
        "success": False,
        "message": "Invalid email, institutional code, or password.",
        "error": {"code": "AUTH_INVALID_CREDENTIALS", "details": None},
    }


@pytest.mark.asyncio
async def test_locked_user_cannot_login(
    client: AsyncClient,
    test_session: AsyncSession,
):
    user = await create_user(test_session, status=UserStatus.LOCKED)

    response = await client.post(
        "/api/v1/auth/login",
        json={"identifier": user.email, "password": "StrongPassword123!"},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "AUTH_ACCOUNT_LOCKED"


@pytest.mark.asyncio
async def test_refresh_rotates_token_and_revokes_old_token(
    client: AsyncClient,
    test_session: AsyncSession,
):
    user = await create_user(test_session)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"identifier": user.email, "password": "StrongPassword123!"},
    )
    old_raw_refresh_token = login_response.json()["data"]["refresh_token"]

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": old_raw_refresh_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "Token refreshed successfully."
    new_raw_refresh_token = body["data"]["refresh_token"]
    assert new_raw_refresh_token != old_raw_refresh_token

    records = await get_refresh_token_records(test_session)
    assert len(records) == 2
    old_record = next(
        record
        for record in records
        if record.token_hash == hash_refresh_token(old_raw_refresh_token)
    )
    new_record = next(
        record
        for record in records
        if record.token_hash == hash_refresh_token(new_raw_refresh_token)
    )
    assert old_record.revoked_at is not None
    assert old_record.replaced_by_token_id == new_record.id
    assert new_record.revoked_at is None


@pytest.mark.asyncio
async def test_reusing_rotated_refresh_token_is_rejected(
    client: AsyncClient,
    test_session: AsyncSession,
):
    user = await create_user(test_session)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"identifier": user.email, "password": "StrongPassword123!"},
    )
    old_raw_refresh_token = login_response.json()["data"]["refresh_token"]
    await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": old_raw_refresh_token},
    )

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": old_raw_refresh_token},
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_REFRESH_TOKEN_INVALID"


@pytest.mark.asyncio
async def test_expired_refresh_token_is_rejected(
    client: AsyncClient,
    test_session: AsyncSession,
):
    user = await create_user(test_session)
    raw_refresh_token = "expired-refresh-token"
    test_session.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(raw_refresh_token),
            expires_at=utc_now() - timedelta(minutes=1),
        )
    )
    await test_session.commit()

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": raw_refresh_token},
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_TOKEN_EXPIRED"


@pytest.mark.asyncio
async def test_logout_revokes_refresh_token(
    client: AsyncClient,
    test_session: AsyncSession,
):
    user = await create_user(test_session)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"identifier": user.email, "password": "StrongPassword123!"},
    )
    raw_refresh_token = login_response.json()["data"]["refresh_token"]

    response = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": raw_refresh_token},
    )

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "message": "Logout successful.",
        "data": None,
    }
    records = await get_refresh_token_records(test_session)
    assert len(records) == 1
    assert records[0].revoked_at is not None


@pytest.mark.asyncio
async def test_me_returns_current_user(
    client: AsyncClient,
    test_session: AsyncSession,
):
    user = await create_user(test_session)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"identifier": user.email, "password": "StrongPassword123!"},
    )
    access_token = login_response.json()["data"]["access_token"]

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["id"] == str(user.id)


@pytest.mark.asyncio
async def test_me_requires_authentication(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"

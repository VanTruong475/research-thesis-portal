from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.db.enums import UserRole, UserStatus
from app.modules.users.model import User


async def create_user(
    test_session: AsyncSession,
    *,
    password: str = "StrongPassword123!",
    role: UserRole = UserRole.STUDENT,
    status: UserStatus = UserStatus.ACTIVE,
    full_name: str = "Nguyen Van A",
) -> User:
    suffix = uuid4().hex[:12]
    user = User(
        institutional_code=f"U{suffix}",
        email=f"user-{suffix}@example.edu.vn",
        password_hash=hash_password(password),
        full_name=full_name,
        role=role,
        status=status,
        class_name="D20CQCN01" if role == UserRole.STUDENT else None,
        department="Computer Science" if role in (UserRole.LECTURER, UserRole.ADMIN) else None,
    )
    test_session.add(user)
    await test_session.flush()
    await test_session.commit()
    return user


async def auth_headers(client: AsyncClient, user: User, password: str = "StrongPassword123!") -> dict[str, str]:
    response = await client.post(
        "/api/v1/auth/login",
        json={"identifier": user.email, "password": password},
    )
    assert response.status_code == 200
    access_token = response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


@pytest.mark.asyncio
async def test_users_me_returns_current_user(
    client: AsyncClient,
    test_session: AsyncSession,
):
    user = await create_user(test_session)
    headers = await auth_headers(client, user)

    response = await client.get("/api/v1/users/me", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["id"] == str(user.id)
    assert body["data"]["email"] == user.email
    assert "password_hash" not in body["data"]


@pytest.mark.asyncio
async def test_users_me_requires_authentication(client: AsyncClient):
    response = await client.get("/api/v1/users/me")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"


@pytest.mark.asyncio
async def test_update_users_me_updates_allowed_profile_fields(
    client: AsyncClient,
    test_session: AsyncSession,
):
    user = await create_user(test_session)
    headers = await auth_headers(client, user)

    response = await client.put(
        "/api/v1/users/me",
        headers=headers,
        json={
            "full_name": "Nguyen Van Updated",
            "phone": "0901234567",
            "class_name": "D20CQCN02",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["full_name"] == "Nguyen Van Updated"
    assert body["data"]["phone"] == "0901234567"
    assert body["data"]["class_name"] == "D20CQCN02"
    assert body["data"]["role"] == "student"
    assert body["data"]["status"] == "active"
    assert "password_hash" not in body["data"]


@pytest.mark.asyncio
async def test_update_users_me_rejects_role_or_status_fields(
    client: AsyncClient,
    test_session: AsyncSession,
):
    user = await create_user(test_session)
    headers = await auth_headers(client, user)

    response = await client.put(
        "/api/v1/users/me",
        headers=headers,
        json={"full_name": "Nguyen Van Updated", "role": "admin", "status": "locked"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_admin_can_list_users_with_contract_pagination(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    await create_user(test_session, role=UserRole.STUDENT)
    headers = await auth_headers(client, admin)

    response = await client.get(
        "/api/v1/users?page=1&page_size=1",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data["items"]) == 1
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["page_size"] == 1
    assert data["pagination"]["total_items"] == 2
    assert data["pagination"]["total_pages"] == 2
    assert "password_hash" not in data["items"][0]


@pytest.mark.asyncio
async def test_non_admin_cannot_list_users(
    client: AsyncClient,
    test_session: AsyncSession,
):
    student = await create_user(test_session, role=UserRole.STUDENT)
    headers = await auth_headers(client, student)

    response = await client.get("/api/v1/users", headers=headers)

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_admin_can_create_user_and_password_is_hashed(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    headers = await auth_headers(client, admin)

    response = await client.post(
        "/api/v1/users",
        headers=headers,
        json={
            "institutional_code": "SV1001",
            "email": "sv1001@example.edu.vn",
            "password": "InitialPassword123!",
            "full_name": "Sinh Vien 1001",
            "role": "student",
            "class_name": "D20CQCN01",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["data"]["institutional_code"] == "SV1001"
    assert body["data"]["status"] == "active"
    assert "password_hash" not in body["data"]

    result = await test_session.execute(select(User).where(User.email == "sv1001@example.edu.vn"))
    created_user = result.scalar_one()
    assert created_user.password_hash != "InitialPassword123!"
    assert verify_password("InitialPassword123!", created_user.password_hash) is True


@pytest.mark.asyncio
async def test_create_user_rejects_duplicate_email_or_code(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    existing_user = await create_user(test_session)
    headers = await auth_headers(client, admin)

    response = await client.post(
        "/api/v1/users",
        headers=headers,
        json={
            "institutional_code": existing_user.institutional_code,
            "email": "new-email@example.edu.vn",
            "password": "InitialPassword123!",
            "full_name": "Duplicate User",
            "role": "student",
        },
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "USER_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_non_admin_cannot_create_user(
    client: AsyncClient,
    test_session: AsyncSession,
):
    student = await create_user(test_session, role=UserRole.STUDENT)
    headers = await auth_headers(client, student)

    response = await client.post(
        "/api/v1/users",
        headers=headers,
        json={
            "institutional_code": "SV1002",
            "email": "sv1002@example.edu.vn",
            "password": "InitialPassword123!",
            "full_name": "Sinh Vien 1002",
            "role": "student",
        },
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_admin_can_update_user_status(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    target = await create_user(test_session)
    headers = await auth_headers(client, admin)

    response = await client.patch(
        f"/api/v1/users/{target.id}/status",
        headers=headers,
        json={"status": "locked"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "locked"


@pytest.mark.asyncio
async def test_non_admin_cannot_update_user_status(
    client: AsyncClient,
    test_session: AsyncSession,
):
    student = await create_user(test_session, role=UserRole.STUDENT)
    target = await create_user(test_session)
    headers = await auth_headers(client, student)

    response = await client.patch(
        f"/api/v1/users/{target.id}/status",
        headers=headers,
        json={"status": "locked"},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_update_user_status_rejects_missing_user(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    headers = await auth_headers(client, admin)

    response = await client.patch(
        f"/api/v1/users/{uuid4()}/status",
        headers=headers,
        json={"status": "locked"},
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "USER_NOT_FOUND"


@pytest.mark.asyncio
async def test_update_user_status_rejects_invalid_status(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    target = await create_user(test_session)
    headers = await auth_headers(client, admin)

    response = await client.patch(
        f"/api/v1/users/{target.id}/status",
        headers=headers,
        json={"status": "disabled"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"

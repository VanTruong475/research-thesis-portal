from datetime import datetime, timezone
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.enums import AcademicPeriodStatus, UserRole, UserStatus
from app.modules.academic_periods.model import AcademicPeriod
from app.modules.users.model import User


def period_payload(code: str | None = None) -> dict:
    suffix = uuid4().hex[:8]
    return {
        "code": code or f"KLTN-{suffix}",
        "name": "Graduation Thesis 2026",
        "academic_year": "2026-2027",
        "semester": 1,
        "proposal_start_at": "2026-01-01T00:00:00Z",
        "proposal_end_at": "2026-01-31T23:59:59Z",
        "registration_start_at": "2026-02-01T00:00:00Z",
        "registration_end_at": "2026-02-15T23:59:59Z",
        "execution_start_at": "2026-02-16T00:00:00Z",
        "execution_end_at": "2026-05-31T23:59:59Z",
        "report_deadline_at": "2026-05-20T23:59:59Z",
        "defense_start_at": "2026-06-01T00:00:00Z",
        "defense_end_at": "2026-06-15T23:59:59Z",
    }


async def create_user(
    test_session: AsyncSession,
    *,
    password: str = "StrongPassword123!",
    role: UserRole = UserRole.STUDENT,
) -> User:
    suffix = uuid4().hex[:12]
    user = User(
        institutional_code=f"U{suffix}",
        email=f"user-{suffix}@example.edu.vn",
        password_hash=hash_password(password),
        full_name="Nguyen Van A",
        role=role,
        status=UserStatus.ACTIVE,
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


async def create_period(
    test_session: AsyncSession,
    *,
    admin_id,
    code: str | None = None,
    status: AcademicPeriodStatus = AcademicPeriodStatus.DRAFT,
) -> AcademicPeriod:
    payload = period_payload(code)
    period = AcademicPeriod(
        code=payload["code"],
        name=payload["name"],
        academic_year=payload["academic_year"],
        semester=payload["semester"],
        proposal_start_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        proposal_end_at=datetime(2026, 1, 31, 23, 59, 59, tzinfo=timezone.utc),
        registration_start_at=datetime(2026, 2, 1, tzinfo=timezone.utc),
        registration_end_at=datetime(2026, 2, 15, 23, 59, 59, tzinfo=timezone.utc),
        execution_start_at=datetime(2026, 2, 16, tzinfo=timezone.utc),
        execution_end_at=datetime(2026, 5, 31, 23, 59, 59, tzinfo=timezone.utc),
        report_deadline_at=datetime(2026, 5, 20, 23, 59, 59, tzinfo=timezone.utc),
        defense_start_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
        defense_end_at=datetime(2026, 6, 15, 23, 59, 59, tzinfo=timezone.utc),
        status=status,
        created_by_id=admin_id,
    )
    test_session.add(period)
    await test_session.flush()
    await test_session.commit()
    return period


@pytest.mark.asyncio
async def test_list_academic_periods_requires_authentication(client: AsyncClient):
    response = await client.get("/api/v1/academic-periods")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"


@pytest.mark.asyncio
async def test_admin_can_create_academic_period(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    headers = await auth_headers(client, admin)
    payload = period_payload()

    response = await client.post("/api/v1/academic-periods", headers=headers, json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["code"] == payload["code"]
    assert body["data"]["status"] == "draft"
    assert body["data"]["created_by_id"] == str(admin.id)


@pytest.mark.asyncio
async def test_non_admin_cannot_create_academic_period(
    client: AsyncClient,
    test_session: AsyncSession,
):
    student = await create_user(test_session, role=UserRole.STUDENT)
    headers = await auth_headers(client, student)

    response = await client.post("/api/v1/academic-periods", headers=headers, json=period_payload())

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_create_academic_period_rejects_duplicate_code(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    await create_period(test_session, admin_id=admin.id, code="KLTN-DUP")
    headers = await auth_headers(client, admin)

    response = await client.post(
        "/api/v1/academic-periods",
        headers=headers,
        json=period_payload("KLTN-DUP"),
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ACADEMIC_PERIOD_CODE_EXISTS"


@pytest.mark.asyncio
async def test_create_academic_period_rejects_invalid_date_range(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    headers = await auth_headers(client, admin)
    payload = period_payload()
    payload["proposal_end_at"] = payload["proposal_start_at"]

    response = await client.post("/api/v1/academic-periods", headers=headers, json=payload)

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "ACADEMIC_PERIOD_INVALID_DATE_RANGE"


@pytest.mark.asyncio
async def test_authenticated_user_can_list_academic_periods_with_pagination(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    student = await create_user(test_session, role=UserRole.STUDENT)
    await create_period(test_session, admin_id=admin.id)
    await create_period(test_session, admin_id=admin.id)
    headers = await auth_headers(client, student)

    response = await client.get("/api/v1/academic-periods?page=1&page_size=1", headers=headers)

    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data["items"]) == 1
    assert data["pagination"] == {
        "page": 1,
        "page_size": 1,
        "total_items": 2,
        "total_pages": 2,
    }


@pytest.mark.asyncio
async def test_authenticated_user_can_get_existing_academic_period(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    headers = await auth_headers(client, student)

    response = await client.get(f"/api/v1/academic-periods/{period.id}", headers=headers)

    assert response.status_code == 200
    assert response.json()["data"]["id"] == str(period.id)


@pytest.mark.asyncio
async def test_get_missing_academic_period_returns_not_found(
    client: AsyncClient,
    test_session: AsyncSession,
):
    student = await create_user(test_session, role=UserRole.STUDENT)
    headers = await auth_headers(client, student)

    response = await client.get(f"/api/v1/academic-periods/{uuid4()}", headers=headers)

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "ACADEMIC_PERIOD_NOT_FOUND"


@pytest.mark.asyncio
async def test_admin_can_update_academic_period(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    period = await create_period(test_session, admin_id=admin.id)
    headers = await auth_headers(client, admin)
    payload = period_payload("KLTN-UPDATED")
    payload["name"] = "Updated Academic Period"

    response = await client.put(
        f"/api/v1/academic-periods/{period.id}",
        headers=headers,
        json=payload,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["code"] == "KLTN-UPDATED"
    assert body["data"]["name"] == "Updated Academic Period"
    assert body["data"]["status"] == "draft"


@pytest.mark.asyncio
async def test_put_academic_period_rejects_status_field(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    period = await create_period(test_session, admin_id=admin.id)
    headers = await auth_headers(client, admin)
    payload = period_payload("KLTN-STATUS-FIELD")
    payload["status"] = "completed"

    response = await client.put(
        f"/api/v1/academic-periods/{period.id}",
        headers=headers,
        json=payload,
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_non_admin_cannot_update_academic_period(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    headers = await auth_headers(client, student)

    response = await client.put(
        f"/api/v1/academic-periods/{period.id}",
        headers=headers,
        json=period_payload("KLTN-STUDENT-UPDATE"),
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_admin_can_update_academic_period_status_forward(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    period = await create_period(test_session, admin_id=admin.id)
    headers = await auth_headers(client, admin)

    response = await client.patch(
        f"/api/v1/academic-periods/{period.id}/status",
        headers=headers,
        json={"status": "proposal_open"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "proposal_open"


@pytest.mark.asyncio
async def test_status_update_rejects_invalid_transition(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    period = await create_period(test_session, admin_id=admin.id)
    headers = await auth_headers(client, admin)

    response = await client.patch(
        f"/api/v1/academic-periods/{period.id}/status",
        headers=headers,
        json={"status": "in_progress"},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "ACADEMIC_PERIOD_INVALID_STATUS_TRANSITION"


@pytest.mark.asyncio
async def test_status_update_rejects_invalid_status_value(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    period = await create_period(test_session, admin_id=admin.id)
    headers = await auth_headers(client, admin)

    response = await client.patch(
        f"/api/v1/academic-periods/{period.id}/status",
        headers=headers,
        json={"status": "open"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"

from datetime import timedelta
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, utc_now
from app.db.enums import (
    AcademicPeriodStatus,
    RegistrationStatus,
    TopicStatus,
    UserRole,
    UserStatus,
)
from app.modules.academic_periods.model import AcademicPeriod
from app.modules.registrations.model import Registration
from app.modules.topics.model import Topic
from app.modules.users.model import User


def topic_payload(period_id, code: str | None = None) -> dict:
    suffix = uuid4().hex[:8]
    return {
        "academic_period_id": str(period_id),
        "code": code or f"TOPIC-{suffix}",
        "title": "Artificial Intelligence Thesis",
        "description": "Research on applied artificial intelligence.",
        "requirements": "Python and machine learning basics.",
        "max_students": 2,
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


async def auth_headers(
    client: AsyncClient,
    user: User,
    password: str = "StrongPassword123!",
) -> dict[str, str]:
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
    status: AcademicPeriodStatus = AcademicPeriodStatus.PROPOSAL_OPEN,
    in_current_window: bool = True,
) -> AcademicPeriod:
    suffix = uuid4().hex[:8]
    now = utc_now()
    if in_current_window:
        proposal_start_at = now - timedelta(days=1)
        proposal_end_at = now + timedelta(days=1)
        registration_start_at = now - timedelta(days=1)
        registration_end_at = now + timedelta(days=1)
    else:
        proposal_start_at = now - timedelta(days=10)
        proposal_end_at = now - timedelta(days=5)
        registration_start_at = now - timedelta(days=10)
        registration_end_at = now - timedelta(days=5)

    period = AcademicPeriod(
        code=f"KLTN-{suffix}",
        name="Graduation Thesis 2026",
        academic_year="2026-2027",
        semester=1,
        proposal_start_at=proposal_start_at,
        proposal_end_at=proposal_end_at,
        registration_start_at=registration_start_at,
        registration_end_at=registration_end_at,
        status=status,
        created_by_id=admin_id,
    )
    test_session.add(period)
    await test_session.flush()
    await test_session.commit()
    return period


async def create_topic(
    test_session: AsyncSession,
    *,
    period_id,
    lecturer_id,
    admin_id=None,
    code: str | None = None,
    title: str = "Artificial Intelligence Thesis",
    status: TopicStatus = TopicStatus.PENDING_APPROVAL,
    max_students: int = 2,
) -> Topic:
    suffix = uuid4().hex[:8]
    topic = Topic(
        academic_period_id=period_id,
        code=code or f"TOPIC-{suffix}",
        title=title,
        description="Research on applied artificial intelligence.",
        requirements="Python and machine learning basics.",
        max_students=max_students,
        proposed_by_id=lecturer_id,
        approved_by_id=admin_id if status in {TopicStatus.APPROVED, TopicStatus.CLOSED} else None,
        status=status,
        rejection_reason="Not suitable." if status == TopicStatus.REJECTED else None,
        approved_at=utc_now() if status in {TopicStatus.APPROVED, TopicStatus.CLOSED} else None,
    )
    test_session.add(topic)
    await test_session.flush()
    await test_session.commit()
    return topic


async def create_registration(
    test_session: AsyncSession,
    *,
    period_id,
    topic_id,
    student_id,
    supervisor_id,
    status: RegistrationStatus = RegistrationStatus.APPROVED,
) -> Registration:
    registration = Registration(
        academic_period_id=period_id,
        topic_id=topic_id,
        student_id=student_id,
        supervisor_id=supervisor_id,
        status=status,
    )
    test_session.add(registration)
    await test_session.flush()
    await test_session.commit()
    return registration


@pytest.mark.asyncio
async def test_list_topics_requires_authentication(client: AsyncClient):
    response = await client.get("/api/v1/topics")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"


@pytest.mark.asyncio
async def test_lecturer_can_create_topic_during_proposal_window(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    period = await create_period(test_session, admin_id=admin.id)
    headers = await auth_headers(client, lecturer)
    payload = topic_payload(period.id)

    response = await client.post("/api/v1/topics", headers=headers, json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["message"] == "Topic created successfully."
    assert body["data"]["code"] == payload["code"]
    assert body["data"]["status"] == "pending_approval"
    assert body["data"]["proposed_by_id"] == str(lecturer.id)
    assert body["data"]["approved_by_id"] is None


@pytest.mark.asyncio
async def test_student_cannot_create_topic(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    headers = await auth_headers(client, student)

    response = await client.post("/api/v1/topics", headers=headers, json=topic_payload(period.id))

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_create_topic_rejects_duplicate_code_in_same_period(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    period = await create_period(test_session, admin_id=admin.id)
    await create_topic(test_session, period_id=period.id, lecturer_id=lecturer.id, code="AI-001")
    headers = await auth_headers(client, lecturer)

    response = await client.post(
        "/api/v1/topics",
        headers=headers,
        json=topic_payload(period.id, code="ai-001"),
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "TOPIC_CODE_EXISTS"


@pytest.mark.asyncio
async def test_create_topic_rejects_closed_proposal_period(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    period = await create_period(
        test_session,
        admin_id=admin.id,
        status=AcademicPeriodStatus.PROPOSAL_OPEN,
        in_current_window=False,
    )
    headers = await auth_headers(client, lecturer)

    response = await client.post("/api/v1/topics", headers=headers, json=topic_payload(period.id))

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "TOPIC_PROPOSAL_PERIOD_CLOSED"


@pytest.mark.asyncio
async def test_create_topic_rejects_status_field(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    period = await create_period(test_session, admin_id=admin.id)
    headers = await auth_headers(client, lecturer)
    payload = topic_payload(period.id)
    payload["status"] = "approved"

    response = await client.post("/api/v1/topics", headers=headers, json=payload)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_authenticated_user_can_list_topics_with_pagination_and_filters(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    other_lecturer = await create_user(test_session, role=UserRole.LECTURER)
    period = await create_period(test_session, admin_id=admin.id)
    await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
        code="AI-SEARCH",
        title="Artificial Intelligence Search",
        status=TopicStatus.APPROVED,
    )
    await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=other_lecturer.id,
        code="WEB-SEARCH",
        title="Web Application",
        status=TopicStatus.PENDING_APPROVAL,
    )
    headers = await auth_headers(client, admin)

    response = await client.get(
        "/api/v1/topics?page=1&page_size=1&status=approved&keyword=artificial",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data["items"]) == 1
    assert data["items"][0]["code"] == "AI-SEARCH"
    assert data["pagination"] == {
        "page": 1,
        "page_size": 1,
        "total_items": 1,
        "total_pages": 1,
    }


@pytest.mark.asyncio
async def test_student_list_sees_only_available_approved_topics(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    student = await create_user(test_session, role=UserRole.STUDENT)
    full_topic_student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(
        test_session,
        admin_id=admin.id,
        status=AcademicPeriodStatus.REGISTRATION_OPEN,
    )
    available_topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
        code="AVAILABLE",
        status=TopicStatus.APPROVED,
    )
    full_topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
        code="FULL",
        status=TopicStatus.APPROVED,
        max_students=1,
    )
    await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        code="PENDING",
        status=TopicStatus.PENDING_APPROVAL,
    )
    await create_registration(
        test_session,
        period_id=period.id,
        topic_id=full_topic.id,
        student_id=full_topic_student.id,
        supervisor_id=lecturer.id,
    )
    headers = await auth_headers(client, student)

    response = await client.get("/api/v1/topics?availability=available", headers=headers)

    assert response.status_code == 200
    codes = [item["code"] for item in response.json()["data"]["items"]]
    assert codes == [available_topic.code]


@pytest.mark.asyncio
async def test_get_missing_topic_returns_not_found(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    headers = await auth_headers(client, admin)

    response = await client.get(f"/api/v1/topics/{uuid4()}", headers=headers)

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "TOPIC_NOT_FOUND"


@pytest.mark.asyncio
async def test_student_cannot_get_pending_topic(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(test_session, period_id=period.id, lecturer_id=lecturer.id)
    headers = await auth_headers(client, student)

    response = await client.get(f"/api/v1/topics/{topic.id}", headers=headers)

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "TOPIC_NOT_FOUND"


@pytest.mark.asyncio
async def test_lecturer_can_update_own_pending_topic(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(test_session, period_id=period.id, lecturer_id=lecturer.id)
    headers = await auth_headers(client, lecturer)
    payload = topic_payload(period.id, code="UPDATED")
    payload["title"] = "Updated Topic Title"

    response = await client.put(f"/api/v1/topics/{topic.id}", headers=headers, json=payload)

    assert response.status_code == 200
    assert response.json()["data"]["code"] == "UPDATED"
    assert response.json()["data"]["title"] == "Updated Topic Title"


@pytest.mark.asyncio
async def test_non_owner_lecturer_cannot_update_topic(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    other_lecturer = await create_user(test_session, role=UserRole.LECTURER)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(test_session, period_id=period.id, lecturer_id=lecturer.id)
    headers = await auth_headers(client, other_lecturer)

    response = await client.put(
        f"/api/v1/topics/{topic.id}",
        headers=headers,
        json=topic_payload(period.id, code="OTHER"),
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_update_topic_rejects_status_field(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(test_session, period_id=period.id, lecturer_id=lecturer.id)
    headers = await auth_headers(client, lecturer)
    payload = topic_payload(period.id, code="UPDATED")
    payload["status"] = "approved"

    response = await client.put(f"/api/v1/topics/{topic.id}", headers=headers, json=payload)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_admin_can_approve_topic(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(test_session, period_id=period.id, lecturer_id=lecturer.id)
    headers = await auth_headers(client, admin)

    response = await client.put(f"/api/v1/topics/{topic.id}/approve", headers=headers)

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "approved"
    assert data["approved_by_id"] == str(admin.id)
    assert data["approved_at"] is not None


@pytest.mark.asyncio
async def test_non_admin_cannot_approve_topic(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(test_session, period_id=period.id, lecturer_id=lecturer.id)
    headers = await auth_headers(client, lecturer)

    response = await client.put(f"/api/v1/topics/{topic.id}/approve", headers=headers)

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_admin_can_reject_topic_with_reason(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(test_session, period_id=period.id, lecturer_id=lecturer.id)
    headers = await auth_headers(client, admin)

    response = await client.put(
        f"/api/v1/topics/{topic.id}/reject",
        headers=headers,
        json={"rejection_reason": "Scope is unclear."},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "rejected"
    assert data["rejection_reason"] == "Scope is unclear."


@pytest.mark.asyncio
async def test_reject_topic_requires_reason(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(test_session, period_id=period.id, lecturer_id=lecturer.id)
    headers = await auth_headers(client, admin)

    response = await client.put(
        f"/api/v1/topics/{topic.id}/reject",
        headers=headers,
        json={"rejection_reason": ""},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_admin_can_close_approved_topic(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
        status=TopicStatus.APPROVED,
    )
    headers = await auth_headers(client, admin)

    response = await client.patch(
        f"/api/v1/topics/{topic.id}/status",
        headers=headers,
        json={"status": "closed"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "closed"
    assert data["closed_at"] is not None


@pytest.mark.asyncio
async def test_status_update_rejects_invalid_transition(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(test_session, period_id=period.id, lecturer_id=lecturer.id)
    headers = await auth_headers(client, admin)

    response = await client.patch(
        f"/api/v1/topics/{topic.id}/status",
        headers=headers,
        json={"status": "completed"},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "TOPIC_INVALID_STATUS_TRANSITION"

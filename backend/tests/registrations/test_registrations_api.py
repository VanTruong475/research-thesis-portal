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


async def create_user(
    test_session: AsyncSession,
    *,
    password: str = "StrongPassword123!",
    role: UserRole = UserRole.STUDENT,
    status: UserStatus = UserStatus.ACTIVE,
) -> User:
    suffix = uuid4().hex[:12]
    user = User(
        institutional_code=f"U{suffix}",
        email=f"user-{suffix}@example.edu.vn",
        password_hash=hash_password(password),
        full_name="Nguyen Van A",
        role=role,
        status=status,
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
    return {"Authorization": f"Bearer {response.json()['data']['access_token']}"}


async def create_period(
    test_session: AsyncSession,
    *,
    admin_id,
    status: AcademicPeriodStatus = AcademicPeriodStatus.REGISTRATION_OPEN,
    in_current_window: bool = True,
) -> AcademicPeriod:
    suffix = uuid4().hex[:8]
    now = utc_now()
    if in_current_window:
        registration_start_at = now - timedelta(days=1)
        registration_end_at = now + timedelta(days=1)
    else:
        registration_start_at = now - timedelta(days=10)
        registration_end_at = now - timedelta(days=5)

    period = AcademicPeriod(
        code=f"KLTN-{suffix}",
        name="Graduation Thesis 2026",
        academic_year="2026-2027",
        semester=1,
        proposal_start_at=now - timedelta(days=20),
        proposal_end_at=now - timedelta(days=10),
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
    status: TopicStatus = TopicStatus.APPROVED,
    max_students: int = 2,
) -> Topic:
    suffix = uuid4().hex[:8]
    topic = Topic(
        academic_period_id=period_id,
        code=f"TOPIC-{suffix}",
        title="Artificial Intelligence Thesis",
        description="Research on applied artificial intelligence.",
        requirements="Python basics.",
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
    supervisor_id=None,
    status: RegistrationStatus = RegistrationStatus.PENDING,
) -> Registration:
    registration = Registration(
        academic_period_id=period_id,
        topic_id=topic_id,
        student_id=student_id,
        supervisor_id=supervisor_id,
        status=status,
        reviewed_at=utc_now() if status == RegistrationStatus.REJECTED else None,
        cancelled_at=utc_now() if status == RegistrationStatus.CANCELLED else None,
    )
    test_session.add(registration)
    await test_session.flush()
    await test_session.commit()
    return registration


@pytest.mark.asyncio
async def test_list_registrations_requires_authentication(client: AsyncClient):
    response = await client.get("/api/v1/registrations")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"


@pytest.mark.asyncio
async def test_student_can_create_registration(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
    )
    headers = await auth_headers(client, student)

    response = await client.post(
        "/api/v1/registrations",
        headers=headers,
        json={"topic_id": str(topic.id), "student_note": "I want this topic."},
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["topic_id"] == str(topic.id)
    assert data["student_id"] == str(student.id)
    assert data["academic_period_id"] == str(period.id)
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_lecturer_cannot_create_registration(
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
    )
    headers = await auth_headers(client, lecturer)

    response = await client.post(
        "/api/v1/registrations",
        headers=headers,
        json={"topic_id": str(topic.id)},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_create_registration_rejects_duplicate_effective_registration(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
    )
    other_topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
    )
    await create_registration(
        test_session,
        period_id=period.id,
        topic_id=topic.id,
        student_id=student.id,
    )
    headers = await auth_headers(client, student)

    response = await client.post(
        "/api/v1/registrations",
        headers=headers,
        json={"topic_id": str(other_topic.id)},
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "REGISTRATION_ALREADY_EFFECTIVE"


@pytest.mark.asyncio
async def test_create_registration_rejects_closed_registration_period(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(
        test_session,
        admin_id=admin.id,
        status=AcademicPeriodStatus.REGISTRATION_OPEN,
        in_current_window=False,
    )
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
    )
    headers = await auth_headers(client, student)

    response = await client.post(
        "/api/v1/registrations",
        headers=headers,
        json={"topic_id": str(topic.id)},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "REGISTRATION_PERIOD_CLOSED"


@pytest.mark.asyncio
async def test_create_registration_rejects_unapproved_topic(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        status=TopicStatus.PENDING_APPROVAL,
    )
    headers = await auth_headers(client, student)

    response = await client.post(
        "/api/v1/registrations",
        headers=headers,
        json={"topic_id": str(topic.id)},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "TOPIC_NOT_APPROVED"


@pytest.mark.asyncio
async def test_create_registration_rejects_full_topic(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    existing_student = await create_user(test_session, role=UserRole.STUDENT)
    new_student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
        max_students=1,
    )
    await create_registration(
        test_session,
        period_id=period.id,
        topic_id=topic.id,
        student_id=existing_student.id,
        supervisor_id=lecturer.id,
        status=RegistrationStatus.APPROVED,
    )
    headers = await auth_headers(client, new_student)

    response = await client.post(
        "/api/v1/registrations",
        headers=headers,
        json={"topic_id": str(topic.id)},
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "TOPIC_FULL"


@pytest.mark.asyncio
async def test_list_and_get_visibility_for_student_and_lecturer(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    other_lecturer = await create_user(test_session, role=UserRole.LECTURER)
    student = await create_user(test_session, role=UserRole.STUDENT)
    other_student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
    )
    registration = await create_registration(
        test_session,
        period_id=period.id,
        topic_id=topic.id,
        student_id=student.id,
    )

    student_headers = await auth_headers(client, student)
    other_student_headers = await auth_headers(client, other_student)
    lecturer_headers = await auth_headers(client, lecturer)
    other_lecturer_headers = await auth_headers(client, other_lecturer)

    student_list = await client.get("/api/v1/registrations", headers=student_headers)
    assert student_list.status_code == 200
    assert student_list.json()["data"]["items"][0]["id"] == str(registration.id)

    lecturer_get = await client.get(
        f"/api/v1/registrations/{registration.id}",
        headers=lecturer_headers,
    )
    assert lecturer_get.status_code == 200

    other_student_get = await client.get(
        f"/api/v1/registrations/{registration.id}",
        headers=other_student_headers,
    )
    assert other_student_get.status_code == 404
    assert other_student_get.json()["error"]["code"] == "REGISTRATION_NOT_FOUND"

    other_lecturer_get = await client.get(
        f"/api/v1/registrations/{registration.id}",
        headers=other_lecturer_headers,
    )
    assert other_lecturer_get.status_code == 404


@pytest.mark.asyncio
async def test_get_missing_registration_returns_not_found(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    headers = await auth_headers(client, admin)

    response = await client.get(f"/api/v1/registrations/{uuid4()}", headers=headers)

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "REGISTRATION_NOT_FOUND"


@pytest.mark.asyncio
async def test_lecturer_can_approve_registration_and_close_full_topic(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
        max_students=1,
    )
    registration = await create_registration(
        test_session,
        period_id=period.id,
        topic_id=topic.id,
        student_id=student.id,
    )
    headers = await auth_headers(client, lecturer)

    response = await client.put(
        f"/api/v1/registrations/{registration.id}/approve",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "approved"
    assert data["supervisor_id"] == str(lecturer.id)
    assert data["reviewed_by_id"] == str(lecturer.id)

    await test_session.refresh(topic)
    assert topic.status == TopicStatus.CLOSED


@pytest.mark.asyncio
async def test_unauthorized_lecturer_cannot_approve_registration(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    other_lecturer = await create_user(test_session, role=UserRole.LECTURER)
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
    )
    registration = await create_registration(
        test_session,
        period_id=period.id,
        topic_id=topic.id,
        student_id=student.id,
    )
    headers = await auth_headers(client, other_lecturer)

    response = await client.put(
        f"/api/v1/registrations/{registration.id}/approve",
        headers=headers,
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_approval_rejects_when_topic_capacity_is_full(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    approved_student = await create_user(test_session, role=UserRole.STUDENT)
    pending_student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
        max_students=1,
    )
    await create_registration(
        test_session,
        period_id=period.id,
        topic_id=topic.id,
        student_id=approved_student.id,
        supervisor_id=lecturer.id,
        status=RegistrationStatus.APPROVED,
    )
    pending = await create_registration(
        test_session,
        period_id=period.id,
        topic_id=topic.id,
        student_id=pending_student.id,
    )
    headers = await auth_headers(client, admin)

    response = await client.put(
        f"/api/v1/registrations/{pending.id}/approve",
        headers=headers,
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "TOPIC_FULL"


@pytest.mark.asyncio
async def test_admin_can_reject_registration(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
    )
    registration = await create_registration(
        test_session,
        period_id=period.id,
        topic_id=topic.id,
        student_id=student.id,
    )
    headers = await auth_headers(client, admin)

    response = await client.put(
        f"/api/v1/registrations/{registration.id}/reject",
        headers=headers,
        json={"review_reason": "Not enough prerequisite knowledge."},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "rejected"
    assert data["reviewed_by_id"] == str(admin.id)
    assert data["review_reason"] == "Not enough prerequisite knowledge."


@pytest.mark.asyncio
async def test_student_can_cancel_own_pending_registration(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
    )
    registration = await create_registration(
        test_session,
        period_id=period.id,
        topic_id=topic.id,
        student_id=student.id,
    )
    headers = await auth_headers(client, student)

    response = await client.patch(
        f"/api/v1/registrations/{registration.id}/cancel",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "cancelled"
    assert response.json()["data"]["cancelled_at"] is not None


@pytest.mark.asyncio
async def test_student_cannot_cancel_approved_or_in_progress_registration(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
    )
    registration = await create_registration(
        test_session,
        period_id=period.id,
        topic_id=topic.id,
        student_id=student.id,
        supervisor_id=lecturer.id,
        status=RegistrationStatus.APPROVED,
    )
    headers = await auth_headers(client, student)

    response = await client.patch(
        f"/api/v1/registrations/{registration.id}/cancel",
        headers=headers,
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "REGISTRATION_CANNOT_CANCEL"


@pytest.mark.asyncio
async def test_admin_can_assign_supervisor(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    new_supervisor = await create_user(test_session, role=UserRole.LECTURER)
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
    )
    registration = await create_registration(
        test_session,
        period_id=period.id,
        topic_id=topic.id,
        student_id=student.id,
        supervisor_id=lecturer.id,
        status=RegistrationStatus.APPROVED,
    )
    headers = await auth_headers(client, admin)

    response = await client.put(
        f"/api/v1/registrations/{registration.id}/assign-supervisor",
        headers=headers,
        json={"supervisor_id": str(new_supervisor.id)},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["supervisor_id"] == str(new_supervisor.id)
    assert data["supervisor_assigned_by_id"] == str(admin.id)
    assert data["supervisor_assigned_at"] is not None


@pytest.mark.asyncio
async def test_assign_supervisor_rejects_inactive_or_non_lecturer_user(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    inactive_lecturer = await create_user(
        test_session,
        role=UserRole.LECTURER,
        status=UserStatus.INACTIVE,
    )
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
    )
    registration = await create_registration(
        test_session,
        period_id=period.id,
        topic_id=topic.id,
        student_id=student.id,
        supervisor_id=lecturer.id,
        status=RegistrationStatus.APPROVED,
    )
    headers = await auth_headers(client, admin)

    response = await client.put(
        f"/api/v1/registrations/{registration.id}/assign-supervisor",
        headers=headers,
        json={"supervisor_id": str(inactive_lecturer.id)},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "SUPERVISOR_ASSIGNMENT_NOT_ALLOWED"

    response = await client.put(
        f"/api/v1/registrations/{registration.id}/assign-supervisor",
        headers=headers,
        json={"supervisor_id": str(student.id)},
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "SUPERVISOR_NOT_FOUND"


@pytest.mark.asyncio
async def test_registration_validation_errors(
    client: AsyncClient,
    test_session: AsyncSession,
):
    student = await create_user(test_session, role=UserRole.STUDENT)
    headers = await auth_headers(client, student)

    response = await client.post(
        "/api/v1/registrations",
        headers=headers,
        json={"topic_id": "not-a-uuid", "status": "approved"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"

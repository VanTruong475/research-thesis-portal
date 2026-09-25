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
) -> AcademicPeriod:
    suffix = uuid4().hex[:8]
    now = utc_now()
    period = AcademicPeriod(
        code=f"KLTN-{suffix}",
        name="Graduation Thesis 2026",
        academic_year="2026-2027",
        semester=1,
        proposal_start_at=now - timedelta(days=20),
        proposal_end_at=now - timedelta(days=10),
        registration_start_at=now - timedelta(days=1),
        registration_end_at=now + timedelta(days=1),
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
    max_students: int = 3,
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
        approved_by_id=(
            admin_id if status in {TopicStatus.APPROVED, TopicStatus.CLOSED} else None
        ),
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
    )
    test_session.add(registration)
    await test_session.flush()
    await test_session.commit()
    return registration


@pytest.mark.asyncio
async def test_member_a_dashboard_requires_authentication(client: AsyncClient):
    response = await client.get("/api/v1/dashboard/stats/member-a")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"


@pytest.mark.asyncio
async def test_admin_member_a_dashboard_returns_owned_module_counts(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    student = await create_user(test_session, role=UserRole.STUDENT)
    other_student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        status=TopicStatus.PENDING_APPROVAL,
    )
    approved_topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
        status=TopicStatus.APPROVED,
    )
    await create_registration(
        test_session,
        period_id=period.id,
        topic_id=approved_topic.id,
        student_id=student.id,
        status=RegistrationStatus.PENDING,
    )
    await create_registration(
        test_session,
        period_id=period.id,
        topic_id=approved_topic.id,
        student_id=other_student.id,
        supervisor_id=lecturer.id,
        status=RegistrationStatus.APPROVED,
    )
    headers = await auth_headers(client, admin)

    response = await client.get("/api/v1/dashboard/stats/member-a", headers=headers)

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["users_count"] == 4
    assert data["students_count"] == 2
    assert data["lecturers_count"] == 1
    assert data["active_periods_count"] == 1
    assert data["pending_topics_count"] == 1
    assert data["approved_topics_count"] == 1
    assert data["pending_registrations_count"] == 1
    assert data["approved_registrations_count"] == 1


@pytest.mark.asyncio
async def test_student_member_a_dashboard_counts_available_topics(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
    student = await create_user(test_session, role=UserRole.STUDENT)
    other_student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id)
    available_topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
        status=TopicStatus.APPROVED,
        max_students=2,
    )
    full_topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
        status=TopicStatus.APPROVED,
        max_students=1,
    )
    await create_registration(
        test_session,
        period_id=period.id,
        topic_id=full_topic.id,
        student_id=other_student.id,
        supervisor_id=lecturer.id,
        status=RegistrationStatus.APPROVED,
    )
    await create_registration(
        test_session,
        period_id=period.id,
        topic_id=available_topic.id,
        student_id=student.id,
        status=RegistrationStatus.PENDING,
    )
    headers = await auth_headers(client, student)

    response = await client.get("/api/v1/dashboard/stats/member-a", headers=headers)

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["available_topics_count"] == 1
    assert data["my_registrations_count"] == 1
    assert data["pending_registrations_count"] == 1
    assert data["active_registrations_count"] == 0

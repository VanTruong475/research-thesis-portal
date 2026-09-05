from datetime import timedelta
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, utc_now
from app.db.enums import (
    AcademicPeriodStatus,
    CouncilMemberRole,
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
    status: AcademicPeriodStatus = AcademicPeriodStatus.DEFENSE,
    defense_start_offset_days: int = -1,
    defense_end_offset_days: int = 7,
) -> AcademicPeriod:
    suffix = uuid4().hex[:8]
    now = utc_now()
    period = AcademicPeriod(
        code=f"KLTN-{suffix}",
        name="Graduation Thesis 2026",
        academic_year="2026-2027",
        semester=1,
        proposal_start_at=now - timedelta(days=40),
        proposal_end_at=now - timedelta(days=30),
        registration_start_at=now - timedelta(days=29),
        registration_end_at=now - timedelta(days=20),
        execution_start_at=now - timedelta(days=19),
        execution_end_at=now - timedelta(days=2),
        report_deadline_at=now - timedelta(days=2),
        defense_start_at=now + timedelta(days=defense_start_offset_days),
        defense_end_at=now + timedelta(days=defense_end_offset_days),
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
    admin_id,
    status: TopicStatus = TopicStatus.APPROVED,
) -> Topic:
    suffix = uuid4().hex[:8]
    topic = Topic(
        academic_period_id=period_id,
        code=f"TOPIC-{suffix}",
        title="Artificial Intelligence Thesis",
        description="Research on applied artificial intelligence.",
        requirements="Python basics.",
        max_students=2,
        proposed_by_id=lecturer_id,
        approved_by_id=admin_id if status in {TopicStatus.APPROVED, TopicStatus.CLOSED} else None,
        status=status,
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
        supervisor_id=supervisor_id if status in {RegistrationStatus.APPROVED, RegistrationStatus.IN_PROGRESS} else None,
        status=status,
        reviewed_at=utc_now() if status == RegistrationStatus.REJECTED else None,
        cancelled_at=utc_now() if status == RegistrationStatus.CANCELLED else None,
    )
    test_session.add(registration)
    await test_session.flush()
    await test_session.commit()
    return registration


async def create_context(test_session: AsyncSession):
    admin = await create_user(test_session, role=UserRole.ADMIN, full_name="Admin User")
    lecturer = await create_user(test_session, role=UserRole.LECTURER, full_name="Lecturer One")
    student = await create_user(test_session, role=UserRole.STUDENT, full_name="Student One")
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
    )
    return admin, lecturer, student, period, topic, registration


async def create_council(client: AsyncClient, admin_headers: dict[str, str], period_id) -> dict:
    response = await client.post(
        "/api/v1/councils",
        headers=admin_headers,
        json={
            "academic_period_id": str(period_id),
            "code": f"HD-{uuid4().hex[:8]}",
            "name": "Defense Council 1",
            "default_room": "A101",
        },
    )
    assert response.status_code == 201
    return response.json()["data"]


@pytest.mark.asyncio
async def test_admin_can_create_council_for_existing_academic_period(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, _, _, period, _, _ = await create_context(test_session)
    headers = await auth_headers(client, admin)

    response = await client.post(
        "/api/v1/councils",
        headers=headers,
        json={
            "academic_period_id": str(period.id),
            "code": "HD-001",
            "name": "Defense Council 1",
            "default_room": "A101",
        },
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["academic_period_id"] == str(period.id)
    assert data["code"] == "HD-001"
    assert data["status"] == "draft"


@pytest.mark.asyncio
async def test_duplicate_council_code_in_same_period_is_rejected(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, _, _, period, _, _ = await create_context(test_session)
    headers = await auth_headers(client, admin)
    payload = {
        "academic_period_id": str(period.id),
        "code": "HD-DUP",
        "name": "Defense Council 1",
    }

    first_response = await client.post("/api/v1/councils", headers=headers, json=payload)
    second_response = await client.post("/api/v1/councils", headers=headers, json=payload)

    assert first_response.status_code == 201
    assert second_response.status_code == 400
    assert second_response.json()["error"]["code"] == "COUNCIL_CODE_EXISTS"


@pytest.mark.asyncio
async def test_non_admin_cannot_create_council(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _admin, _lecturer, student, period, _, _ = await create_context(test_session)
    headers = await auth_headers(client, student)

    response = await client.post(
        "/api/v1/councils",
        headers=headers,
        json={
            "academic_period_id": str(period.id),
            "code": "HD-NA",
            "name": "Defense Council 1",
        },
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_assign_lecturer_as_council_member(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, lecturer, _, period, _, _ = await create_context(test_session)
    headers = await auth_headers(client, admin)
    council = await create_council(client, headers, period.id)

    response = await client.post(
        f"/api/v1/councils/{council['id']}/members",
        headers=headers,
        json={"lecturer_id": str(lecturer.id), "member_role": "chairperson"},
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["lecturer_id"] == str(lecturer.id)
    assert data["member_role"] == "chairperson"
    assert data["lecturer_full_name"] == lecturer.full_name


@pytest.mark.asyncio
async def test_assigning_non_lecturer_as_council_member_is_rejected(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, _, student, period, _, _ = await create_context(test_session)
    headers = await auth_headers(client, admin)
    council = await create_council(client, headers, period.id)

    response = await client.post(
        f"/api/v1/councils/{council['id']}/members",
        headers=headers,
        json={"lecturer_id": str(student.id), "member_role": "member"},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "COUNCIL_INVALID_LECTURER"


@pytest.mark.asyncio
async def test_duplicate_council_member_assignment_is_rejected(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, lecturer, _, period, _, _ = await create_context(test_session)
    headers = await auth_headers(client, admin)
    council = await create_council(client, headers, period.id)
    payload = {"lecturer_id": str(lecturer.id), "member_role": "member"}

    first_response = await client.post(
        f"/api/v1/councils/{council['id']}/members",
        headers=headers,
        json=payload,
    )
    second_response = await client.post(
        f"/api/v1/councils/{council['id']}/members",
        headers=headers,
        json=payload,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json()["error"]["code"] == "COUNCIL_MEMBER_DUPLICATED"


@pytest.mark.asyncio
async def test_admin_can_schedule_approved_registration_in_same_period(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, _, student, period, topic, registration = await create_context(test_session)
    headers = await auth_headers(client, admin)
    council = await create_council(client, headers, period.id)

    response = await client.post(
        f"/api/v1/councils/{council['id']}/schedules",
        headers=headers,
        json={
            "registration_id": str(registration.id),
            "scheduled_at": (utc_now() + timedelta(days=1)).isoformat(),
            "duration_minutes": 45,
            "room": "A101",
            "presentation_order": 1,
        },
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["registration_id"] == str(registration.id)
    assert data["topic_id"] == str(topic.id)
    assert data["topic_title"] == topic.title
    assert data["student_id"] == str(student.id)
    assert data["student_full_name"] == student.full_name
    assert data["academic_period_id"] == str(period.id)


@pytest.mark.asyncio
async def test_schedule_registration_from_different_period_is_rejected(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, lecturer, student, period, _, _ = await create_context(test_session)
    other_period = await create_period(test_session, admin_id=admin.id)
    other_topic = await create_topic(
        test_session,
        period_id=other_period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
    )
    other_registration = await create_registration(
        test_session,
        period_id=other_period.id,
        topic_id=other_topic.id,
        student_id=student.id,
        supervisor_id=lecturer.id,
    )
    headers = await auth_headers(client, admin)
    council = await create_council(client, headers, period.id)

    response = await client.post(
        f"/api/v1/councils/{council['id']}/schedules",
        headers=headers,
        json={
            "registration_id": str(other_registration.id),
            "scheduled_at": (utc_now() + timedelta(days=1)).isoformat(),
            "duration_minutes": 45,
            "room": "A101",
        },
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "COUNCIL_PERIOD_MISMATCH"


@pytest.mark.asyncio
async def test_second_schedule_for_same_registration_is_rejected(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, _, _, period, _, registration = await create_context(test_session)
    headers = await auth_headers(client, admin)
    first_council = await create_council(client, headers, period.id)
    second_council = await create_council(client, headers, period.id)
    payload = {
        "registration_id": str(registration.id),
        "scheduled_at": (utc_now() + timedelta(days=1)).isoformat(),
        "duration_minutes": 45,
        "room": "A101",
    }

    first_response = await client.post(
        f"/api/v1/councils/{first_council['id']}/schedules",
        headers=headers,
        json=payload,
    )
    second_response = await client.post(
        f"/api/v1/councils/{second_council['id']}/schedules",
        headers=headers,
        json=payload,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json()["error"]["code"] == "COUNCIL_REGISTRATION_ALREADY_SCHEDULED"


@pytest.mark.asyncio
async def test_duplicate_presentation_order_within_council_is_rejected(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, lecturer, _, period, _, registration = await create_context(test_session)
    other_student = await create_user(test_session, role=UserRole.STUDENT)
    other_topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=lecturer.id,
        admin_id=admin.id,
    )
    other_registration = await create_registration(
        test_session,
        period_id=period.id,
        topic_id=other_topic.id,
        student_id=other_student.id,
        supervisor_id=lecturer.id,
    )
    headers = await auth_headers(client, admin)
    council = await create_council(client, headers, period.id)

    first_response = await client.post(
        f"/api/v1/councils/{council['id']}/schedules",
        headers=headers,
        json={
            "registration_id": str(registration.id),
            "scheduled_at": (utc_now() + timedelta(days=1)).isoformat(),
            "duration_minutes": 45,
            "room": "A101",
            "presentation_order": 1,
        },
    )
    second_response = await client.post(
        f"/api/v1/councils/{council['id']}/schedules",
        headers=headers,
        json={
            "registration_id": str(other_registration.id),
            "scheduled_at": (utc_now() + timedelta(days=1)).isoformat(),
            "duration_minutes": 45,
            "room": "A102",
            "presentation_order": 1,
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json()["error"]["code"] == "COUNCIL_PRESENTATION_ORDER_DUPLICATED"


@pytest.mark.asyncio
async def test_schedule_outside_defense_interval_is_rejected(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, _, _, period, _, registration = await create_context(test_session)
    headers = await auth_headers(client, admin)
    council = await create_council(client, headers, period.id)

    response = await client.post(
        f"/api/v1/councils/{council['id']}/schedules",
        headers=headers,
        json={
            "registration_id": str(registration.id),
            "scheduled_at": (utc_now() + timedelta(days=30)).isoformat(),
            "duration_minutes": 45,
            "room": "A101",
        },
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "COUNCIL_SCHEDULE_OUTSIDE_DEFENSE_PERIOD"


@pytest.mark.asyncio
async def test_admin_can_view_all_councils_for_period(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, _, _, period, _, _ = await create_context(test_session)
    headers = await auth_headers(client, admin)
    first_council = await create_council(client, headers, period.id)
    second_council = await create_council(client, headers, period.id)

    response = await client.get(f"/api/v1/councils/period/{period.id}", headers=headers)

    assert response.status_code == 200
    ids = {council["id"] for council in response.json()["data"]}
    assert first_council["id"] in ids
    assert second_council["id"] in ids


@pytest.mark.asyncio
async def test_lecturer_sees_only_assigned_councils(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, lecturer, _, period, _, _ = await create_context(test_session)
    admin_headers = await auth_headers(client, admin)
    lecturer_headers = await auth_headers(client, lecturer)
    assigned_council = await create_council(client, admin_headers, period.id)
    unassigned_council = await create_council(client, admin_headers, period.id)

    member_response = await client.post(
        f"/api/v1/councils/{assigned_council['id']}/members",
        headers=admin_headers,
        json={"lecturer_id": str(lecturer.id), "member_role": CouncilMemberRole.MEMBER.value},
    )
    assert member_response.status_code == 201

    response = await client.get(f"/api/v1/councils/period/{period.id}", headers=lecturer_headers)

    assert response.status_code == 200
    ids = {council["id"] for council in response.json()["data"]}
    assert assigned_council["id"] in ids
    assert unassigned_council["id"] not in ids


@pytest.mark.asyncio
async def test_student_sees_only_own_scheduled_defense(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, _, student, period, _, registration = await create_context(test_session)
    other_student = await create_user(test_session, role=UserRole.STUDENT)
    admin_headers = await auth_headers(client, admin)
    student_headers = await auth_headers(client, student)
    other_student_headers = await auth_headers(client, other_student)
    council = await create_council(client, admin_headers, period.id)

    schedule_response = await client.post(
        f"/api/v1/councils/{council['id']}/schedules",
        headers=admin_headers,
        json={
            "registration_id": str(registration.id),
            "scheduled_at": (utc_now() + timedelta(days=1)).isoformat(),
            "duration_minutes": 45,
            "room": "A101",
        },
    )
    assert schedule_response.status_code == 201

    own_response = await client.get(f"/api/v1/councils/period/{period.id}", headers=student_headers)
    other_response = await client.get(
        f"/api/v1/councils/period/{period.id}",
        headers=other_student_headers,
    )

    assert own_response.status_code == 200
    assert other_response.status_code == 200
    assert [item["id"] for item in own_response.json()["data"]] == [council["id"]]
    assert other_response.json()["data"] == []

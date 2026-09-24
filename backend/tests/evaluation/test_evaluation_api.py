from datetime import timedelta
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, utc_now
from app.db.enums import (
    AcademicPeriodStatus,
    CouncilMemberRole,
    CouncilMemberStatus,
    CouncilStatus,
    DefenseScheduleStatus,
    EvaluationType,
    FinalResultStatus,
    RegistrationStatus,
    TopicStatus,
    UserRole,
    UserStatus,
)
from app.modules.academic_periods.model import AcademicPeriod
from app.modules.councils.model import Council, CouncilMember, DefenseSchedule
from app.modules.evaluation.model import FinalResult
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
        defense_start_at=now - timedelta(days=1),
        defense_end_at=now + timedelta(days=7),
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


async def create_council(
    test_session: AsyncSession,
    *,
    period_id,
    admin_id,
) -> Council:
    suffix = uuid4().hex[:8]
    council = Council(
        academic_period_id=period_id,
        code=f"HD-{suffix}",
        name="Defense Council 1",
        default_room="A101",
        status=CouncilStatus.SCHEDULED,
        created_by_id=admin_id,
    )
    test_session.add(council)
    await test_session.flush()
    await test_session.commit()
    return council


async def add_council_member(
    test_session: AsyncSession,
    *,
    council_id,
    lecturer_id,
    admin_id,
    status: CouncilMemberStatus = CouncilMemberStatus.ACTIVE,
) -> CouncilMember:
    member = CouncilMember(
        council_id=council_id,
        lecturer_id=lecturer_id,
        member_role=CouncilMemberRole.MEMBER,
        assigned_by_id=admin_id,
        status=status,
    )
    test_session.add(member)
    await test_session.flush()
    await test_session.commit()
    return member


async def create_defense_schedule(
    test_session: AsyncSession,
    *,
    council_id,
    registration_id,
    admin_id,
) -> DefenseSchedule:
    schedule = DefenseSchedule(
        council_id=council_id,
        registration_id=registration_id,
        scheduled_at=utc_now() + timedelta(days=1),
        duration_minutes=45,
        room="A101",
        presentation_order=1,
        status=DefenseScheduleStatus.SCHEDULED,
        created_by_id=admin_id,
    )
    test_session.add(schedule)
    await test_session.flush()
    await test_session.commit()
    return schedule


async def create_evaluation_context(test_session: AsyncSession):
    admin = await create_user(test_session, role=UserRole.ADMIN, full_name="Admin User")
    supervisor = await create_user(test_session, role=UserRole.LECTURER, full_name="Supervisor One")
    council_member = await create_user(test_session, role=UserRole.LECTURER, full_name="Council Member One")
    second_council_member = await create_user(
        test_session,
        role=UserRole.LECTURER,
        full_name="Council Member Two",
    )
    student = await create_user(test_session, role=UserRole.STUDENT, full_name="Student One")
    period = await create_period(test_session, admin_id=admin.id)
    topic = await create_topic(
        test_session,
        period_id=period.id,
        lecturer_id=supervisor.id,
        admin_id=admin.id,
    )
    registration = await create_registration(
        test_session,
        period_id=period.id,
        topic_id=topic.id,
        student_id=student.id,
        supervisor_id=supervisor.id,
    )
    council = await create_council(test_session, period_id=period.id, admin_id=admin.id)
    await add_council_member(
        test_session,
        council_id=council.id,
        lecturer_id=council_member.id,
        admin_id=admin.id,
    )
    await add_council_member(
        test_session,
        council_id=council.id,
        lecturer_id=second_council_member.id,
        admin_id=admin.id,
    )
    await create_defense_schedule(
        test_session,
        council_id=council.id,
        registration_id=registration.id,
        admin_id=admin.id,
    )
    return (
        admin,
        supervisor,
        council_member,
        second_council_member,
        student,
        period,
        topic,
        registration,
        council,
    )


async def submit_score(
    client: AsyncClient,
    headers: dict[str, str],
    *,
    registration_id,
    evaluation_type: EvaluationType,
    score: float = 8.0,
    council_id=None,
    is_submit: bool = True,
) -> dict:
    payload = {
        "registration_id": str(registration_id),
        "evaluation_type": evaluation_type.value,
        "score": score,
        "comments": "Good work.",
        "is_submit": is_submit,
    }
    if council_id is not None:
        payload["council_id"] = str(council_id)
    response = await client.post("/api/v1/scores", headers=headers, json=payload)
    assert response.status_code == 201
    return response.json()["data"]


async def submit_all_required_scores(
    client: AsyncClient,
    *,
    registration_id,
    council_id,
    supervisor: User,
    council_member: User,
    second_council_member: User,
) -> None:
    supervisor_headers = await auth_headers(client, supervisor)
    first_member_headers = await auth_headers(client, council_member)
    second_member_headers = await auth_headers(client, second_council_member)

    await submit_score(
        client,
        supervisor_headers,
        registration_id=registration_id,
        evaluation_type=EvaluationType.SUPERVISOR,
        score=8.0,
    )
    await submit_score(
        client,
        first_member_headers,
        registration_id=registration_id,
        evaluation_type=EvaluationType.COUNCIL,
        score=9.0,
        council_id=council_id,
    )
    await submit_score(
        client,
        second_member_headers,
        registration_id=registration_id,
        evaluation_type=EvaluationType.COUNCIL,
        score=7.0,
        council_id=council_id,
    )


@pytest.mark.asyncio
async def test_supervisor_can_submit_score_for_supervised_registration(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _, supervisor, _, _, student, _, topic, registration, _ = await create_evaluation_context(test_session)
    headers = await auth_headers(client, supervisor)

    response = await client.post(
        "/api/v1/scores",
        headers=headers,
        json={
            "registration_id": str(registration.id),
            "evaluation_type": "supervisor",
            "score": 8.5,
            "comments": "Good progress.",
            "is_submit": True,
        },
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["registration_id"] == str(registration.id)
    assert data["evaluator_id"] == str(supervisor.id)
    assert data["evaluation_type"] == "supervisor"
    assert data["status"] == "submitted"
    assert data["student_id"] == str(student.id)
    assert data["student_full_name"] == student.full_name
    assert data["topic_id"] == str(topic.id)
    assert data["topic_title"] == topic.title


@pytest.mark.asyncio
async def test_non_supervisor_cannot_submit_supervisor_score(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _, _, council_member, _, _, _, _, registration, _ = await create_evaluation_context(test_session)
    headers = await auth_headers(client, council_member)

    response = await client.post(
        "/api/v1/scores",
        headers=headers,
        json={
            "registration_id": str(registration.id),
            "evaluation_type": "supervisor",
            "score": 8.0,
        },
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "SCORE_PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_supervisor_score_with_council_id_is_rejected(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _, supervisor, _, _, _, _, _, registration, council = await create_evaluation_context(test_session)
    headers = await auth_headers(client, supervisor)

    response = await client.post(
        "/api/v1/scores",
        headers=headers,
        json={
            "registration_id": str(registration.id),
            "council_id": str(council.id),
            "evaluation_type": "supervisor",
            "score": 8.0,
        },
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "SCORE_COUNCIL_NOT_ALLOWED"


@pytest.mark.asyncio
async def test_active_council_member_can_submit_council_score(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _, _, council_member, _, student, _, topic, registration, council = await create_evaluation_context(test_session)
    headers = await auth_headers(client, council_member)

    response = await client.post(
        "/api/v1/scores",
        headers=headers,
        json={
            "registration_id": str(registration.id),
            "council_id": str(council.id),
            "evaluation_type": "council",
            "score": 9.0,
            "comments": "Strong defense.",
        },
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["registration_id"] == str(registration.id)
    assert data["council_id"] == str(council.id)
    assert data["evaluator_id"] == str(council_member.id)
    assert data["evaluation_type"] == "council"
    assert data["student_full_name"] == student.full_name
    assert data["topic_title"] == topic.title


@pytest.mark.asyncio
async def test_unassigned_lecturer_cannot_submit_council_score(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _, _, _, _, _, _, _, registration, council = await create_evaluation_context(test_session)
    other_lecturer = await create_user(test_session, role=UserRole.LECTURER)
    headers = await auth_headers(client, other_lecturer)

    response = await client.post(
        "/api/v1/scores",
        headers=headers,
        json={
            "registration_id": str(registration.id),
            "council_id": str(council.id),
            "evaluation_type": "council",
            "score": 8.0,
        },
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "SCORE_PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_inactive_council_member_cannot_submit_council_score(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, _, _, _, _, _, _, registration, council = await create_evaluation_context(test_session)
    inactive_member = await create_user(test_session, role=UserRole.LECTURER)
    await add_council_member(
        test_session,
        council_id=council.id,
        lecturer_id=inactive_member.id,
        admin_id=admin.id,
        status=CouncilMemberStatus.INACTIVE,
    )
    headers = await auth_headers(client, inactive_member)

    response = await client.post(
        "/api/v1/scores",
        headers=headers,
        json={
            "registration_id": str(registration.id),
            "council_id": str(council.id),
            "evaluation_type": "council",
            "score": 8.0,
        },
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "SCORE_PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_council_score_without_council_id_is_rejected(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _, _, council_member, _, _, _, _, registration, _ = await create_evaluation_context(test_session)
    headers = await auth_headers(client, council_member)

    response = await client.post(
        "/api/v1/scores",
        headers=headers,
        json={
            "registration_id": str(registration.id),
            "evaluation_type": "council",
            "score": 8.0,
        },
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "SCORE_COUNCIL_REQUIRED"


@pytest.mark.asyncio
async def test_score_outside_range_is_rejected(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _, supervisor, _, _, _, _, _, registration, _ = await create_evaluation_context(test_session)
    headers = await auth_headers(client, supervisor)

    response = await client.post(
        "/api/v1/scores",
        headers=headers,
        json={
            "registration_id": str(registration.id),
            "evaluation_type": "supervisor",
            "score": 11.0,
        },
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_admin_can_list_scores_and_unrelated_lecturer_cannot(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, supervisor, _, _, _, _, _, registration, _ = await create_evaluation_context(test_session)
    supervisor_headers = await auth_headers(client, supervisor)
    await submit_score(
        client,
        supervisor_headers,
        registration_id=registration.id,
        evaluation_type=EvaluationType.SUPERVISOR,
    )
    admin_headers = await auth_headers(client, admin)
    other_lecturer = await create_user(test_session, role=UserRole.LECTURER)
    other_headers = await auth_headers(client, other_lecturer)

    response = await client.get(f"/api/v1/scores?registration_id={registration.id}", headers=admin_headers)
    forbidden = await client.get(
        f"/api/v1/scores?registration_id={registration.id}",
        headers=other_headers,
    )

    assert response.status_code == 200
    assert len(response.json()["data"]) == 1
    assert forbidden.status_code == 403
    assert forbidden.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_final_calculation_fails_when_active_council_score_is_missing(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, supervisor, council_member, _, _, _, _, registration, council = await create_evaluation_context(test_session)
    supervisor_headers = await auth_headers(client, supervisor)
    member_headers = await auth_headers(client, council_member)
    admin_headers = await auth_headers(client, admin)
    await submit_score(
        client,
        supervisor_headers,
        registration_id=registration.id,
        evaluation_type=EvaluationType.SUPERVISOR,
        score=8.0,
    )
    await submit_score(
        client,
        member_headers,
        registration_id=registration.id,
        evaluation_type=EvaluationType.COUNCIL,
        score=9.0,
        council_id=council.id,
    )

    response = await client.post(
        f"/api/v1/registrations/{registration.id}/final-result/calculate",
        headers=admin_headers,
        json={},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "SCORE_INCOMPLETE"
    assert response.json()["error"]["details"]["submitted_council_score_count"] == 1


@pytest.mark.asyncio
async def test_admin_can_calculate_final_result_when_all_required_scores_exist(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, supervisor, council_member, second_member, student, _, topic, registration, council = await create_evaluation_context(test_session)
    await submit_all_required_scores(
        client,
        registration_id=registration.id,
        council_id=council.id,
        supervisor=supervisor,
        council_member=council_member,
        second_council_member=second_member,
    )
    admin_headers = await auth_headers(client, admin)

    response = await client.post(
        f"/api/v1/registrations/{registration.id}/final-result/calculate",
        headers=admin_headers,
        json={},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["registration_id"] == str(registration.id)
    assert data["supervisor_score"] == 8.0
    assert data["council_average_score"] == 8.0
    assert data["supervisor_weight"] == 40.0
    assert data["council_weight"] == 60.0
    assert data["final_score"] == 8.0
    assert data["classification"] == "good"
    assert data["status"] == "calculated"
    assert data["student_id"] == str(student.id)
    assert data["topic_title"] == topic.title


@pytest.mark.asyncio
async def test_non_admin_cannot_calculate_or_publish_final_result(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _, supervisor, council_member, second_member, _, _, _, registration, council = await create_evaluation_context(test_session)
    await submit_all_required_scores(
        client,
        registration_id=registration.id,
        council_id=council.id,
        supervisor=supervisor,
        council_member=council_member,
        second_council_member=second_member,
    )
    supervisor_headers = await auth_headers(client, supervisor)

    calculate_response = await client.post(
        f"/api/v1/registrations/{registration.id}/final-result/calculate",
        headers=supervisor_headers,
        json={},
    )
    publish_response = await client.post(
        f"/api/v1/registrations/{registration.id}/final-result/publish",
        headers=supervisor_headers,
        json={},
    )

    assert calculate_response.status_code == 403
    assert calculate_response.json()["error"]["code"] == "PERMISSION_DENIED"
    assert publish_response.status_code == 403
    assert publish_response.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_publishing_final_result_locks_related_scores(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, supervisor, council_member, second_member, _, _, _, registration, council = await create_evaluation_context(test_session)
    await submit_all_required_scores(
        client,
        registration_id=registration.id,
        council_id=council.id,
        supervisor=supervisor,
        council_member=council_member,
        second_council_member=second_member,
    )
    admin_headers = await auth_headers(client, admin)
    calculate_response = await client.post(
        f"/api/v1/registrations/{registration.id}/final-result/calculate",
        headers=admin_headers,
        json={},
    )
    assert calculate_response.status_code == 200

    response = await client.post(
        f"/api/v1/registrations/{registration.id}/final-result/publish",
        headers=admin_headers,
        json={},
    )
    scores_response = await client.get(f"/api/v1/scores?registration_id={registration.id}", headers=admin_headers)

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "published"
    assert response.json()["data"]["published_by_id"] == str(admin.id)
    assert scores_response.status_code == 200
    for score in scores_response.json()["data"]:
        assert score["status"] == "locked"
        assert score["locked_at"] is not None


@pytest.mark.asyncio
async def test_score_cannot_be_edited_after_final_result_publication(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, supervisor, council_member, second_member, _, _, _, registration, council = await create_evaluation_context(test_session)
    await submit_all_required_scores(
        client,
        registration_id=registration.id,
        council_id=council.id,
        supervisor=supervisor,
        council_member=council_member,
        second_council_member=second_member,
    )
    admin_headers = await auth_headers(client, admin)
    supervisor_headers = await auth_headers(client, supervisor)
    calculate_response = await client.post(
        f"/api/v1/registrations/{registration.id}/final-result/calculate",
        headers=admin_headers,
        json={},
    )
    assert calculate_response.status_code == 200
    publish_response = await client.post(
        f"/api/v1/registrations/{registration.id}/final-result/publish",
        headers=admin_headers,
        json={},
    )
    assert publish_response.status_code == 200

    response = await client.post(
        "/api/v1/scores",
        headers=supervisor_headers,
        json={
            "registration_id": str(registration.id),
            "evaluation_type": "supervisor",
            "score": 9.0,
        },
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "SCORE_RESULT_ALREADY_PUBLISHED"


@pytest.mark.asyncio
async def test_student_cannot_view_final_result_before_publication(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, _, _, _, student, _, _, registration, _ = await create_evaluation_context(test_session)
    result = FinalResult(
        registration_id=registration.id,
        supervisor_score=8.0,
        council_average_score=8.0,
        supervisor_weight=40.0,
        council_weight=60.0,
        final_score=8.0,
        status=FinalResultStatus.CALCULATED,
        calculated_at=utc_now(),
        calculated_by_id=admin.id,
    )
    test_session.add(result)
    await test_session.flush()
    await test_session.commit()
    headers = await auth_headers(client, student)

    response = await client.get(
        f"/api/v1/registrations/{registration.id}/final-result",
        headers=headers,
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_student_can_view_only_own_published_final_result(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, supervisor, council_member, second_member, student, _, _, registration, council = await create_evaluation_context(test_session)
    await submit_all_required_scores(
        client,
        registration_id=registration.id,
        council_id=council.id,
        supervisor=supervisor,
        council_member=council_member,
        second_council_member=second_member,
    )
    admin_headers = await auth_headers(client, admin)
    calculate_response = await client.post(
        f"/api/v1/registrations/{registration.id}/final-result/calculate",
        headers=admin_headers,
        json={},
    )
    assert calculate_response.status_code == 200
    publish_response = await client.post(
        f"/api/v1/registrations/{registration.id}/final-result/publish",
        headers=admin_headers,
        json={},
    )
    assert publish_response.status_code == 200
    student_headers = await auth_headers(client, student)
    other_student = await create_user(test_session, role=UserRole.STUDENT)
    other_student_headers = await auth_headers(client, other_student)

    response = await client.get(
        f"/api/v1/registrations/{registration.id}/final-result",
        headers=student_headers,
    )
    forbidden = await client.get(
        f"/api/v1/registrations/{registration.id}/final-result",
        headers=other_student_headers,
    )

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "published"
    assert forbidden.status_code == 403
    assert forbidden.json()["error"]["code"] == "PERMISSION_DENIED"

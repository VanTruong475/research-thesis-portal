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
from app.modules.reports.model import Report
from app.modules.reports.service import MAX_FILE_SIZE_BYTES
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
    status: AcademicPeriodStatus = AcademicPeriodStatus.IN_PROGRESS,
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
        registration_start_at=now - timedelta(days=9),
        registration_end_at=now - timedelta(days=1),
        execution_start_at=now - timedelta(days=1),
        execution_end_at=now + timedelta(days=30),
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


async def create_report(
    test_session: AsyncSession,
    *,
    registration_id,
    topic_id,
    student_id,
    version: int = 1,
) -> Report:
    report = Report(
        registration_id=registration_id,
        topic_id=topic_id,
        student_id=student_id,
        file_name=f"report-v{version}.pdf",
        file_path=f"uploads/reports/report-v{version}.pdf",
        file_size=12,
        version=version,
        submitted_at=utc_now(),
    )
    test_session.add(report)
    await test_session.flush()
    await test_session.commit()
    return report


async def create_report_context(
    test_session: AsyncSession,
    *,
    period_status: AcademicPeriodStatus = AcademicPeriodStatus.IN_PROGRESS,
    registration_status: RegistrationStatus = RegistrationStatus.APPROVED,
    supervisor: User | None = None,
    topic_lecturer: User | None = None,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = topic_lecturer or await create_user(test_session, role=UserRole.LECTURER)
    assigned_supervisor = supervisor or lecturer
    student = await create_user(test_session, role=UserRole.STUDENT)
    period = await create_period(test_session, admin_id=admin.id, status=period_status)
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
        supervisor_id=assigned_supervisor.id,
        status=registration_status,
    )
    return admin, lecturer, assigned_supervisor, student, period, topic, registration


@pytest.fixture(autouse=True)
def use_temp_upload_dir(monkeypatch: pytest.MonkeyPatch, tmp_path):
    monkeypatch.setattr("app.modules.reports.service.UPLOAD_DIR", str(tmp_path / "reports"))


@pytest.mark.asyncio
async def test_student_can_upload_report_for_own_approved_registration_in_progress_period(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _, _, _, student, _, topic, registration = await create_report_context(test_session)
    headers = await auth_headers(client, student)

    response = await client.post(
        "/api/v1/reports",
        headers=headers,
        data={"registration_id": str(registration.id)},
        files={"file": ("report.pdf", b"report content", "application/pdf")},
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["registration_id"] == str(registration.id)
    assert data["topic_id"] == str(topic.id)
    assert data["student_id"] == str(student.id)
    assert data["version"] == 1


@pytest.mark.asyncio
async def test_student_cannot_upload_report_for_another_students_registration(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _, _, _, _student, _, _, registration = await create_report_context(test_session)
    other_student = await create_user(test_session, role=UserRole.STUDENT)
    headers = await auth_headers(client, other_student)

    response = await client.post(
        "/api/v1/reports",
        headers=headers,
        data={"registration_id": str(registration.id)},
        files={"file": ("report.pdf", b"report content", "application/pdf")},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "registration_status",
    [
        RegistrationStatus.PENDING,
        RegistrationStatus.REJECTED,
        RegistrationStatus.CANCELLED,
        RegistrationStatus.IN_PROGRESS,
    ],
)
async def test_student_cannot_upload_report_when_registration_is_not_approved(
    client: AsyncClient,
    test_session: AsyncSession,
    registration_status: RegistrationStatus,
):
    _, _, _, student, _, _, registration = await create_report_context(
        test_session,
        registration_status=registration_status,
    )
    headers = await auth_headers(client, student)

    response = await client.post(
        "/api/v1/reports",
        headers=headers,
        data={"registration_id": str(registration.id)},
        files={"file": ("report.pdf", b"report content", "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "REPORT_REGISTRATION_NOT_APPROVED"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "period_status",
    [
        AcademicPeriodStatus.PROPOSAL_OPEN,
        AcademicPeriodStatus.REGISTRATION_OPEN,
        AcademicPeriodStatus.DEFENSE,
        AcademicPeriodStatus.COMPLETED,
        AcademicPeriodStatus.CANCELLED,
    ],
)
async def test_student_cannot_upload_report_outside_in_progress_academic_period(
    client: AsyncClient,
    test_session: AsyncSession,
    period_status: AcademicPeriodStatus,
):
    _, _, _, student, _, _, registration = await create_report_context(
        test_session,
        period_status=period_status,
    )
    headers = await auth_headers(client, student)

    response = await client.post(
        "/api/v1/reports",
        headers=headers,
        data={"registration_id": str(registration.id)},
        files={"file": ("report.pdf", b"report content", "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "REPORT_PERIOD_NOT_IN_PROGRESS"


@pytest.mark.asyncio
async def test_report_upload_increments_version_per_registration_not_topic(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin = await create_user(test_session, role=UserRole.ADMIN)
    lecturer = await create_user(test_session, role=UserRole.LECTURER)
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
        supervisor_id=lecturer.id,
    )
    other_registration = await create_registration(
        test_session,
        period_id=period.id,
        topic_id=topic.id,
        student_id=other_student.id,
        supervisor_id=lecturer.id,
    )
    await create_report(
        test_session,
        registration_id=other_registration.id,
        topic_id=topic.id,
        student_id=other_student.id,
        version=1,
    )
    await create_report(
        test_session,
        registration_id=registration.id,
        topic_id=topic.id,
        student_id=student.id,
        version=1,
    )
    headers = await auth_headers(client, student)

    response = await client.post(
        "/api/v1/reports",
        headers=headers,
        data={"registration_id": str(registration.id)},
        files={"file": ("report-v2.pdf", b"new report content", "application/pdf")},
    )

    assert response.status_code == 201
    assert response.json()["data"]["version"] == 2


@pytest.mark.asyncio
async def test_anonymous_user_cannot_read_registration_reports(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _, _, _, _student, _, _, registration = await create_report_context(test_session)

    response = await client.get(f"/api/v1/registrations/{registration.id}/reports")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"


@pytest.mark.asyncio
async def test_student_can_read_only_own_registration_reports(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _, _, _, student, _, topic, registration = await create_report_context(test_session)
    other_student = await create_user(test_session, role=UserRole.STUDENT)
    report = await create_report(
        test_session,
        registration_id=registration.id,
        topic_id=topic.id,
        student_id=student.id,
    )
    student_headers = await auth_headers(client, student)
    other_student_headers = await auth_headers(client, other_student)

    response = await client.get(
        f"/api/v1/registrations/{registration.id}/reports",
        headers=student_headers,
    )
    assert response.status_code == 200
    assert response.json()["data"][0]["id"] == str(report.id)

    forbidden = await client.get(
        f"/api/v1/registrations/{registration.id}/reports",
        headers=other_student_headers,
    )
    assert forbidden.status_code == 403
    assert forbidden.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_lecturer_can_read_only_supervised_registration_reports(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _, _, supervisor, student, _, topic, registration = await create_report_context(test_session)
    other_lecturer = await create_user(test_session, role=UserRole.LECTURER)
    report = await create_report(
        test_session,
        registration_id=registration.id,
        topic_id=topic.id,
        student_id=student.id,
    )
    supervisor_headers = await auth_headers(client, supervisor)
    other_lecturer_headers = await auth_headers(client, other_lecturer)

    response = await client.get(
        f"/api/v1/registrations/{registration.id}/reports",
        headers=supervisor_headers,
    )
    assert response.status_code == 200
    assert response.json()["data"][0]["id"] == str(report.id)

    forbidden = await client.get(
        f"/api/v1/registrations/{registration.id}/reports",
        headers=other_lecturer_headers,
    )
    assert forbidden.status_code == 403
    assert forbidden.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_topic_proposer_who_is_not_assigned_supervisor_cannot_read_reports(
    client: AsyncClient,
    test_session: AsyncSession,
):
    topic_proposer = await create_user(test_session, role=UserRole.LECTURER)
    assigned_supervisor = await create_user(test_session, role=UserRole.LECTURER)
    _, _, _, student, _, topic, registration = await create_report_context(
        test_session,
        topic_lecturer=topic_proposer,
        supervisor=assigned_supervisor,
    )
    await create_report(
        test_session,
        registration_id=registration.id,
        topic_id=topic.id,
        student_id=student.id,
    )
    headers = await auth_headers(client, topic_proposer)

    response = await client.get(
        f"/api/v1/registrations/{registration.id}/reports",
        headers=headers,
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_admin_can_read_registration_reports_for_oversight(
    client: AsyncClient,
    test_session: AsyncSession,
):
    admin, _, _, student, _, topic, registration = await create_report_context(test_session)
    report = await create_report(
        test_session,
        registration_id=registration.id,
        topic_id=topic.id,
        student_id=student.id,
    )
    headers = await auth_headers(client, admin)

    response = await client.get(
        f"/api/v1/registrations/{registration.id}/reports",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["data"][0]["id"] == str(report.id)


@pytest.mark.asyncio
async def test_upload_rejects_empty_report_file(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _, _, _, student, _, _, registration = await create_report_context(test_session)
    headers = await auth_headers(client, student)

    response = await client.post(
        "/api/v1/reports",
        headers=headers,
        data={"registration_id": str(registration.id)},
        files={"file": ("empty.pdf", b"", "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "REPORT_FILE_EMPTY"


@pytest.mark.asyncio
async def test_upload_rejects_report_file_over_20mb(
    client: AsyncClient,
    test_session: AsyncSession,
):
    _, _, _, student, _, _, registration = await create_report_context(test_session)
    headers = await auth_headers(client, student)
    too_large_content = b"0" * (MAX_FILE_SIZE_BYTES + 1)

    response = await client.post(
        "/api/v1/reports",
        headers=headers,
        data={"registration_id": str(registration.id)},
        files={"file": ("too-large.pdf", too_large_content, "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "REPORT_FILE_TOO_LARGE"

import math
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import AppException, NotFoundException
from app.core.security import utc_now
from app.db.enums import (
    AcademicPeriodStatus,
    RegistrationStatus,
    TopicStatus,
    UserRole,
    UserStatus,
)
from app.modules.registrations.model import Registration
from app.modules.registrations.repository import RegistrationRepository
from app.modules.registrations.schemas import (
    AssignSupervisorRequest,
    PaginationResponse,
    RegistrationCreateRequest,
    RegistrationListResponse,
    RegistrationRejectRequest,
    RegistrationResponse,
)
from app.modules.users.model import User
from app.modules.users.schemas import LecturerWorkloadResponse

_FULL_TOPIC_REJECTION_REASON = "Topic has reached its maximum number of students."


class RegistrationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repository = RegistrationRepository(db)

    async def list_registrations(
        self,
        *,
        current_user: User,
        page: int,
        page_size: int,
        status: RegistrationStatus | None = None,
        student_id: UUID | None = None,
        topic_id: UUID | None = None,
        academic_period_id: UUID | None = None,
        supervisor_id: UUID | None = None,
    ) -> RegistrationListResponse:
        scoped_student_id = student_id
        lecturer_visible_id = None
        if current_user.role == UserRole.STUDENT:
            if student_id is not None and student_id != current_user.id:
                raise self._permission_denied()
            scoped_student_id = current_user.id
        elif current_user.role == UserRole.LECTURER:
            lecturer_visible_id = current_user.id
        elif current_user.role != UserRole.ADMIN:
            raise self._permission_denied()

        registrations, total_items = await self.repository.list_registrations(
            page=page,
            page_size=page_size,
            status=status,
            student_id=scoped_student_id,
            topic_id=topic_id,
            academic_period_id=academic_period_id,
            supervisor_id=supervisor_id,
            lecturer_visible_id=lecturer_visible_id,
        )
        total_pages = math.ceil(total_items / page_size) if total_items else 0
        return RegistrationListResponse(
            items=[RegistrationResponse.model_validate(item) for item in registrations],
            pagination=PaginationResponse(
                page=page,
                page_size=page_size,
                total_items=total_items,
                total_pages=total_pages,
            ),
        )

    async def create_registration(
        self,
        payload: RegistrationCreateRequest,
        student: User,
    ) -> RegistrationResponse:
        if student.role != UserRole.STUDENT:
            raise self._permission_denied()

        topic = await self.repository.get_topic_by_id(payload.topic_id)
        if topic is None:
            raise NotFoundException(message="Topic not found.", error_code="TOPIC_NOT_FOUND")
        self._ensure_topic_accepts_registration(topic)

        existing = await self.repository.get_effective_registration_for_student_period(
            student_id=student.id,
            academic_period_id=topic.academic_period_id,
        )
        if existing is not None:
            raise AppException(
                status_code=409,
                message="The student already has an effective registration in this academic period.",
                code="REGISTRATION_ALREADY_EFFECTIVE",
                details={"registration_id": str(existing.id)},
            )

        await self._ensure_topic_has_capacity(topic.id, topic.max_students)
        registration = Registration(
            academic_period_id=topic.academic_period_id,
            topic_id=topic.id,
            student_id=student.id,
            status=RegistrationStatus.PENDING,
            student_note=payload.student_note,
        )
        try:
            await self.repository.create(registration)
            registration_id = registration.id
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            raise AppException(
                status_code=409,
                message="The student already has an effective registration in this academic period.",
                code="REGISTRATION_ALREADY_EFFECTIVE",
            ) from exc
        return await self._get_registration_response_or_raise(registration_id)

    async def get_registration(
        self,
        registration_id: UUID,
        current_user: User,
    ) -> RegistrationResponse:
        registration = await self._get_registration_or_raise(registration_id)
        self._ensure_user_can_view(registration, current_user)
        return RegistrationResponse.model_validate(registration)

    async def approve_registration(
        self,
        registration_id: UUID,
        reviewer: User,
    ) -> RegistrationResponse:
        registration = await self.repository.get_by_id_for_update(registration_id)
        if registration is None:
            raise NotFoundException(
                message="Registration not found.",
                error_code="REGISTRATION_NOT_FOUND",
            )
        self._ensure_user_can_review(registration, reviewer)
        if registration.status != RegistrationStatus.PENDING:
            raise AppException(
                status_code=409,
                message="Registration is not pending.",
                code="REGISTRATION_INVALID_STATUS",
                details={"current_status": registration.status.value},
            )

        topic = await self.repository.get_topic_by_id_for_update(registration.topic_id)
        if topic is None:
            raise NotFoundException(message="Topic not found.", error_code="TOPIC_NOT_FOUND")
        registration.topic = topic
        self._ensure_topic_accepts_registration(topic)

        existing = await self.repository.get_effective_registration_for_student_period(
            student_id=registration.student_id,
            academic_period_id=registration.academic_period_id,
            exclude_registration_id=registration.id,
        )
        if existing is not None:
            raise AppException(
                status_code=409,
                message="The student already has an effective registration in this academic period.",
                code="REGISTRATION_ALREADY_EFFECTIVE",
                details={"registration_id": str(existing.id)},
            )

        accepted_count = await self.repository.count_accepted_registrations_for_topic(topic.id)
        if accepted_count >= topic.max_students:
            raise AppException(
                status_code=409,
                message="The topic has reached its maximum number of students.",
                code="TOPIC_FULL",
                details={"topic_id": str(topic.id)},
            )

        now = utc_now()
        registration.status = RegistrationStatus.APPROVED
        registration.supervisor_id = topic.proposed_by_id
        registration.reviewed_by_id = reviewer.id
        registration.reviewed_at = now
        registration.review_reason = None

        if accepted_count + 1 >= topic.max_students:
            topic.status = TopicStatus.CLOSED
            topic.closed_at = now
            await self.repository.reject_pending_registrations_for_full_topic(
                topic_id=topic.id,
                approved_registration_id=registration.id,
                reviewer_id=reviewer.id,
                reviewed_at=now,
                reason=_FULL_TOPIC_REJECTION_REASON,
            )

        registration_id = registration.id
        await self.repository.update(registration)
        await self.db.commit()
        return await self._get_registration_response_or_raise(registration_id)

    async def reject_registration(
        self,
        registration_id: UUID,
        payload: RegistrationRejectRequest,
        reviewer: User,
    ) -> RegistrationResponse:
        registration = await self._get_registration_or_raise(registration_id)
        self._ensure_user_can_review(registration, reviewer)
        if registration.status != RegistrationStatus.PENDING:
            raise AppException(
                status_code=409,
                message="Registration is not pending.",
                code="REGISTRATION_INVALID_STATUS",
                details={"current_status": registration.status.value},
            )

        registration.status = RegistrationStatus.REJECTED
        registration.review_reason = payload.review_reason
        registration.reviewed_by_id = reviewer.id
        registration.reviewed_at = utc_now()
        registration_id = registration.id
        await self.repository.update(registration)
        await self.db.commit()
        return await self._get_registration_response_or_raise(registration_id)

    async def cancel_registration(
        self,
        registration_id: UUID,
        student: User,
    ) -> RegistrationResponse:
        if student.role != UserRole.STUDENT:
            raise self._permission_denied()
        registration = await self._get_registration_or_raise(registration_id)
        if registration.student_id != student.id:
            raise self._permission_denied()
        if registration.status != RegistrationStatus.PENDING:
            raise AppException(
                status_code=400,
                message="Only pending registrations can be cancelled by the student.",
                code="REGISTRATION_CANNOT_CANCEL",
                details={"current_status": registration.status.value},
            )

        registration.status = RegistrationStatus.CANCELLED
        registration.cancelled_at = utc_now()
        registration_id = registration.id
        await self.repository.update(registration)
        await self.db.commit()
        return await self._get_registration_response_or_raise(registration_id)

    async def assign_supervisor(
        self,
        registration_id: UUID,
        payload: AssignSupervisorRequest,
        admin: User,
    ) -> RegistrationResponse:
        if admin.role != UserRole.ADMIN:
            raise self._permission_denied()
        registration = await self._get_registration_or_raise(registration_id)
        supervisor = await self.repository.get_user_by_id(payload.supervisor_id)
        if supervisor is None or supervisor.role != UserRole.LECTURER:
            raise AppException(
                status_code=404,
                message="Supervisor not found.",
                code="SUPERVISOR_NOT_FOUND",
            )
        if supervisor.status != UserStatus.ACTIVE:
            raise AppException(
                status_code=400,
                message="Supervisor is inactive.",
                code="SUPERVISOR_ASSIGNMENT_NOT_ALLOWED",
                details={"supervisor_id": str(payload.supervisor_id)},
            )
        if registration.status not in {
            RegistrationStatus.APPROVED,
            RegistrationStatus.IN_PROGRESS,
        }:
            raise AppException(
                status_code=400,
                message="Supervisor assignment is allowed only for approved or in-progress registrations.",
                code="SUPERVISOR_ASSIGNMENT_NOT_ALLOWED",
                details={"current_status": registration.status.value},
            )

        registration.supervisor_id = supervisor.id
        registration.supervisor_assigned_by_id = admin.id
        registration.supervisor_assigned_at = utc_now()
        registration_id = registration.id
        await self.repository.update(registration)
        await self.db.commit()
        return await self._get_registration_response_or_raise(registration_id)

    async def _get_registration_or_raise(self, registration_id: UUID) -> Registration:
        registration = await self.repository.get_by_id(registration_id)
        if registration is None:
            raise NotFoundException(
                message="Registration not found.",
                error_code="REGISTRATION_NOT_FOUND",
            )
        return registration

    async def _get_registration_response_or_raise(self, registration_id: UUID) -> RegistrationResponse:
        registration = await self.repository.get_response_by_id(registration_id)
        if registration is None:
            raise NotFoundException(
                message="Registration not found.",
                error_code="REGISTRATION_NOT_FOUND",
            )
        return RegistrationResponse.model_validate(registration)

    def _ensure_topic_accepts_registration(self, topic) -> None:
        period = topic.academic_period
        now = utc_now()
        if topic.status != TopicStatus.APPROVED:
            raise AppException(
                status_code=400,
                message="The topic is not approved for registration.",
                code="TOPIC_NOT_APPROVED",
                details={"topic_id": str(topic.id), "status": topic.status.value},
            )
        if period.status != AcademicPeriodStatus.REGISTRATION_OPEN:
            raise AppException(
                status_code=400,
                message="Registration period is not open.",
                code="REGISTRATION_PERIOD_CLOSED",
                details={"academic_period_id": str(period.id), "status": period.status.value},
            )
        if not (period.registration_start_at <= now <= period.registration_end_at):
            raise AppException(
                status_code=400,
                message="Registration period is closed.",
                code="REGISTRATION_PERIOD_CLOSED",
                details={"academic_period_id": str(period.id)},
            )

    async def _ensure_topic_has_capacity(self, topic_id: UUID, max_students: int) -> None:
        accepted_count = await self.repository.count_accepted_registrations_for_topic(topic_id)
        if accepted_count >= max_students:
            raise AppException(
                status_code=409,
                message="The topic has reached its maximum number of students.",
                code="TOPIC_FULL",
                details={"topic_id": str(topic_id)},
            )

    def _ensure_user_can_view(self, registration: Registration, current_user: User) -> None:
        if current_user.role == UserRole.ADMIN:
            return
        if current_user.role == UserRole.STUDENT and registration.student_id == current_user.id:
            return
        if current_user.role == UserRole.LECTURER and (
            registration.topic.proposed_by_id == current_user.id
            or registration.supervisor_id == current_user.id
        ):
            return
        raise NotFoundException(
            message="Registration not found.",
            error_code="REGISTRATION_NOT_FOUND",
        )

    def _ensure_user_can_review(self, registration: Registration, reviewer: User) -> None:
        if reviewer.role == UserRole.ADMIN:
            return
        if reviewer.role == UserRole.LECTURER and registration.topic.proposed_by_id == reviewer.id:
            return
        raise self._permission_denied()

    def _permission_denied(self) -> AppException:
        return AppException(
            status_code=403,
            message="You do not have permission to perform this action.",
            code="PERMISSION_DENIED",
        )


class LecturerService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repository = RegistrationRepository(db)

    async def get_lecturer_workload(self, lecturer_id: UUID) -> LecturerWorkloadResponse:
        lecturer = await self.repository.get_active_lecturer(lecturer_id)
        if lecturer is None:
            raise NotFoundException(message="Lecturer not found.", error_code="SUPERVISOR_NOT_FOUND")
        assigned_count = await self.repository.count_assigned_registrations_for_supervisor(lecturer_id)
        return LecturerWorkloadResponse.model_validate(
            {
                "lecturer_id": lecturer.id,
                "lecturer_name": lecturer.full_name,
                "email": lecturer.email,
                "current_assigned_count": assigned_count,
            }
        )


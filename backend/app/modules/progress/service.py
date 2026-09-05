from collections.abc import Sequence
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import AppException, NotFoundException
from app.core.security import utc_now
from app.db.enums import AcademicPeriodStatus, RegistrationStatus, UserRole
from app.modules.progress.model import ProgressLog
from app.modules.progress.repository import ProgressRepository
from app.modules.progress.schemas import (
    AddTeacherCommentRequest,
    CreateProgressLogRequest,
)
from app.modules.registrations.model import Registration
from app.modules.users.model import User


class ProgressService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repository = ProgressRepository(db)

    async def create_progress_log(
        self,
        *,
        current_student: User,
        payload: CreateProgressLogRequest,
    ) -> ProgressLog:
        """
        Xử lý nghiệp vụ cho Sinh viên nộp báo cáo tiến độ mới (FR-13).
        """
        registration = await self._get_registration_or_raise(payload.registration_id)
        self._ensure_student_can_submit(registration, current_student)

        if payload.milestone_id is not None:
            milestone = await self.repository.get_milestone_by_id(payload.milestone_id)
            if milestone is None:
                raise NotFoundException(
                    message="Milestone not found.",
                    error_code="MILESTONE_NOT_FOUND",
                )

        new_log = ProgressLog(
            registration_id=payload.registration_id,
            student_id=current_student.id,
            milestone_id=payload.milestone_id,
            content=payload.content,
            submitted_at=utc_now(),
        )

        await self.repository.create(new_log)
        await self.db.commit()
        await self.db.refresh(new_log)
        return new_log

    async def add_teacher_comment(
        self,
        *,
        log_id: UUID,
        current_lecturer: User,
        payload: AddTeacherCommentRequest,
    ) -> ProgressLog:
        """
        Xử lý nghiệp vụ cho Giảng viên hướng dẫn ghi nhận xét vào báo cáo tiến độ (FR-14).
        """
        progress_log = await self.repository.get_progress_log_by_id(log_id)
        if progress_log is None:
            raise NotFoundException(
                message="Progress log not found.",
                error_code="PROGRESS_LOG_NOT_FOUND",
            )

        self._ensure_lecturer_can_comment(progress_log.registration, current_lecturer)

        progress_log.teacher_comment = payload.teacher_comment
        progress_log.commented_at = utc_now()

        await self.repository.update(progress_log)
        await self.db.commit()
        await self.db.refresh(progress_log)
        return progress_log

    async def get_progress_logs_by_registration(
        self,
        *,
        registration_id: UUID,
        current_user: User,
    ) -> Sequence[ProgressLog]:
        """
        Lấy danh sách nhật ký tiến độ của một đơn đăng ký đề tài theo quyền truy cập.
        """
        registration = await self._get_registration_or_raise(registration_id)
        self._ensure_user_can_read(registration, current_user)
        return await self.repository.list_logs_by_registration(registration_id)

    async def _get_registration_or_raise(self, registration_id: UUID) -> Registration:
        registration = await self.repository.get_registration_by_id(registration_id)
        if registration is None:
            raise NotFoundException(
                message="Registration not found.",
                error_code="REGISTRATION_NOT_FOUND",
            )
        return registration

    def _ensure_student_can_submit(self, registration: Registration, current_student: User) -> None:
        if current_student.role != UserRole.STUDENT or registration.student_id != current_student.id:
            raise self._permission_denied()
        if registration.status != RegistrationStatus.APPROVED:
            raise AppException(
                status_code=400,
                message="Progress can be submitted only for an approved registration.",
                code="PROGRESS_REGISTRATION_NOT_APPROVED",
                details={"current_status": registration.status.value},
            )
        if registration.academic_period.status != AcademicPeriodStatus.IN_PROGRESS:
            raise AppException(
                status_code=400,
                message="Progress can be submitted only while the academic period is in progress.",
                code="PROGRESS_PERIOD_NOT_IN_PROGRESS",
                details={"academic_period_status": registration.academic_period.status.value},
            )

    def _ensure_lecturer_can_comment(self, registration: Registration, current_lecturer: User) -> None:
        if current_lecturer.role == UserRole.LECTURER and registration.supervisor_id == current_lecturer.id:
            return
        raise self._permission_denied()

    def _ensure_user_can_read(self, registration: Registration, current_user: User) -> None:
        if current_user.role == UserRole.ADMIN:
            return
        if current_user.role == UserRole.STUDENT and registration.student_id == current_user.id:
            return
        if current_user.role == UserRole.LECTURER and registration.supervisor_id == current_user.id:
            return
        raise self._permission_denied()

    def _permission_denied(self) -> AppException:
        return AppException(
            status_code=403,
            message="You do not have permission to perform this action.",
            code="PERMISSION_DENIED",
        )

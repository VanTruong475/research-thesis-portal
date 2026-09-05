# backend/app/modules/councils/service.py
# File chứa Service xử lý logic nghiệp vụ Quản lý Hội đồng & Lịch bảo vệ (Council Service).

from collections.abc import Sequence
from uuid import UUID

from app.common.exceptions import AppException, NotFoundException
from app.db.enums import (
    AcademicPeriodStatus,
    CouncilMemberStatus,
    CouncilStatus,
    DefenseScheduleStatus,
    RegistrationStatus,
    UserRole,
)
from app.modules.academic_periods.model import AcademicPeriod
from app.modules.councils.model import Council, CouncilMember, DefenseSchedule
from app.modules.councils.repository import CouncilRepository
from app.modules.councils.schemas import (
    CouncilCreateRequest,
    CouncilMemberAssignRequest,
    CouncilMemberResponse,
    CouncilResponse,
    DefenseScheduleCreateRequest,
    DefenseScheduleResponse,
)
from app.modules.registrations.model import Registration
from app.modules.users.model import User


class CouncilService:
    def __init__(self, db) -> None:
        self.db = db
        self.repository = CouncilRepository(db)

    async def create_council(
        self,
        payload: CouncilCreateRequest,
        admin_id: UUID,
    ) -> CouncilResponse:
        """
        Hàm xử lý Tạo Hội đồng chấm mới do Admin gửi lên.
        """
        await self._get_academic_period_or_raise(payload.academic_period_id)

        existing = await self.repository.get_council_by_period_and_code(
            payload.academic_period_id,
            payload.code,
        )
        if existing:
            raise AppException(
                status_code=400,
                message=f"Mã hội đồng '{payload.code}' đã tồn tại trong đợt này.",
                code="COUNCIL_CODE_EXISTS",
            )

        council = Council(
            academic_period_id=payload.academic_period_id,
            code=payload.code,
            name=payload.name,
            description=payload.description,
            default_room=payload.default_room,
            status=CouncilStatus.DRAFT,
            created_by_id=admin_id,
        )

        await self.repository.create_council(council)
        await self.db.commit()
        return self._to_council_response(council)

    async def assign_member(
        self,
        council_id: UUID,
        payload: CouncilMemberAssignRequest,
        admin_id: UUID,
    ) -> CouncilMemberResponse:
        """
        Hàm xử lý Phân công Giảng viên vào Hội đồng với vai trò cụ thể.
        """
        await self._get_council_or_raise(council_id)

        lecturer = await self.repository.get_user_by_id(payload.lecturer_id)
        if not lecturer or lecturer.role != UserRole.LECTURER:
            raise AppException(
                status_code=400,
                message="Người dùng được phân công phải có tài khoản vai trò Giảng viên (Lecturer).",
                code="COUNCIL_INVALID_LECTURER",
            )

        existing_member = await self.repository.get_member_by_council_and_lecturer(
            council_id,
            payload.lecturer_id,
        )
        if existing_member:
            raise AppException(
                status_code=409,
                message="Giảng viên này đã được phân công trong hội đồng.",
                code="COUNCIL_MEMBER_DUPLICATED",
            )

        member = CouncilMember(
            council_id=council_id,
            lecturer_id=payload.lecturer_id,
            member_role=payload.member_role,
            assigned_by_id=admin_id,
            status=CouncilMemberStatus.ACTIVE,
        )

        await self.repository.create_member(member)
        await self.db.commit()
        member.lecturer = lecturer
        return CouncilMemberResponse.model_validate(member)

    async def create_defense_schedule(
        self,
        council_id: UUID,
        payload: DefenseScheduleCreateRequest,
        admin_id: UUID,
    ) -> DefenseScheduleResponse:
        """
        Hàm xếp Lịch bảo vệ cho sinh viên đồ án vào Hội đồng.
        """
        council = await self._get_council_or_raise(council_id)
        registration = await self._get_registration_or_raise(payload.registration_id)
        await self._ensure_registration_can_be_scheduled(council, registration, payload)

        schedule = DefenseSchedule(
            council_id=council_id,
            registration_id=payload.registration_id,
            scheduled_at=payload.scheduled_at,
            duration_minutes=payload.duration_minutes,
            room=payload.room,
            presentation_order=payload.presentation_order,
            status=DefenseScheduleStatus.SCHEDULED,
            note=payload.note,
            created_by_id=admin_id,
        )

        await self.repository.create_schedule(schedule)
        if council.status == CouncilStatus.DRAFT:
            council.status = CouncilStatus.SCHEDULED
            await self.repository.update_council(council)
        await self.db.commit()

        schedule.registration = registration
        return DefenseScheduleResponse.model_validate(schedule)

    async def get_councils_by_period(
        self,
        *,
        period_id: UUID,
        current_user: User,
    ) -> list[CouncilResponse]:
        """
        Lấy danh sách Hội đồng thuộc một Học kỳ/Đợt đăng ký theo quyền truy cập.
        """
        await self._get_academic_period_or_raise(period_id)

        councils: Sequence[Council]
        if current_user.role == UserRole.ADMIN:
            councils = await self.repository.list_councils_by_period(period_id)
        elif current_user.role == UserRole.LECTURER:
            councils = await self.repository.list_councils_for_lecturer(
                period_id,
                current_user.id,
            )
        elif current_user.role == UserRole.STUDENT:
            councils = await self.repository.list_councils_for_student(
                period_id,
                current_user.id,
            )
        else:
            raise self._permission_denied()

        return [self._to_council_response(council) for council in councils]

    async def _get_academic_period_or_raise(self, period_id: UUID) -> AcademicPeriod:
        academic_period = await self.repository.get_academic_period_by_id(period_id)
        if academic_period is None:
            raise NotFoundException(
                message="Academic period not found.",
                error_code="ACADEMIC_PERIOD_NOT_FOUND",
            )
        return academic_period

    async def _get_council_or_raise(self, council_id: UUID) -> Council:
        council = await self.repository.get_council_by_id(council_id)
        if council is None:
            raise NotFoundException(
                message="Council not found.",
                error_code="COUNCIL_NOT_FOUND",
            )
        return council

    async def _get_registration_or_raise(self, registration_id: UUID) -> Registration:
        registration = await self.repository.get_registration_by_id(registration_id)
        if registration is None:
            raise NotFoundException(
                message="Registration not found.",
                error_code="REGISTRATION_NOT_FOUND",
            )
        return registration

    async def _ensure_registration_can_be_scheduled(
        self,
        council: Council,
        registration: Registration,
        payload: DefenseScheduleCreateRequest,
    ) -> None:
        if council.status == CouncilStatus.CANCELLED:
            raise AppException(
                status_code=400,
                message="Cannot schedule defense for a cancelled council.",
                code="COUNCIL_CANCELLED",
            )
        if registration.academic_period_id != council.academic_period_id:
            raise AppException(
                status_code=400,
                message="Registration and council must belong to the same academic period.",
                code="COUNCIL_PERIOD_MISMATCH",
            )
        if registration.status != RegistrationStatus.APPROVED:
            raise AppException(
                status_code=400,
                message="Defense can be scheduled only for an approved registration.",
                code="COUNCIL_REGISTRATION_NOT_APPROVED",
                details={"current_status": registration.status.value},
            )
        if registration.supervisor_id is None:
            raise AppException(
                status_code=400,
                message="Defense can be scheduled only after a supervisor is assigned.",
                code="COUNCIL_SUPERVISOR_REQUIRED",
            )
        if registration.academic_period.status != AcademicPeriodStatus.DEFENSE:
            raise AppException(
                status_code=400,
                message="Defense can be scheduled only while the academic period is in defense status.",
                code="COUNCIL_PERIOD_NOT_DEFENSE",
                details={"academic_period_status": registration.academic_period.status.value},
            )

        existing_schedule = await self.repository.get_schedule_by_registration(registration.id)
        if existing_schedule is not None:
            raise AppException(
                status_code=409,
                message="This registration already has a defense schedule.",
                code="COUNCIL_REGISTRATION_ALREADY_SCHEDULED",
            )

        if payload.presentation_order is not None:
            existing_order = await self.repository.get_schedule_by_council_and_order(
                council.id,
                payload.presentation_order,
            )
            if existing_order is not None:
                raise AppException(
                    status_code=409,
                    message="Presentation order is already used in this council.",
                    code="COUNCIL_PRESENTATION_ORDER_DUPLICATED",
                )

        defense_start = registration.academic_period.defense_start_at
        defense_end = registration.academic_period.defense_end_at
        if (
            defense_start is not None
            and defense_end is not None
            and not defense_start <= payload.scheduled_at <= defense_end
        ):
            raise AppException(
                status_code=400,
                message="Defense schedule must be inside the academic period defense interval.",
                code="COUNCIL_SCHEDULE_OUTSIDE_DEFENSE_PERIOD",
            )

    def _to_council_response(self, council: Council) -> CouncilResponse:
        members = council.__dict__.get("members", [])
        schedules = council.__dict__.get("schedules", [])
        return CouncilResponse(
            id=council.id,
            academic_period_id=council.academic_period_id,
            code=council.code,
            name=council.name,
            description=council.description,
            default_room=council.default_room,
            status=council.status,
            created_at=council.created_at,
            members=[CouncilMemberResponse.model_validate(m) for m in members],
            schedules=[DefenseScheduleResponse.model_validate(s) for s in schedules],
        )

    def _permission_denied(self) -> AppException:
        return AppException(
            status_code=403,
            message="You do not have permission to perform this action.",
            code="PERMISSION_DENIED",
        )

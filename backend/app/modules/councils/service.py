# backend/app/modules/councils/service.py
# File chứa Service xử lý logic nghiệp vụ Quản lý Hội đồng & Lịch bảo vệ (Council Service).

from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.common.exceptions import AppException
from app.db.enums import CouncilMemberStatus, CouncilStatus, DefenseScheduleStatus, UserRole
from app.modules.councils.model import Council, CouncilMember, DefenseSchedule
from app.modules.councils.schemas import (
    CouncilCreateRequest,
    CouncilMemberAssignRequest,
    CouncilMemberResponse,
    CouncilResponse,
    DefenseScheduleCreateRequest,
    DefenseScheduleResponse,
)
from app.modules.users.model import User


class CouncilService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_council(
        self, payload: CouncilCreateRequest, admin_id: UUID
    ) -> CouncilResponse:
        """
        Hàm xử lý Tạo Hội đồng chấm mới do Admin gửi lên.
        """
        # 1. Kiểm tra xem Mã hội đồng (code) đã tồn tại trong cùng Học kỳ chưa
        stmt = select(Council).where(
            Council.academic_period_id == payload.academic_period_id,
            Council.code == payload.code,
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            raise AppException(
                status_code=400,
                message=f"Mã hội đồng '{payload.code}' đã tồn tại trong đợt này.",
                code="COUNCIL_CODE_EXISTS",
            )

        # 2. Tạo đối tượng Council mới
        council = Council(
            academic_period_id=payload.academic_period_id,
            code=payload.code,
            name=payload.name,
            description=payload.description,
            default_room=payload.default_room,
            status=CouncilStatus.DRAFT,
            created_by_id=admin_id,
        )

        # 3. Lưu vào Database
        self.db.add(council)
        await self.db.commit()
        await self.db.refresh(council)

        return CouncilResponse(
            id=council.id,
            academic_period_id=council.academic_period_id,
            code=council.code,
            name=council.name,
            description=council.description,
            default_room=council.default_room,
            status=council.status,
            created_at=council.created_at,
            members=[],
            schedules=[],
        )

    async def assign_member(
        self, council_id: UUID, payload: CouncilMemberAssignRequest, admin_id: UUID
    ) -> CouncilMemberResponse:
        """
        Hàm xử lý Phân công Giảng viên vào Hội đồng với vai trò cụ thể.
        """
        # 1. Kiểm tra xem Giảng viên (lecturer_id) có tồn tại và đúng vai trò LECTURER không
        stmt_user = select(User).where(User.id == payload.lecturer_id)
        res_user = await self.db.execute(stmt_user)
        lecturer = res_user.scalar_one_or_none()

        if not lecturer or lecturer.role != UserRole.LECTURER:
            raise AppException(
                status_code=400,
                message="Người dùng được phân công phải có tài khoản vai trò Giảng viên (Lecturer).",
                code="INVALID_LECTURER",
            )

        # 2. Kiểm tra xem Giảng viên đã được thêm vào hội đồng này chưa
        stmt_member = select(CouncilMember).where(
            CouncilMember.council_id == council_id,
            CouncilMember.lecturer_id == payload.lecturer_id,
        )
        res_member = await self.db.execute(stmt_member)
        existing_member = res_member.scalar_one_or_none()

        if existing_member:
            raise AppException(
                status_code=400,
                message="Giảng viên này đã được phân công trong hội đồng.",
                code="MEMBER_ALREADY_EXISTS",
            )

        # 3. Tạo phân công thành viên hội đồng mới
        member = CouncilMember(
            council_id=council_id,
            lecturer_id=payload.lecturer_id,
            member_role=payload.member_role,
            assigned_by_id=admin_id,
            status=CouncilMemberStatus.ACTIVE,
        )

        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(member)

        return CouncilMemberResponse(
            id=member.id,
            council_id=member.council_id,
            lecturer_id=member.lecturer_id,
            member_role=member.member_role,
            status=member.status,
            assigned_at=member.created_at,
        )

    async def create_defense_schedule(
        self, council_id: UUID, payload: DefenseScheduleCreateRequest, admin_id: UUID
    ) -> DefenseScheduleResponse:
        """
        Hàm xếp Lịch bảo vệ cho sinh viên đồ án vào Hội đồng.
        """
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

        self.db.add(schedule)
        await self.db.commit()
        await self.db.refresh(schedule)

        return DefenseScheduleResponse(
            id=schedule.id,
            council_id=schedule.council_id,
            registration_id=schedule.registration_id,
            scheduled_at=schedule.scheduled_at,
            duration_minutes=schedule.duration_minutes,
            room=schedule.room,
            presentation_order=schedule.presentation_order,
            status=schedule.status,
            note=schedule.note,
        )

    async def get_councils_by_period(self, period_id: UUID) -> list[CouncilResponse]:
        """
        Lấy danh sách tất cả các Hội đồng thuộc 1 Học kỳ/Đợt đăng ký.
        """
        stmt = (
            select(Council)
            .where(Council.academic_period_id == period_id)
            .options(
                selectinload(Council.members),
                selectinload(Council.schedules),
            )
        )
        result = await self.db.execute(stmt)
        councils = result.scalars().all()

        return [
            CouncilResponse(
                id=c.id,
                academic_period_id=c.academic_period_id,
                code=c.code,
                name=c.name,
                description=c.description,
                default_room=c.default_room,
                status=c.status,
                created_at=c.created_at,
                members=[CouncilMemberResponse.model_validate(m) for m in c.members],
                schedules=[DefenseScheduleResponse.model_validate(s) for s in c.schedules],
            )
            for c in councils
        ]

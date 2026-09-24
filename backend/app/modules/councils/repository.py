from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.db.enums import CouncilMemberStatus
from app.modules.academic_periods.model import AcademicPeriod
from app.modules.councils.model import Council, CouncilMember, DefenseSchedule
from app.modules.registrations.model import Registration
from app.modules.users.model import User


class CouncilRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_academic_period_by_id(self, period_id: UUID) -> AcademicPeriod | None:
        result = await self.db.execute(
            select(AcademicPeriod).where(AcademicPeriod.id == period_id)
        )
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_council_by_id(self, council_id: UUID) -> Council | None:
        result = await self.db.execute(
            select(Council)
            .options(
                selectinload(Council.members).joinedload(CouncilMember.lecturer),
                selectinload(Council.schedules)
                .joinedload(DefenseSchedule.registration)
                .joinedload(Registration.academic_period),
                selectinload(Council.schedules)
                .joinedload(DefenseSchedule.registration)
                .joinedload(Registration.topic),
                selectinload(Council.schedules)
                .joinedload(DefenseSchedule.registration)
                .joinedload(Registration.student),
                selectinload(Council.schedules)
                .joinedload(DefenseSchedule.registration)
                .joinedload(Registration.supervisor),
            )
            .where(Council.id == council_id)
        )
        return result.scalar_one_or_none()

    async def get_council_by_period_and_code(
        self,
        period_id: UUID,
        code: str,
    ) -> Council | None:
        result = await self.db.execute(
            select(Council).where(
                Council.academic_period_id == period_id,
                Council.code == code,
            )
        )
        return result.scalar_one_or_none()

    async def get_member_by_council_and_lecturer(
        self,
        council_id: UUID,
        lecturer_id: UUID,
    ) -> CouncilMember | None:
        result = await self.db.execute(
            select(CouncilMember).where(
                CouncilMember.council_id == council_id,
                CouncilMember.lecturer_id == lecturer_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_registration_by_id(self, registration_id: UUID) -> Registration | None:
        result = await self.db.execute(
            select(Registration)
            .options(
                joinedload(Registration.academic_period),
                joinedload(Registration.topic),
                joinedload(Registration.student),
                joinedload(Registration.supervisor),
            )
            .where(Registration.id == registration_id)
        )
        return result.scalar_one_or_none()

    async def get_schedule_by_registration(
        self,
        registration_id: UUID,
    ) -> DefenseSchedule | None:
        result = await self.db.execute(
            select(DefenseSchedule).where(DefenseSchedule.registration_id == registration_id)
        )
        return result.scalar_one_or_none()

    async def get_schedule_by_council_and_order(
        self,
        council_id: UUID,
        presentation_order: int,
    ) -> DefenseSchedule | None:
        result = await self.db.execute(
            select(DefenseSchedule).where(
                DefenseSchedule.council_id == council_id,
                DefenseSchedule.presentation_order == presentation_order,
            )
        )
        return result.scalar_one_or_none()

    async def list_councils_by_period(self, period_id: UUID) -> Sequence[Council]:
        result = await self.db.execute(
            self._council_list_query().where(Council.academic_period_id == period_id)
        )
        return result.scalars().all()

    async def list_councils_for_lecturer(
        self,
        period_id: UUID,
        lecturer_id: UUID,
    ) -> Sequence[Council]:
        result = await self.db.execute(
            self._council_list_query()
            .join(CouncilMember, CouncilMember.council_id == Council.id)
            .where(
                Council.academic_period_id == period_id,
                CouncilMember.lecturer_id == lecturer_id,
                CouncilMember.status == CouncilMemberStatus.ACTIVE,
            )
        )
        return result.scalars().unique().all()

    async def list_councils_for_student(
        self,
        period_id: UUID,
        student_id: UUID,
    ) -> Sequence[Council]:
        result = await self.db.execute(
            self._council_list_query()
            .join(DefenseSchedule, DefenseSchedule.council_id == Council.id)
            .join(Registration, Registration.id == DefenseSchedule.registration_id)
            .where(
                Council.academic_period_id == period_id,
                Registration.student_id == student_id,
            )
        )
        return result.scalars().unique().all()

    async def create_council(self, council: Council) -> Council:
        self.db.add(council)
        await self.db.flush()
        await self.db.refresh(council)
        return council

    async def create_member(self, member: CouncilMember) -> CouncilMember:
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def create_schedule(self, schedule: DefenseSchedule) -> DefenseSchedule:
        self.db.add(schedule)
        await self.db.flush()
        await self.db.refresh(schedule)
        return schedule

    async def update_council(self, council: Council) -> Council:
        await self.db.flush()
        await self.db.refresh(council)
        return council

    def _council_list_query(self) -> Select[tuple[Council]]:
        return select(Council).options(
            selectinload(Council.members).joinedload(CouncilMember.lecturer),
            selectinload(Council.schedules)
            .joinedload(DefenseSchedule.registration)
            .joinedload(Registration.academic_period),
            selectinload(Council.schedules)
            .joinedload(DefenseSchedule.registration)
            .joinedload(Registration.topic),
            selectinload(Council.schedules)
            .joinedload(DefenseSchedule.registration)
            .joinedload(Registration.student),
            selectinload(Council.schedules)
            .joinedload(DefenseSchedule.registration)
            .joinedload(Registration.supervisor),
        )

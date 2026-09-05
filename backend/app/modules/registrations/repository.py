from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db.enums import RegistrationStatus, UserRole, UserStatus
from app.modules.registrations.model import Registration
from app.modules.topics.model import Topic
from app.modules.users.model import User

EFFECTIVE_REGISTRATION_STATUSES = (
    RegistrationStatus.PENDING,
    RegistrationStatus.APPROVED,
    RegistrationStatus.IN_PROGRESS,
)
ACCEPTED_REGISTRATION_STATUSES = (
    RegistrationStatus.APPROVED,
    RegistrationStatus.IN_PROGRESS,
)


class RegistrationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, registration_id: UUID) -> Registration | None:
        result = await self.db.execute(
            select(Registration)
            .options(*self._response_options())
            .where(Registration.id == registration_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id_for_update(self, registration_id: UUID) -> Registration | None:
        result = await self.db.execute(
            select(Registration)
            .options(*self._response_options())
            .where(Registration.id == registration_id)
            .with_for_update(of=Registration)
        )
        return result.scalar_one_or_none()

    async def get_topic_by_id(self, topic_id: UUID) -> Topic | None:
        result = await self.db.execute(
            select(Topic)
            .options(joinedload(Topic.academic_period), joinedload(Topic.proposed_by))
            .where(Topic.id == topic_id)
        )
        return result.scalar_one_or_none()

    async def get_topic_by_id_for_update(self, topic_id: UUID) -> Topic | None:
        result = await self.db.execute(
            select(Topic)
            .options(joinedload(Topic.academic_period), joinedload(Topic.proposed_by))
            .where(Topic.id == topic_id)
            .with_for_update(of=Topic)
        )
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_active_lecturer(self, lecturer_id: UUID) -> User | None:
        result = await self.db.execute(
            select(User).where(
                User.id == lecturer_id,
                User.role == UserRole.LECTURER,
                User.status == UserStatus.ACTIVE,
            )
        )
        return result.scalar_one_or_none()

    async def list_registrations(
        self,
        *,
        page: int,
        page_size: int,
        status: RegistrationStatus | None = None,
        student_id: UUID | None = None,
        topic_id: UUID | None = None,
        academic_period_id: UUID | None = None,
        supervisor_id: UUID | None = None,
        lecturer_visible_id: UUID | None = None,
    ) -> tuple[list[Registration], int]:
        stmt = self._build_list_statement(
            status=status,
            student_id=student_id,
            topic_id=topic_id,
            academic_period_id=academic_period_id,
            supervisor_id=supervisor_id,
            lecturer_visible_id=lecturer_visible_id,
        )
        total_items = await self.db.scalar(select(func.count()).select_from(stmt.subquery()))
        result = await self.db.execute(
            stmt.options(*self._response_options())
            .order_by(Registration.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), int(total_items or 0)

    async def get_effective_registration_for_student_period(
        self,
        *,
        student_id: UUID,
        academic_period_id: UUID,
        exclude_registration_id: UUID | None = None,
    ) -> Registration | None:
        stmt = select(Registration).where(
            Registration.student_id == student_id,
            Registration.academic_period_id == academic_period_id,
            Registration.status.in_(EFFECTIVE_REGISTRATION_STATUSES),
        )
        if exclude_registration_id is not None:
            stmt = stmt.where(Registration.id != exclude_registration_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def count_accepted_registrations_for_topic(self, topic_id: UUID) -> int:
        count = await self.db.scalar(
            select(func.count(Registration.id)).where(
                Registration.topic_id == topic_id,
                Registration.status.in_(ACCEPTED_REGISTRATION_STATUSES),
            )
        )
        return int(count or 0)

    async def count_assigned_registrations_for_supervisor(self, supervisor_id: UUID) -> int:
        count = await self.db.scalar(
            select(func.count(Registration.id)).where(
                Registration.supervisor_id == supervisor_id,
                Registration.status.in_(ACCEPTED_REGISTRATION_STATUSES),
            )
        )
        return int(count or 0)

    async def reject_pending_registrations_for_full_topic(
        self,
        *,
        topic_id: UUID,
        approved_registration_id: UUID,
        reviewer_id: UUID,
        reviewed_at,
        reason: str,
    ) -> None:
        result = await self.db.execute(
            select(Registration).where(
                Registration.topic_id == topic_id,
                Registration.id != approved_registration_id,
                Registration.status == RegistrationStatus.PENDING,
            )
        )
        for registration in result.scalars().all():
            registration.status = RegistrationStatus.REJECTED
            registration.review_reason = reason
            registration.reviewed_by_id = reviewer_id
            registration.reviewed_at = reviewed_at

    async def create(self, registration: Registration) -> Registration:
        self.db.add(registration)
        await self.db.flush()
        await self.db.refresh(registration)
        return registration

    async def update(self, registration: Registration) -> Registration:
        await self.db.flush()
        await self.db.refresh(registration)
        return registration

    async def get_response_by_id(self, registration_id: UUID) -> Registration | None:
        result = await self.db.execute(
            select(Registration)
            .options(*self._response_options())
            .where(Registration.id == registration_id)
        )
        return result.scalar_one_or_none()

    def _build_list_statement(
        self,
        *,
        status: RegistrationStatus | None,
        student_id: UUID | None,
        topic_id: UUID | None,
        academic_period_id: UUID | None,
        supervisor_id: UUID | None,
        lecturer_visible_id: UUID | None,
    ) -> Select[tuple[Registration]]:
        stmt = select(Registration).join(Registration.topic)
        if status is not None:
            stmt = stmt.where(Registration.status == status)
        if student_id is not None:
            stmt = stmt.where(Registration.student_id == student_id)
        if topic_id is not None:
            stmt = stmt.where(Registration.topic_id == topic_id)
        if academic_period_id is not None:
            stmt = stmt.where(Registration.academic_period_id == academic_period_id)
        if supervisor_id is not None:
            stmt = stmt.where(Registration.supervisor_id == supervisor_id)
        if lecturer_visible_id is not None:
            stmt = stmt.where(
                or_(
                    Topic.proposed_by_id == lecturer_visible_id,
                    Registration.supervisor_id == lecturer_visible_id,
                )
            )
        return stmt

    def _response_options(self):
        return (
            joinedload(Registration.academic_period),
            joinedload(Registration.topic).joinedload(Topic.academic_period),
            joinedload(Registration.topic).joinedload(Topic.proposed_by),
            joinedload(Registration.student),
            joinedload(Registration.supervisor),
        )

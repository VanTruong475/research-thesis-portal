from datetime import datetime
from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

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


class TopicRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, topic_id: UUID) -> Topic | None:
        result = await self.db.execute(
            select(Topic)
            .options(joinedload(Topic.academic_period), joinedload(Topic.proposed_by))
            .where(Topic.id == topic_id)
        )
        return result.scalar_one_or_none()

    async def get_by_code_in_period(
        self,
        academic_period_id: UUID,
        code: str,
    ) -> Topic | None:
        normalized_code = code.strip().lower()
        result = await self.db.execute(
            select(Topic).where(
                Topic.academic_period_id == academic_period_id,
                func.lower(Topic.code) == normalized_code,
            )
        )
        return result.scalar_one_or_none()

    async def get_academic_period(self, academic_period_id: UUID) -> AcademicPeriod | None:
        result = await self.db.execute(
            select(AcademicPeriod).where(AcademicPeriod.id == academic_period_id)
        )
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

    async def list_topics(
        self,
        *,
        page: int,
        page_size: int,
        status: TopicStatus | None = None,
        academic_period_id: UUID | None = None,
        proposed_by_id: UUID | None = None,
        keyword: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        visible_to_user_id: UUID | None = None,
        only_approved_visible: bool = False,
        only_available: bool = False,
        now: datetime | None = None,
    ) -> tuple[list[Topic], int]:
        stmt = self._build_list_statement(
            status=status,
            academic_period_id=academic_period_id,
            proposed_by_id=proposed_by_id,
            keyword=keyword,
            visible_to_user_id=visible_to_user_id,
            only_approved_visible=only_approved_visible,
            only_available=only_available,
            now=now,
        )
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_items = await self.db.scalar(count_stmt)

        order_column = self._sort_column(sort_by)
        if sort_order == "asc":
            stmt = stmt.order_by(order_column.asc())
        else:
            stmt = stmt.order_by(order_column.desc())

        result = await self.db.execute(
            stmt.options(joinedload(Topic.academic_period), joinedload(Topic.proposed_by))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), int(total_items or 0)

    async def count_accepted_registrations(self, topic_id: UUID) -> int:
        count = await self.db.scalar(
            select(func.count(Registration.id)).where(
                Registration.topic_id == topic_id,
                Registration.status.in_(
                    [RegistrationStatus.APPROVED, RegistrationStatus.IN_PROGRESS]
                ),
            )
        )
        return int(count or 0)

    async def create(self, topic: Topic) -> Topic:
        self.db.add(topic)
        await self.db.flush()
        await self.db.refresh(topic)
        return topic

    async def update(self, topic: Topic) -> Topic:
        await self.db.flush()
        await self.db.refresh(topic)
        return topic

    def _build_list_statement(
        self,
        *,
        status: TopicStatus | None,
        academic_period_id: UUID | None,
        proposed_by_id: UUID | None,
        keyword: str | None,
        visible_to_user_id: UUID | None,
        only_approved_visible: bool,
        only_available: bool,
        now: datetime | None,
    ) -> Select[tuple[Topic]]:
        stmt = select(Topic).join(Topic.academic_period).join(Topic.proposed_by)

        if status is not None:
            stmt = stmt.where(Topic.status == status)
        if academic_period_id is not None:
            stmt = stmt.where(Topic.academic_period_id == academic_period_id)
        if proposed_by_id is not None:
            stmt = stmt.where(Topic.proposed_by_id == proposed_by_id)
        if keyword:
            pattern = f"%{keyword.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Topic.code).like(pattern),
                    func.lower(Topic.title).like(pattern),
                    func.lower(Topic.description).like(pattern),
                    func.lower(User.full_name).like(pattern),
                )
            )
        if visible_to_user_id is not None:
            stmt = stmt.where(
                or_(
                    Topic.proposed_by_id == visible_to_user_id,
                    Topic.status == TopicStatus.APPROVED,
                )
            )
        if only_approved_visible:
            stmt = stmt.where(Topic.status == TopicStatus.APPROVED)
        if only_available:
            stmt = stmt.where(
                Topic.status == TopicStatus.APPROVED,
                AcademicPeriod.status == AcademicPeriodStatus.REGISTRATION_OPEN,
            )
            if now is not None:
                stmt = stmt.where(
                    AcademicPeriod.registration_start_at <= now,
                    AcademicPeriod.registration_end_at >= now,
                )
            approved_count = (
                select(func.count(Registration.id))
                .where(
                    Registration.topic_id == Topic.id,
                    Registration.status.in_(
                        [RegistrationStatus.APPROVED, RegistrationStatus.IN_PROGRESS]
                    ),
                )
                .correlate(Topic)
                .scalar_subquery()
            )
            stmt = stmt.where(approved_count < Topic.max_students)

        return stmt

    def _sort_column(self, sort_by: str):
        return {
            "code": Topic.code,
            "title": Topic.title,
            "status": Topic.status,
            "max_students": Topic.max_students,
            "created_at": Topic.created_at,
            "updated_at": Topic.updated_at,
        }[sort_by]

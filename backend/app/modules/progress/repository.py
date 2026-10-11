from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.modules.progress.model import Milestone, ProgressLog
from app.modules.registrations.model import Registration


class ProgressRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

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

    async def get_progress_log_by_id(self, log_id: UUID) -> ProgressLog | None:
        result = await self.db.execute(
            select(ProgressLog)
            .options(
                joinedload(ProgressLog.registration).joinedload(Registration.academic_period),
                joinedload(ProgressLog.registration).joinedload(Registration.supervisor),
            )
            .where(ProgressLog.id == log_id)
        )
        return result.scalar_one_or_none()

    async def get_milestone_by_id(self, milestone_id: UUID) -> Milestone | None:
        result = await self.db.execute(select(Milestone).where(Milestone.id == milestone_id))
        return result.scalar_one_or_none()

    async def list_logs_by_registration(self, registration_id: UUID) -> Sequence[ProgressLog]:
        result = await self.db.execute(
            select(ProgressLog)
            .where(ProgressLog.registration_id == registration_id)
            .order_by(ProgressLog.submitted_at.desc())
        )
        return result.scalars().all()

    async def create(self, progress_log: ProgressLog) -> ProgressLog:
        self.db.add(progress_log)
        await self.db.flush()
        await self.db.refresh(progress_log)
        return progress_log

    async def update(self, progress_log: ProgressLog) -> ProgressLog:
        await self.db.flush()
        await self.db.refresh(progress_log)
        return progress_log

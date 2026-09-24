from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.modules.registrations.model import Registration
from app.modules.reports.model import Report


class ReportRepository:
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

    async def get_report_by_id(self, report_id: UUID) -> Report | None:
        result = await self.db.execute(
            select(Report)
            .options(
                joinedload(Report.registration).joinedload(Registration.academic_period),
                joinedload(Report.registration).joinedload(Registration.topic),
                joinedload(Report.registration).joinedload(Registration.student),
                joinedload(Report.registration).joinedload(Registration.supervisor),
                joinedload(Report.topic),
                joinedload(Report.student),
            )
            .where(Report.id == report_id)
        )
        return result.scalar_one_or_none()

    async def list_by_registration(self, registration_id: UUID) -> Sequence[Report]:
        result = await self.db.execute(
            select(Report)
            .options(
                joinedload(Report.registration).joinedload(Registration.academic_period),
                joinedload(Report.registration).joinedload(Registration.topic),
                joinedload(Report.registration).joinedload(Registration.student),
                joinedload(Report.registration).joinedload(Registration.supervisor),
                joinedload(Report.topic),
                joinedload(Report.student),
            )
            .where(Report.registration_id == registration_id)
            .order_by(Report.version.desc(), Report.submitted_at.desc())
        )
        return result.scalars().all()

    async def get_max_version_for_registration(self, registration_id: UUID) -> int:
        result = await self.db.execute(
            select(func.coalesce(func.max(Report.version), 0)).where(
                Report.registration_id == registration_id,
            )
        )
        return int(result.scalar() or 0)

    async def create(self, report: Report) -> Report:
        self.db.add(report)
        await self.db.flush()
        await self.db.refresh(report)
        return report

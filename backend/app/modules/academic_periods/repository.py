from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.academic_periods.model import AcademicPeriod


class AcademicPeriodRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, period_id: UUID) -> AcademicPeriod | None:
        result = await self.db.execute(
            select(AcademicPeriod).where(AcademicPeriod.id == period_id)
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> AcademicPeriod | None:
        normalized_code = code.strip().lower()
        stmt = select(AcademicPeriod).where(
            func.lower(AcademicPeriod.code) == normalized_code
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_periods(
        self,
        *,
        page: int,
        page_size: int,
    ) -> tuple[list[AcademicPeriod], int]:
        total_items = await self.db.scalar(select(func.count(AcademicPeriod.id)))
        stmt = (
            select(AcademicPeriod)
            .order_by(AcademicPeriod.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), int(total_items or 0)

    async def create(self, period: AcademicPeriod) -> AcademicPeriod:
        self.db.add(period)
        await self.db.flush()
        await self.db.refresh(period)
        return period

    async def update(self, period: AcademicPeriod) -> AcademicPeriod:
        await self.db.flush()
        await self.db.refresh(period)
        return period

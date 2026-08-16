import math
from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import AppException, NotFoundException
from app.db.enums import AcademicPeriodStatus
from app.modules.academic_periods.model import AcademicPeriod
from app.modules.academic_periods.repository import AcademicPeriodRepository
from app.modules.academic_periods.schemas import (
    AcademicPeriodCreateRequest,
    AcademicPeriodListResponse,
    AcademicPeriodResponse,
    AcademicPeriodStatusUpdateRequest,
    AcademicPeriodUpdateRequest,
    PaginationResponse,
)

_FORWARD_TRANSITIONS: dict[AcademicPeriodStatus, AcademicPeriodStatus] = {
    AcademicPeriodStatus.DRAFT: AcademicPeriodStatus.PROPOSAL_OPEN,
    AcademicPeriodStatus.PROPOSAL_OPEN: AcademicPeriodStatus.REGISTRATION_OPEN,
    AcademicPeriodStatus.REGISTRATION_OPEN: AcademicPeriodStatus.IN_PROGRESS,
    AcademicPeriodStatus.IN_PROGRESS: AcademicPeriodStatus.DEFENSE,
    AcademicPeriodStatus.DEFENSE: AcademicPeriodStatus.COMPLETED,
}

_CANCELLABLE_STATUSES = {
    AcademicPeriodStatus.DRAFT,
    AcademicPeriodStatus.PROPOSAL_OPEN,
    AcademicPeriodStatus.REGISTRATION_OPEN,
    AcademicPeriodStatus.IN_PROGRESS,
    AcademicPeriodStatus.DEFENSE,
}


class AcademicPeriodService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repository = AcademicPeriodRepository(db)

    async def list_periods(self, *, page: int, page_size: int) -> AcademicPeriodListResponse:
        periods, total_items = await self.repository.list_periods(page=page, page_size=page_size)
        total_pages = math.ceil(total_items / page_size) if total_items else 0

        return AcademicPeriodListResponse(
            items=[AcademicPeriodResponse.model_validate(period) for period in periods],
            pagination=PaginationResponse(
                page=page,
                page_size=page_size,
                total_items=total_items,
                total_pages=total_pages,
            ),
        )

    async def create_period(
        self,
        payload: AcademicPeriodCreateRequest,
        admin_id: UUID,
    ) -> AcademicPeriodResponse:
        await self._ensure_code_is_available(payload.code)
        self._validate_date_ranges(payload)

        period = AcademicPeriod(
            **payload.model_dump(),
            status=AcademicPeriodStatus.DRAFT,
            created_by_id=admin_id,
        )
        await self.repository.create(period)
        await self.db.commit()
        return AcademicPeriodResponse.model_validate(period)

    async def get_period(self, period_id: UUID) -> AcademicPeriodResponse:
        period = await self._get_period_or_raise(period_id)
        return AcademicPeriodResponse.model_validate(period)

    async def update_period(
        self,
        period_id: UUID,
        payload: AcademicPeriodUpdateRequest,
    ) -> AcademicPeriodResponse:
        period = await self._get_period_or_raise(period_id)

        if period.status == AcademicPeriodStatus.COMPLETED:
            raise AppException(
                status_code=400,
                message="Completed academic periods cannot be updated without explicit administrative correction.",
                code="ACADEMIC_PERIOD_COMPLETED_READ_ONLY",
            )

        if period.code != payload.code:
            await self._ensure_code_is_available(payload.code)

        self._validate_date_ranges(payload)

        for field, value in payload.model_dump().items():
            setattr(period, field, value)

        await self.repository.update(period)
        await self.db.commit()
        return AcademicPeriodResponse.model_validate(period)

    async def update_status(
        self,
        period_id: UUID,
        payload: AcademicPeriodStatusUpdateRequest,
    ) -> AcademicPeriodResponse:
        period = await self._get_period_or_raise(period_id)
        self._validate_status_transition(period.status, payload.status)

        period.status = payload.status
        await self.repository.update(period)
        await self.db.commit()
        return AcademicPeriodResponse.model_validate(period)

    async def _get_period_or_raise(self, period_id: UUID) -> AcademicPeriod:
        period = await self.repository.get_by_id(period_id)
        if period is None:
            raise NotFoundException(
                message="Academic period not found.",
                error_code="ACADEMIC_PERIOD_NOT_FOUND",
            )
        return period

    async def _ensure_code_is_available(self, code: str) -> None:
        existing = await self.repository.get_by_code(code)
        if existing is not None:
            raise AppException(
                status_code=409,
                message="Academic period code already exists.",
                code="ACADEMIC_PERIOD_CODE_EXISTS",
            )

    def _validate_date_ranges(
        self,
        payload: AcademicPeriodCreateRequest | AcademicPeriodUpdateRequest,
    ) -> None:
        self._ensure_start_before_end(
            payload.proposal_start_at,
            payload.proposal_end_at,
            "proposal_start_at",
            "proposal_end_at",
        )
        self._ensure_start_before_end(
            payload.registration_start_at,
            payload.registration_end_at,
            "registration_start_at",
            "registration_end_at",
        )

        if payload.execution_start_at is not None and payload.execution_end_at is not None:
            self._ensure_start_before_end(
                payload.execution_start_at,
                payload.execution_end_at,
                "execution_start_at",
                "execution_end_at",
            )

        if payload.defense_start_at is not None and payload.defense_end_at is not None:
            self._ensure_start_before_end(
                payload.defense_start_at,
                payload.defense_end_at,
                "defense_start_at",
                "defense_end_at",
            )

    def _ensure_start_before_end(
        self,
        start_at: datetime,
        end_at: datetime,
        start_field: str,
        end_field: str,
    ) -> None:
        if start_at >= end_at:
            raise AppException(
                status_code=400,
                message=f"{start_field} must be before {end_field}.",
                code="ACADEMIC_PERIOD_INVALID_DATE_RANGE",
                details={"start_field": start_field, "end_field": end_field},
            )

    def _validate_status_transition(
        self,
        current_status: AcademicPeriodStatus,
        new_status: AcademicPeriodStatus,
    ) -> None:
        if current_status == new_status:
            return

        if new_status == AcademicPeriodStatus.CANCELLED and current_status in _CANCELLABLE_STATUSES:
            return

        if _FORWARD_TRANSITIONS.get(current_status) == new_status:
            return

        raise AppException(
            status_code=400,
            message="Invalid academic period status transition.",
            code="ACADEMIC_PERIOD_INVALID_STATUS_TRANSITION",
            details={"current_status": current_status.value, "new_status": new_status.value},
        )

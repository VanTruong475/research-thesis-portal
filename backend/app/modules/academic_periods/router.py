from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.responses import create_success_response
from app.db.enums import UserRole
from app.db.session import get_db
from app.modules.academic_periods.schemas import (
    AcademicPeriodCreateRequest,
    AcademicPeriodStatusUpdateRequest,
    AcademicPeriodUpdateRequest,
)
from app.modules.academic_periods.service import AcademicPeriodService
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.users.model import User

router = APIRouter(prefix="/academic-periods", tags=["Academic Periods"])


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="List academic periods",
)
async def list_academic_periods(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
):
    periods_data = await AcademicPeriodService(db).list_periods(page=page, page_size=page_size)
    return create_success_response(
        data=periods_data.model_dump(mode="json"),
        message="Academic periods retrieved successfully.",
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Admin create an academic period",
)
async def create_academic_period(
    payload: AcademicPeriodCreateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
):
    period_data = await AcademicPeriodService(db).create_period(payload, current_admin.id)
    return create_success_response(
        data=period_data.model_dump(mode="json"),
        message="Academic period created successfully.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/{period_id}",
    status_code=status.HTTP_200_OK,
    summary="Get an academic period",
)
async def get_academic_period(
    period_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    period_data = await AcademicPeriodService(db).get_period(period_id)
    return create_success_response(
        data=period_data.model_dump(mode="json"),
        message="Academic period retrieved successfully.",
    )


@router.put(
    "/{period_id}",
    status_code=status.HTTP_200_OK,
    summary="Admin update an academic period",
)
async def update_academic_period(
    period_id: UUID,
    payload: AcademicPeriodUpdateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
):
    period_data = await AcademicPeriodService(db).update_period(period_id, payload)
    return create_success_response(
        data=period_data.model_dump(mode="json"),
        message="Academic period updated successfully.",
    )


@router.patch(
    "/{period_id}/status",
    status_code=status.HTTP_200_OK,
    summary="Admin update academic period status",
)
async def update_academic_period_status(
    period_id: UUID,
    payload: AcademicPeriodStatusUpdateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
):
    period_data = await AcademicPeriodService(db).update_status(period_id, payload)
    return create_success_response(
        data=period_data.model_dump(mode="json"),
        message="Academic period status updated successfully.",
    )

# backend/app/modules/councils/router.py
# Router quản lý Hội đồng & Lịch bảo vệ (Councils & Defense Schedules)

from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.responses import create_success_response
from app.db.enums import UserRole
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.councils.schemas import (
    CouncilCreateRequest,
    CouncilMemberAssignRequest,
    DefenseScheduleCreateRequest,
)
from app.modules.councils.service import CouncilService

router = APIRouter(prefix="/councils", tags=["Councils & Defense Schedules"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Admin thành lập Hội đồng chấm bảo vệ mới",
)
async def create_council(
    payload: CouncilCreateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[dict, Depends(require_roles(UserRole.ADMIN))],
):
    """
    Endpoint cho phép Admin tạo Hội đồng mới cho một Học kỳ/Đợt đăng ký.
    """
    admin_id = UUID(current_admin["sub"])
    council_data = await CouncilService(db).create_council(payload, admin_id)
    return create_success_response(
        data=council_data.model_dump(mode="json"),
        message="Thành lập Hội đồng mới thành công.",
        status_code=status.HTTP_201_CREATED,
    )


@router.post(
    "/{council_id}/members",
    status_code=status.HTTP_201_CREATED,
    summary="Admin phân công Giảng viên vào Hội đồng",
)
async def assign_council_member(
    council_id: UUID,
    payload: CouncilMemberAssignRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[dict, Depends(require_roles(UserRole.ADMIN))],
):
    """
    Endpoint cho phép Admin phân công Giảng viên vào Hội đồng với vai trò cụ thể (Chủ tịch, Thư ký, Phản biện, Ủy viên).
    """
    admin_id = UUID(current_admin["sub"])
    member_data = await CouncilService(db).assign_member(council_id, payload, admin_id)
    return create_success_response(
        data=member_data.model_dump(mode="json"),
        message="Phân công Giảng viên vào Hội đồng thành công.",
        status_code=status.HTTP_201_CREATED,
    )


@router.post(
    "/{council_id}/schedules",
    status_code=status.HTTP_201_CREATED,
    summary="Admin xếp lịch bảo vệ đồ án cho Sinh viên vào Hội đồng",
)
async def create_defense_schedule(
    council_id: UUID,
    payload: DefenseScheduleCreateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[dict, Depends(require_roles(UserRole.ADMIN))],
):
    """
    Endpoint cho phép Admin xếp ngày giờ, thời lượng và phòng bảo vệ đồ án cho một sinh viên.
    """
    admin_id = UUID(current_admin["sub"])
    schedule_data = await CouncilService(db).create_defense_schedule(council_id, payload, admin_id)
    return create_success_response(
        data=schedule_data.model_dump(mode="json"),
        message="Xếp lịch bảo vệ đồ án thành công.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/period/{period_id}",
    summary="Xem danh sách tất cả các Hội đồng theo Học kỳ",
)
async def get_councils_by_period(
    period_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
):
    """
    Endpoint xem danh sách các Hội đồng kèm các thành viên và lịch bảo vệ thuộc một Học kỳ cụ thể.
    """
    councils = await CouncilService(db).get_councils_by_period(period_id)
    return create_success_response(
        data=[c.model_dump(mode="json") for c in councils],
        message="Lấy danh sách Hội đồng thành công.",
    )

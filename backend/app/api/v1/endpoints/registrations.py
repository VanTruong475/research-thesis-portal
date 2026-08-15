from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.responses import create_success_response
from app.db.enums import RegistrationStatus, UserRole
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.registrations.schemas import (
    AssignSupervisorRequest,
    RegistrationCreateRequest,
    RegistrationRejectRequest,
)
from app.modules.registrations.service import LecturerService, RegistrationService
from app.modules.users.model import User

router = APIRouter()


@router.get(
    "/registrations",
    status_code=status.HTTP_200_OK,
    summary="List registrations",
)
async def list_registrations(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    status_filter: Annotated[RegistrationStatus | None, Query(alias="status")] = None,
    student_id: UUID | None = None,
    topic_id: UUID | None = None,
    academic_period_id: UUID | None = None,
    supervisor_id: UUID | None = None,
):
    registrations_data = await RegistrationService(db).list_registrations(
        current_user=current_user,
        page=page,
        page_size=page_size,
        status=status_filter,
        student_id=student_id,
        topic_id=topic_id,
        academic_period_id=academic_period_id,
        supervisor_id=supervisor_id,
    )
    return create_success_response(
        data=registrations_data.model_dump(mode="json"),
        message="Registrations retrieved successfully.",
    )


@router.post(
    "/registrations",
    status_code=status.HTTP_201_CREATED,
    summary="Student create a registration",
)
async def create_registration(
    payload: RegistrationCreateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_student: Annotated[User, Depends(require_roles(UserRole.STUDENT))],
):
    registration_data = await RegistrationService(db).create_registration(payload, current_student)
    return create_success_response(
        data=registration_data.model_dump(mode="json"),
        message="Registration created successfully.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/registrations/{registration_id}",
    status_code=status.HTTP_200_OK,
    summary="Get a registration",
)
async def get_registration(
    registration_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    registration_data = await RegistrationService(db).get_registration(
        registration_id,
        current_user,
    )
    return create_success_response(
        data=registration_data.model_dump(mode="json"),
        message="Registration retrieved successfully.",
    )


@router.put(
    "/registrations/{registration_id}/approve",
    status_code=status.HTTP_200_OK,
    summary="Approve a registration",
)
async def approve_registration(
    registration_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    registration_data = await RegistrationService(db).approve_registration(
        registration_id,
        current_user,
    )
    return create_success_response(
        data=registration_data.model_dump(mode="json"),
        message="Registration approved successfully.",
    )


@router.put(
    "/registrations/{registration_id}/reject",
    status_code=status.HTTP_200_OK,
    summary="Reject a registration",
)
async def reject_registration(
    registration_id: UUID,
    payload: RegistrationRejectRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    registration_data = await RegistrationService(db).reject_registration(
        registration_id,
        payload,
        current_user,
    )
    return create_success_response(
        data=registration_data.model_dump(mode="json"),
        message="Registration rejected successfully.",
    )


@router.patch(
    "/registrations/{registration_id}/cancel",
    status_code=status.HTTP_200_OK,
    summary="Student cancel own pending registration",
)
async def cancel_registration(
    registration_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_student: Annotated[User, Depends(require_roles(UserRole.STUDENT))],
):
    registration_data = await RegistrationService(db).cancel_registration(
        registration_id,
        current_student,
    )
    return create_success_response(
        data=registration_data.model_dump(mode="json"),
        message="Registration cancelled successfully.",
    )


@router.put(
    "/registrations/{registration_id}/assign-supervisor",
    status_code=status.HTTP_200_OK,
    summary="Admin assign supervisor to a registration",
)
async def assign_supervisor(
    registration_id: UUID,
    payload: AssignSupervisorRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
):
    registration_data = await RegistrationService(db).assign_supervisor(
        registration_id,
        payload,
        current_admin,
    )
    return create_success_response(
        data=registration_data.model_dump(mode="json"),
        message="Supervisor assigned successfully.",
    )


@router.get(
    "/lecturers/{id}/workload",
    status_code=status.HTTP_200_OK,
    summary="Get lecturer workload",
)
async def get_lecturer_workload_endpoint(
    id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    workload_data = await LecturerService(db).get_lecturer_workload(id)
    return create_success_response(
        data=workload_data.model_dump(mode="json"),
        message="Lấy thông tin tải hướng dẫn thành công.",
    )

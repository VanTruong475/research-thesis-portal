from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.responses import SuccessResponse
from app.db.session import get_db
from app.modules.progress.schemas import (
    AddTeacherCommentRequest,
    CreateProgressLogRequest,
    ProgressLogResponse,
)
from app.modules.progress.service import ProgressService

router = APIRouter()


@router.post(
    "/progress",
    response_model=SuccessResponse[ProgressLogResponse],
    status_code=status.HTTP_201_CREATED,
    summary="[Sinh viên] Nộp báo cáo tiến độ mới (FR-13)",
    description="Cho phép Sinh viên tạo bản ghi báo cáo tiến độ thực hiện đề tài.",
)
async def create_progress_log_endpoint(
    payload: CreateProgressLogRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_student: Annotated[User, Depends(require_roles(UserRole.STUDENT))],
):
    # Gọi Service thực hiện lưu vào CSDL
    new_log = await ProgressService.create_progress_log(
        db=db,
        student_id=current_student.id,
        payload=payload,
    )

    return SuccessResponse(
        data=ProgressLogResponse.model_validate(new_log),
        message="Nộp báo cáo tiến độ thành công.",
    )


@router.post(
    "/progress/{id}/comments",
    response_model=SuccessResponse[ProgressLogResponse],
    status_code=status.HTTP_200_OK,
    summary="[GVHD] Gửi nhận xét báo cáo tiến độ (FR-14)",
    description="Cho phép Giảng viên hướng dẫn ghi góp ý/nhận xét cho báo cáo tiến độ của sinh viên.",
)
async def add_teacher_comment_endpoint(
    id: UUID,
    payload: AddTeacherCommentRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_lecturer: Annotated[User, Depends(require_roles(UserRole.LECTURER))],
):
    # Gọi Service cập nhật nhận xét của GVHD vào CSDL
    updated_log = await ProgressService.add_teacher_comment(
        db=db,
        log_id=id,
        payload=payload,
    )

    return SuccessResponse(
        data=ProgressLogResponse.model_validate(updated_log),
        message="Gửi nhận xét báo cáo tiến độ thành công.",
    )


@router.get(
    "/registrations/{registration_id}/progress",
    response_model=SuccessResponse[list[ProgressLogResponse]],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tiến độ theo Đơn đăng ký",
    description="Trả về toàn bộ nhật ký báo cáo tiến độ của đơn đăng ký đề tài.",
)
async def get_progress_logs_endpoint(
    registration_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Gọi Service lấy danh sách từ CSDL
    logs = await ProgressService.get_progress_logs_by_registration(
        db=db,
        registration_id=registration_id,
    )

    # Chuyển đổi danh sách ORM objects thành danh sách Schema DTO
    response_data = [ProgressLogResponse.model_validate(log) for log in logs]

    return SuccessResponse(
        data=response_data,
        message="Lấy danh sách nhật ký tiến độ thành công.",
    )

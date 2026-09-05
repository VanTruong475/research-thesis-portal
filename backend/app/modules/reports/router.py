from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.responses import SuccessResponse
from app.db.enums import UserRole
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.reports.schemas import ReportResponse
from app.modules.reports.service import ReportService
from app.modules.users.model import User

router = APIRouter()


@router.post(
    "/reports",
    response_model=SuccessResponse[ReportResponse],
    status_code=status.HTTP_201_CREATED,
    summary="[Sinh viên] Nộp file Báo cáo / Sản phẩm theo đơn đăng ký (FR-16, FR-17, FR-18)",
    description=(
        "Cho phép Sinh viên upload file báo cáo cho đơn đăng ký đã được duyệt. "
        "Tự động quản lý số phiên bản theo đơn đăng ký và kiểm tra dung lượng file (tối đa 20MB)."
    ),
)
async def upload_report_endpoint(
    registration_id: Annotated[UUID, Form(description="ID của đơn đăng ký cần nộp báo cáo")],
    file: Annotated[UploadFile, File(description="File báo cáo cần upload (tối đa 20MB)")],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_student: Annotated[User, Depends(require_roles(UserRole.STUDENT))],
):
    report_record = await ReportService(db).upload_report(
        registration_id=registration_id,
        current_student=current_student,
        file=file,
    )

    return SuccessResponse(
        data=ReportResponse.model_validate(report_record),
        message=f"Nộp báo cáo thành công (Phiên bản {report_record.version}).",
    )


@router.get(
    "/registrations/{registration_id}/reports",
    response_model=SuccessResponse[list[ReportResponse]],
    status_code=status.HTTP_200_OK,
    summary="Xem lịch sử các phiên bản báo cáo của đơn đăng ký (FR-17)",
    description="Trả về danh sách toàn bộ các phiên bản file báo cáo đã được nộp của đơn đăng ký theo thứ tự mới nhất.",
)
async def get_registration_reports_endpoint(
    registration_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    reports = await ReportService(db).get_reports_by_registration(
        registration_id=registration_id,
        current_user=current_user,
    )

    response_data = [ReportResponse.model_validate(report) for report in reports]

    return SuccessResponse(
        data=response_data,
        message="Lấy danh sách lịch sử báo cáo thành công.",
    )

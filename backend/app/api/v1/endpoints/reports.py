from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.responses import SuccessResponse
from app.db.session import get_db
from app.modules.reports.schemas import ReportResponse
from app.modules.reports.service import ReportService

router = APIRouter()


@router.post(
    "/reports",
    response_model=SuccessResponse[ReportResponse],
    status_code=status.HTTP_201_CREATED,
    summary="[Sinh viên] Nộp file Báo cáo / Sản phẩm (FR-16, FR-17, FR-18)",
    description=(
        "Cho phép Sinh viên upload file báo cáo (PDF, DOCX, ZIP...). "
        "Tự động quản lý số phiên bản và kiểm tra dung lượng file (tối đa 20MB)."
    ),
)
async def upload_report_endpoint(
    topic_id: Annotated[UUID, Form(description="ID của đề tài cần nộp báo cáo")],
    file: Annotated[UploadFile, File(description="File báo cáo cần upload (tối đa 20MB)")],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # UUID giả lập Sinh viên đang đăng nhập (khi chưa đấu nối JWT authentication)
    mock_student_id = UUID("00000000-0000-0000-0000-000000000002")

    # Gọi Service xử lý lưu trữ file và CSDL
    report_record = await ReportService.upload_report(
        db=db,
        topic_id=topic_id,
        student_id=mock_student_id,
        file=file,
    )

    return SuccessResponse(
        data=ReportResponse.model_validate(report_record),
        message=f"Nộp báo cáo thành công (Phiên bản {report_record.version}).",
    )


@router.get(
    "/topics/{topic_id}/reports",
    response_model=SuccessResponse[list[ReportResponse]],
    status_code=status.HTTP_200_OK,
    summary="Xem lịch sử các phiên bản báo cáo của đề tài (FR-17)",
    description="Trả về danh sách toàn bộ các phiên bản file báo cáo đã được nộp của đề tài theo thứ tự mới nhất.",
)
async def get_topic_reports_endpoint(
    topic_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Gọi Service lấy danh sách các bản báo cáo từ CSDL
    reports = await ReportService.get_reports_by_topic(
        db=db,
        topic_id=topic_id,
    )

    # Chuyển đổi danh sách ORM objects thành Schema DTO
    response_data = [ReportResponse.model_validate(report) for report in reports]

    return SuccessResponse(
        data=response_data,
        message="Lấy danh sách lịch sử báo cáo thành công.",
    )

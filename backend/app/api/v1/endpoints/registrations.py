from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.common.responses import SuccessResponse
from app.modules.registrations.schemas import AssignSupervisorRequest, RegistrationResponse
from app.modules.users.schemas import LecturerWorkloadResponse
from app.modules.registrations.service import RegistrationService, LecturerService

# Khởi tạo Router cho các API Đăng ký & Phân công
router = APIRouter()


@router.put(
    "/registrations/{id}/assign-gvhd",
    response_model=SuccessResponse[RegistrationResponse],
    status_code=status.HTTP_200_OK,
    summary="[Admin] Phân công GVHD cho Đăng ký đề tài (FR-11)",
    description="Cho phép Admin phân công thủ công hoặc thay đổi Giảng viên hướng dẫn cho một đơn đăng ký đề tài."
)
async def assign_supervisor_endpoint(
    id: UUID,
    payload: AssignSupervisorRequest,
    db: AsyncSession = Depends(get_db)
):
    # TODO: Khi có middleware auth hoàn chỉnh từ Người A, lấy admin_id từ current_user token.
    # Hiện tại mock admin_id giả lập để test endpoint độc lập.
    mock_admin_id = UUID("00000000-0000-0000-0000-000000000001")

    # Gọi Service thực hiện nghiệp vụ phân công GVHD
    updated_registration = await RegistrationService.assign_supervisor(
        db=db,
        registration_id=id,
        supervisor_id=payload.supervisor_id,
        admin_id=mock_admin_id
    )

    # Đóng gói dữ liệu phản hồi theo chuẩn SuccessResponse của dự án
    return SuccessResponse(
        data=RegistrationResponse.model_validate(updated_registration),
        message="Phân công Giảng viên hướng dẫn thành công."
    )


@router.get(
    "/lecturers/{id}/workload",
    response_model=SuccessResponse[LecturerWorkloadResponse],
    status_code=status.HTTP_200_OK,
    summary="[Admin] Xem tải hướng dẫn của Giảng viên (FR-12)",
    description="Trả về thông tin số lượng đề tài/sinh viên mà giảng viên đang hướng dẫn trong kỳ."
)
async def get_lecturer_workload_endpoint(
    id: UUID,
    db: AsyncSession = Depends(get_db)
):
    # Gọi Service lấy dữ liệu khối lượng công việc của giảng viên
    workload_data = await LecturerService.get_lecturer_workload(
        db=db,
        lecturer_id=id
    )

    # Đóng gói dữ liệu phản hồi theo chuẩn SuccessResponse
    return SuccessResponse(
        data=LecturerWorkloadResponse.model_validate(workload_data),
        message="Lấy thông tin tải hướng dẫn thành công."
    )

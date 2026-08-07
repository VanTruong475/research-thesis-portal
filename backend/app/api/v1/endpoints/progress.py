from datetime import datetime, timezone
from uuid import UUID, uuid4
from fastapi import APIRouter, status
from app.common.responses import SuccessResponse
from app.modules.progress.schemas import CreateProgressLogRequest, ProgressLogResponse

router = APIRouter()


@router.get(
    "/progress",
    response_model=SuccessResponse[list[ProgressLogResponse]],
    status_code=status.HTTP_200_OK,
    summary="[Stub] Lấy danh sách tiến độ",
    description="Endpoint Stub trả về dữ liệu giả định (mock data) danh sách báo cáo tiến độ để không làm ngắt quãng công việc của Người A."
)
async def get_progress_logs_stub():
    # Dữ liệu giả lập (Mock data)
    mock_data = [
        ProgressLogResponse(
            id=uuid4(),
            registration_id=uuid4(),
            student_id=uuid4(),
            milestone_id=None,
            content="Đã hoàn thành khảo sát yêu cầu và viết xong Usecase Spec.",
            submitted_at=datetime.now(timezone.utc),
            teacher_comment="Tốt, tiếp tục triển khai thiết kế DB.",
            commented_at=datetime.now(timezone.utc)
        )
    ]
    return SuccessResponse(
        data=mock_data,
        message="Lấy danh sách nhật ký tiến độ (Mock Stub) thành công."
    )


@router.post(
    "/progress",
    response_model=SuccessResponse[ProgressLogResponse],
    status_code=status.HTTP_201_CREATED,
    summary="[Stub] Nộp báo cáo tiến độ mới",
    description="Endpoint Stub tiếp nhận dữ liệu nộp tiến độ và trả về bản ghi giả lập."
)
async def create_progress_log_stub(payload: CreateProgressLogRequest):
    # Dữ liệu giả lập sau khi nhận request
    mock_response = ProgressLogResponse(
        id=uuid4(),
        registration_id=payload.registration_id,
        student_id=uuid4(),
        milestone_id=payload.milestone_id,
        content=payload.content,
        submitted_at=datetime.now(timezone.utc),
        teacher_comment=None,
        commented_at=None
    )
    return SuccessResponse(
        data=mock_response,
        message="Báo cáo tiến độ đã được cập nhật (Mock Stub)."
    )

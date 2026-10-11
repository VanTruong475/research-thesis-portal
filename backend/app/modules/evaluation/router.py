# backend/app/modules/evaluation/router.py
# File định nghĩa các REST API Endpoints cho Module Chấm điểm (Scoring) và Kết quả cuối cùng (Final Results).

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.responses import SuccessResponse
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.evaluation.schemas import (
    FinalResultCalculateRequest,
    FinalResultResponse,
    ScoreCreate,
    ScoreResponse,
    ScoreUpdate,
)
from app.modules.evaluation.service import EvaluationService
from app.modules.users.model import User

router = APIRouter(prefix="", tags=["Scoring & Final Results"])


# ==========================================
# 1. API ENDPOINTS CHẤM ĐIỂM (SCORES)
# ==========================================


@router.post(
    "/scores",
    response_model=SuccessResponse[ScoreResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Nộp hoặc cập nhật phiếu điểm chấm đồ án (GVHD hoặc Hội đồng)",
)
async def submit_score(
    data: ScoreCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    API cho phép Giảng viên nhập điểm chấm:
    - **evaluation_type = 'supervisor'**: Điểm quá trình từ GVHD.
    - **evaluation_type = 'council'**: Điểm bảo vệ từ Thành viên Hội đồng.
    """
    service = EvaluationService(db)
    score_obj = await service.submit_or_update_score(current_user, data)
    return SuccessResponse(
        message="Đã cập nhật phiếu điểm chấm thành công.",
        data=ScoreResponse.model_validate(score_obj),
    )


@router.get(
    "/scores",
    response_model=SuccessResponse[list[ScoreResponse]],
    summary="Xem danh sách phiếu điểm theo đăng ký",
)
async def list_scores(
    registration_id: Annotated[UUID, Query(description="ID đăng ký đồ án/khóa luận")],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    API theo hợp đồng: lấy các phiếu điểm của một đăng ký theo quyền truy cập.
    """
    service = EvaluationService(db)
    scores = await service.get_scores_by_registration(registration_id, current_user)
    return SuccessResponse(
        message="Lấy danh sách phiếu điểm thành công.",
        data=[ScoreResponse.model_validate(score) for score in scores],
    )


@router.get(
    "/scores/registration/{registration_id}",
    response_model=SuccessResponse[list[ScoreResponse]],
    summary="Xem danh sách các phiếu điểm chấm cho một đồ án",
)
async def get_scores_by_registration(
    registration_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    API tương thích frontend hiện tại: xem phiếu điểm của một đăng ký theo quyền truy cập.
    """
    service = EvaluationService(db)
    scores = await service.get_scores_by_registration(registration_id, current_user)
    return SuccessResponse(
        message="Lấy danh sách phiếu điểm thành công.",
        data=[ScoreResponse.model_validate(score) for score in scores],
    )


@router.put(
    "/scores/{score_id}",
    response_model=SuccessResponse[ScoreResponse],
    summary="Cập nhật phiếu điểm trước khi kết quả được công bố",
)
async def update_score(
    score_id: UUID,
    data: ScoreUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    API cho phép giảng viên cập nhật phiếu điểm của chính mình khi chưa bị khóa.
    """
    service = EvaluationService(db)
    score_obj = await service.update_score(current_user, score_id, data)
    return SuccessResponse(
        message="Cập nhật phiếu điểm thành công.",
        data=ScoreResponse.model_validate(score_obj),
    )


# ==========================================
# 2. API ENDPOINTS KẾT QUẢ CUỐI CÙNG (FINAL RESULTS)
# ==========================================


@router.post(
    "/registrations/{registration_id}/final-result/calculate",
    response_model=SuccessResponse[FinalResultResponse],
    summary="Tính toán điểm tổng kết đồ án (FR-21)",
)
async def calculate_final_result(
    registration_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    req: FinalResultCalculateRequest | None = None,
):
    """
    API tự động tổng hợp điểm quá trình (40%) và điểm trung bình Hội đồng (60%).
    """
    service = EvaluationService(db)
    sup_weight = req.supervisor_weight if req else 40.0
    coun_weight = req.council_weight if req else 60.0

    result_obj = await service.calculate_final_result(
        current_user,
        registration_id,
        supervisor_weight=sup_weight,
        council_weight=coun_weight,
    )
    return SuccessResponse(
        message="Tính toán điểm tổng kết thành công.",
        data=FinalResultResponse.model_validate(result_obj),
    )


@router.post(
    "/registrations/{registration_id}/final-result/publish",
    response_model=SuccessResponse[FinalResultResponse],
    summary="Admin phê duyệt công bố Kết quả tổng kết cho Sinh viên (FR-21)",
)
async def publish_final_result(
    registration_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    API dành riêng cho Admin để công bố điểm chính thức cho Sinh viên xem.
    """
    service = EvaluationService(db)
    result_obj = await service.publish_final_result(current_user, registration_id)
    return SuccessResponse(
        message="Công bố kết quả tổng kết thành công và đã khóa điểm chấm.",
        data=FinalResultResponse.model_validate(result_obj),
    )


@router.get(
    "/registrations/{registration_id}/final-result",
    response_model=SuccessResponse[FinalResultResponse],
    summary="Xem Kết quả tổng kết đồ án của Sinh viên",
)
async def get_final_result(
    registration_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    API xem Kết quả tổng kết đồ án. Sinh viên chỉ xem được kết quả của mình khi đã công bố.
    """
    service = EvaluationService(db)
    result_obj = await service.get_final_result(current_user, registration_id)
    return SuccessResponse(
        message="Lấy thông tin kết quả tổng kết thành công.",
        data=FinalResultResponse.model_validate(result_obj),
    )

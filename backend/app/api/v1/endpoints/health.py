from fastapi import APIRouter

from app.common.responses import SuccessResponse

router = APIRouter()


@router.get("/health", response_model=SuccessResponse)
async def health_check() -> SuccessResponse:
    return SuccessResponse(
        success=True,
        message="Service is healthy.",
        data={"status": "ok"},
    )

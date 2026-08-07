from fastapi import APIRouter

from app.api.v1.endpoints.health import router as health_router
from app.modules.auth.router import router as auth_router
from app.api.v1.endpoints.registrations import router as registrations_router
from app.api.v1.endpoints.progress import router as progress_router

router = APIRouter()

router.include_router(health_router, tags=["Health"])
router.include_router(auth_router)
# Đăng ký các API Phân công GVHD & Xem tải GV (FR-11, FR-12)
router.include_router(registrations_router, tags=["Registrations & Lecturers"])
# Đăng ký các API Stub Tiến độ (Progress)
router.include_router(progress_router, tags=["Progress (Stub)"])


from fastapi import APIRouter

from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.progress import router as progress_router
from app.api.v1.endpoints.registrations import router as registrations_router
from app.api.v1.endpoints.reports import router as reports_router
from app.modules.academic_periods.router import router as academic_periods_router
from app.modules.auth.router import router as auth_router
from app.modules.councils.router import router as councils_router
from app.modules.evaluation.router import router as evaluation_router
from app.modules.topics.router import router as topics_router
from app.modules.users.router import router as users_router

router = APIRouter()

router.include_router(health_router, tags=["Health"])
router.include_router(auth_router)
router.include_router(users_router)
router.include_router(academic_periods_router)
router.include_router(councils_router)
router.include_router(evaluation_router)
# Đăng ký các API Phân công GVHD & Xem tải GV (FR-11, FR-12)
router.include_router(registrations_router, tags=["Registrations & Lecturers"])
# Đăng ký các API Module Tiến độ (Progress Logs - FR-13, FR-14)
router.include_router(progress_router, tags=["Progress"])
# Đăng ký các API Module Nộp file Báo cáo & Lịch sử phiên bản (Reports - FR-16, FR-17, FR-18)
router.include_router(reports_router, tags=["Reports & Submissions"])
router.include_router(topics_router)

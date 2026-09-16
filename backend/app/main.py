# backend/app/main.py
# Main FastAPI application entrypoint.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Nạp toàn bộ ORM Models đăng ký với SQLAlchemy
import app.db.base
from app.api.v1.router import router as v1_router
from app.common.exceptions import install_exception_handlers
from app.common.responses import create_success_response
from app.core.config import settings

# Khởi tạo ứng dụng FastAPI với đầy đủ cấu hình từ settings và Swagger/ReDoc UI
app = FastAPI(
    title=settings.app_name,
    description=(
        "Hệ thống quản lý đề tài nghiên cứu khoa học "
        "và khóa luận tốt nghiệp (UTH)"
    ),
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# --- CẤU HÌNH CORS (Cross-Origin Resource Sharing) ---
# Cho phép Frontend Angular gửi request đến Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ĐĂNG KÝ XỬ LÝ LỖI TẬP TRUNG (CENTRALIZED EXCEPTION HANDLERS) ---
install_exception_handlers(app)

# --- TÍNH NĂNG ROUTER API V1 ---
# Gắn tất cả các đường dẫn API cấp v1 với tiền tố /api/v1
app.include_router(v1_router, prefix="/api/v1")


# --- ROUTE KIỂM TRA SỨC KHỎE HỆ THỐNG (HEALTH CHECK) ---
@app.get("/health", summary="Kiểm tra trạng thái Backend")
async def health_check():
    """
    Endpoint đơn giản dùng để kiểm tra Backend có đang hoạt động tốt hay không.
    """
    return create_success_response(
        data={"status": "healthy", "service": settings.app_name},
        message="Hệ thống Backend đang hoạt động bình thường",
    )

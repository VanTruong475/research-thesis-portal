from fastapi import FastAPI

from app.api.v1.router import router as v1_router
from app.common.exceptions import install_exception_handlers
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs",
    openapi_url="/openapi.json",
)

install_exception_handlers(app)
app.include_router(v1_router, prefix="/api/v1")
# backend/app/main.py
# File điểm khởi đầu (Entrypoint) chính của ứng dụng FastAPI.
# Nơi khởi tạo ứng dụng, cấu hình CORS, đăng ký Exception Handlers và bao gồm các Routers.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

# Import các Exception Handler và Response Helper chuẩn vừa tạo ở folder common
from app.common.exceptions import (
    AppException,
    app_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    global_exception_handler
)
from app.common.responses import create_success_response

# Khởi tạo ứng dụng FastAPI với đầy đủ thông tin tiêu đề và tài liệu OpenAPI (Swagger)
app = FastAPI(
    title="Research Thesis Portal API",
    description="Hệ thống quản lý đề tài nghiên cứu khoa học và khóa luận tốt nghiệp (UTH)",
    version="1.0.0",
    docs_url="/docs",      # Đường dẫn xem giao diện Swagger UI
    redoc_url="/redoc"     # Đường dẫn xem giao diện ReDoc
)

# --- CẤU HÌNH CORS (Cross-Origin Resource Sharing) ---
# Cho phép Frontend Angular (chạy port 4200 hoặc khác) gửi request đến Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # Cho phép tất cả nguồn (Trong sản phẩm thực tế sẽ đổi thành URL Angular)
    allow_credentials=True,
    allow_methods=["*"],            # Cho phép tất cả phương thức HTTP (GET, POST, PUT, DELETE,...)
    allow_headers=["*"],            # Cho phép tất cả các Header
)

# --- ĐĂNG KÝ XỬ LÝ LỖI TẬP TRUNG (EXCEPTION HANDLERS) ---
# Bắt lỗi logic nghiệp vụ do ứng dụng chủ động raise
app.add_exception_handler(AppException, app_exception_handler)

# Bắt lỗi validate dữ liệu đầu vào (Pydantic / Request body)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Bắt các lỗi HTTP chung (404 Not Found, 405 Method Not Allowed,...)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)

# Bắt tất cả các lỗi không lường trước (Server Error 500)
app.add_exception_handler(Exception, global_exception_handler)


# --- ROUTE KIỂM TRA SỨC KHỎE HỆ THỐNG (HEALTH CHECK) ---
@app.get("/health", summary="Kiểm tra trạng thái Backend")
async def health_check():
    """
    Endpoint đơn giản dùng để kiểm tra Backend có đang hoạt động tốt hay không.
    """
    return create_success_response(
        data={"status": "healthy", "service": "Research Thesis Portal Backend"},
        message="Hệ thống Backend đang hoạt động bình thường"
    )

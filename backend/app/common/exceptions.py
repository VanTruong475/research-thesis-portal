# backend/app/common/exceptions.py
# File này định nghĩa Custom Exception (Ngoại lệ tùy chỉnh) và Middleware Exception Handler.
# Mục đích: Bắt tất cả các lỗi xảy ra trong ứng dụng và chuyển thành JSONResponse chuẩn theo API Contract.

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.common.responses import create_error_response

class AppException(Exception):
    """
    Class ngoại lệ cơ sở (Base Custom Exception) cho toàn bộ ứng dụng.
    Tất cả các lỗi nghiệp vụ (Business logic errors) trong hệ thống sẽ kế thừa từ Class này.
    """
    def __init__(
        self, 
        message: str, 
        error_code: str = "BAD_REQUEST", 
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: any = None
    ):
        self.message = message            # Thông báo lỗi dành cho người dùng
        self.error_code = error_code      # Mã lỗi định danh (VD: USER_NOT_FOUND, TOPIC_CLOSED)
        self.status_code = status_code    # Mã trạng thái HTTP (400, 401, 403, 404,...)
        self.details = details            # Chi tiết bổ sung nếu có

# --- BỘ CÁC NGOẠI LỆ NGHIỆP VỤ THƯỜNG DÙNG ---

class NotFoundException(AppException):
    """Ngoại lệ khi không tìm thấy tài nguyên (HTTP 404)"""
    def __init__(self, message: str = "Tài nguyên không tồn tại", error_code: str = "NOT_FOUND"):
        super().__init__(message=message, error_code=error_code, status_code=status.HTTP_404_NOT_FOUND)

class UnauthorizedException(AppException):
    """Ngoại lệ khi chưa đăng nhập hoặc Token hết hạn (HTTP 401)"""
    def __init__(self, message: str = "Chưa xác thực hoặc phiên làm việc đã hết hạn", error_code: str = "UNAUTHORIZED"):
        super().__init__(message=message, error_code=error_code, status_code=status.HTTP_401_UNAUTHORIZED)

class ForbiddenException(AppException):
    """Ngoại lệ khi không có quyền truy cập (HTTP 403)"""
    def __init__(self, message: str = "Bạn không có quyền thực hiện thao tác này", error_code: str = "FORBIDDEN"):
        super().__init__(message=message, error_code=error_code, status_code=status.HTTP_403_FORBIDDEN)


# --- HANDLER BẮT VÀ XỬ LÝ LỖI CHUẨN TRONG FASTAPI ---

async def app_exception_handler(request: Request, exc: AppException):
    """
    Bắt các lỗi AppException do lập trình viên chủ động raise trong logic nghiệp vụ.
    """
    return create_error_response(
        message=exc.message,
        error_code=exc.error_code,
        details=exc.details,
        status_code=exc.status_code
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Bắt lỗi Validate dữ liệu đầu vào của FastAPI (Pydantic ValidationError - HTTP 422).
    Chuyển đổi các lỗi dạng mặc định của FastAPI thành chuẩn format dự án.
    """
    # Lấy danh sách các trường bị lỗi validator
    errors = exc.errors()
    formatted_errors = []
    for err in errors:
        loc = " -> ".join([str(item) for item in err.get("loc", [])])
        formatted_errors.append({
            "field": loc,
            "message": err.get("msg")
        })

    return create_error_response(
        message="Dữ liệu yêu cầu không hợp lệ",
        error_code="VALIDATION_ERROR",
        details=formatted_errors,
        status_code=status.HTTP_400_BAD_REQUEST
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Bắt các lỗi HTTP thông thường (VD: FastAPI tự văng 404 hoặc 405 Method Not Allowed).
    """
    return create_error_response(
        message=str(exc.detail),
        error_code=f"HTTP_{exc.status_code}",
        status_code=exc.status_code
    )

async def global_exception_handler(request: Request, exc: Exception):
    """
    Bắt tất cả các lỗi không lường trước (Unhandled Server Errors - HTTP 500).
    Giúp ứng dụng không bị crash rò rỉ thông tin nhạy cảm.
    """
    return create_error_response(
        message="Lỗi hệ thống nội bộ. Vui lòng liên hệ quản trị viên.",
        error_code="INTERNAL_SERVER_ERROR",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

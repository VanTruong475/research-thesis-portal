# backend/app/common/exceptions.py
# Custom exceptions and centralized handlers for API-contract error responses.

from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.common.responses import create_error_response
from app.core.config import settings


class AppException(Exception):
    """
    Base custom exception for application and business-logic errors.
    """

    def __init__(
        self,
        arg1: Any = None,
        arg2: Any = None,
        code: str | None = None,
        details: Any = None,
        status_code: int | None = None,
        message: str | None = None,
        error_code: str | None = None,
    ) -> None:
        """
        Support both members' existing constructor styles.
        """
        # Trường hợp 1: Tham số thứ nhất là int (status_code)
        if isinstance(arg1, int):
            self.status_code = arg1
            self.message = arg2 if isinstance(arg2, str) else (message or "Request failed.")
            resolved_code = code or error_code or "BAD_REQUEST"
        # Trường hợp 2: Tham số thứ nhất là str (message)
        elif isinstance(arg1, str):
            self.message = arg1
            if isinstance(arg2, int):
                self.status_code = arg2
                resolved_code = code or error_code or "BAD_REQUEST"
            elif isinstance(arg2, str):
                resolved_code = arg2
                self.status_code = (
                    status_code if status_code is not None else status.HTTP_400_BAD_REQUEST
                )
            else:
                self.status_code = (
                    status_code if status_code is not None else status.HTTP_400_BAD_REQUEST
                )
                resolved_code = code or error_code or "BAD_REQUEST"
        # Trường hợp 3: Sử dụng keyword arguments (named parameters)
        else:
            self.status_code = (
                status_code if status_code is not None else status.HTTP_400_BAD_REQUEST
            )
            self.message = message or "Request failed."
            resolved_code = code or error_code or "BAD_REQUEST"

        # Gán cả .code và .error_code để tương thích code của cả 2 thành viên
        self.code = resolved_code
        self.error_code = resolved_code
        self.details = details


# --- BỘ CÁC NGOẠI LỆ NGHIỆP VỤ THƯỜNG DÙNG (EXTENDED EXCEPTIONS) ---

class NotFoundException(AppException):
    """Ngoại lệ khi không tìm thấy tài nguyên (HTTP 404)"""

    def __init__(
        self,
        message: str = "Tài nguyên không tồn tại",
        error_code: str = "NOT_FOUND",
        details: Any = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


class UnauthorizedException(AppException):
    """Ngoại lệ khi chưa đăng nhập hoặc token hết hạn (HTTP 401)"""

    def __init__(
        self,
        message: str = "Chưa xác thực hoặc phiên làm việc đã hết hạn",
        error_code: str = "UNAUTHORIZED",
        details: Any = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details,
        )


class ForbiddenException(AppException):
    """Ngoại lệ khi không có quyền truy cập (HTTP 403)"""

    def __init__(
        self,
        message: str = "Bạn không có quyền thực hiện thao tác này",
        error_code: str = "FORBIDDEN",
        details: Any = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=status.HTTP_403_FORBIDDEN,
            details=details,
        )


class BadRequestException(AppException):
    """Ngoại lệ khi yêu cầu không hợp lệ (HTTP 400)"""

    def __init__(
        self,
        message: str = "Yêu cầu không hợp lệ",
        error_code: str = "BAD_REQUEST",
        details: Any = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


# Alias tương thích cho các module cũ
ResourceNotFoundException = NotFoundException
BusinessRuleException = AppException


# --- BỘ HANDLER XỬ LÝ LỖI TẬP TRUNG (CENTERED EXCEPTION HANDLERS) ---

async def app_exception_handler(_request: Request, exc: AppException) -> JSONResponse:
    """
    Bắt các lỗi AppException do lập trình viên chủ động raise.
    """
    return create_error_response(
        message=exc.message,
        error_code=exc.code,
        details=exc.details,
        status_code=exc.status_code,
    )


async def validation_exception_handler(
    _request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """
    Chuyển lỗi validate mặc định của FastAPI sang chuẩn API Contract.
    """
    fields = []
    for error in exc.errors():
        # Lấy tên trường thông tin bị lỗi (loại bỏ từ 'body' nếu có)
        location = [str(part) for part in error.get("loc", []) if part != "body"]
        fields.append(
            {
                "field": ".".join(location) if location else "body",
                "message": str(error.get("msg", "Dữ liệu không hợp lệ.")),
            }
        )

    return create_error_response(
        message="Request validation failed.",
        error_code="VALIDATION_ERROR",
        details={"fields": fields},
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    )


async def http_exception_handler(
    _request: Request,
    exc: StarletteHTTPException | HTTPException,
) -> JSONResponse:
    """
    Bắt các lỗi HTTP chung như 404 Not Found hoặc 405 Method Not Allowed.
    """
    if isinstance(exc.detail, dict):
        message = exc.detail.get("message", "Request failed.")
        code = exc.detail.get("code", f"HTTP_{exc.status_code}")
        details = exc.detail.get("details")
    else:
        message = str(exc.detail) if exc.detail else "Request failed."
        code = f"HTTP_{exc.status_code}"
        details = None

    return create_error_response(
        message=message,
        error_code=code,
        details=details,
        status_code=exc.status_code,
    )


async def generic_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    """
    Bắt lỗi hệ thống không lường trước (Unhandled Errors - HTTP 500).
    """
    if settings.app_env == "test":
        raise exc

    return create_error_response(
        message="An unexpected error occurred.",
        error_code="INTERNAL_SERVER_ERROR",
        details=None,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


# Alias tên hàm để tương thích với cả 2 cách gọi name conventions
global_exception_handler = generic_exception_handler


def install_exception_handlers(app: FastAPI) -> None:
    """
    Hàm tiện ích đăng ký toàn bộ các Exception Handlers vào ứng dụng FastAPI.
    """
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

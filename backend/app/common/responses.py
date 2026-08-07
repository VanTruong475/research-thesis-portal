# backend/app/common/responses.py
# File này định nghĩa cấu trúc Response (Phản hồi) chuẩn cho toàn bộ API trong hệ thống.
# Định dạng tuân thủ quy ước tại docs/05_API_CONTRACT.md.

from typing import Any, Generic, Optional, TypeVar
from fastapi import status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Khai báo TypeVar để hỗ trợ kiểu dữ liệu linh hoạt (Generic) cho trường data trong Pydantic Model
T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    """
    Schema chuẩn cho các phản hồi thành công (HTTP 200, 201,...).
    Tất cả API thành công ĐỀU PHẢI trả về đúng định dạng này theo docs/05_API_CONTRACT.md.
    """
    success: bool = True               # Luôn là True đối với response thành công
    message: str                        # Thông điệp mô tả ngắn gọn (VD: "Lấy danh sách thành công")
    data: Optional[T] = None           # Dữ liệu trả về (Object, List, hoặc None)


class ErrorDetail(BaseModel):
    """
    Schema chi tiết về lỗi xảy ra.
    """
    code: str                          # Mã lỗi định danh dạng MACHINE_READABLE (VD: "INVALID_CREDENTIALS")
    details: Optional[Any] = None      # Thông tin chi tiết bổ sung (VD: danh sách các trường nộp thiếu)


class ErrorResponse(BaseModel):
    """
    Schema chuẩn cho các phản hồi thất bại / có lỗi (HTTP 400, 401, 403, 404, 500,...).
    """
    success: bool = False              # Luôn là False đối với response lỗi
    message: str                        # Thông báo lỗi hiển thị an toàn cho người dùng
    error: ErrorDetail                 # Đối tượng chứa mã lỗi và thông tin chi tiết


def create_success_response(
    data: Any = None,
    message: str = "Thành công",
    status_code: int = status.HTTP_200_OK,
) -> JSONResponse:
    """
    Hàm tiện ích (Helper function) giúp tạo nhanh một JSONResponse thành công chuẩn.

    Logic hoạt động:
    - Nhận vào dữ liệu (data), thông điệp (message), và mã trạng thái HTTP (status_code).
    - Đóng gói thành dict đúng chuẩn { success: True, message, data }.
    - Trả về đối tượng JSONResponse của FastAPI.
    """
    payload = {
        "success": True,
        "message": message,
        "data": data,
    }
    return JSONResponse(status_code=status_code, content=payload)


def create_error_response(
    message: str,
    error_code: str,
    details: Any = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> JSONResponse:
    """
    Hàm tiện ích (Helper function) giúp tạo nhanh một JSONResponse lỗi chuẩn.

    Logic hoạt động:
    - Nhận vào thông báo lỗi, mã lỗi (error_code), chi tiết lỗi và HTTP status code.
    - Đóng gói thành dict đúng chuẩn { success: False, message, error: { code, details } }.
    - Trả về đối tượng JSONResponse của FastAPI.
    """
    payload = {
        "success": False,
        "message": message,
        "error": {
            "code": error_code,
            "details": details,
        },
    }
    return JSONResponse(status_code=status_code, content=payload)

# backend/app/common/responses.py
# Standard API response structures defined by docs/05_API_CONTRACT.md.

from typing import Any, Generic, TypeVar

from fastapi import status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Khai báo TypeVar để hỗ trợ kiểu dữ liệu linh hoạt cho trường data trong Pydantic Model
T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    """
    Schema chuẩn cho các phản hồi thành công (HTTP 200, 201,...).
    """

    success: bool = True
    message: str
    data: T | None = None


class ErrorDetail(BaseModel):
    """
    Schema chi tiết về lỗi xảy ra.
    """

    code: str
    details: Any | None = None


class ErrorResponse(BaseModel):
    """
    Schema chuẩn cho các phản hồi thất bại / có lỗi.
    """

    success: bool = False
    message: str
    error: ErrorDetail


def create_success_response(
    data: Any = None,
    message: str = "Thành công",
    status_code: int = status.HTTP_200_OK,
) -> JSONResponse:
    """
    Hàm tiện ích giúp tạo nhanh một JSONResponse thành công chuẩn.
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
    Hàm tiện ích giúp tạo nhanh một JSONResponse lỗi chuẩn.
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

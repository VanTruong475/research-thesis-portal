# backend/app/common/pagination.py
# Pagination schemas and helper for shared API responses.

import math
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

# Khai báo Generic TypeVar T đại diện cho kiểu dữ liệu của items trong danh sách
T = TypeVar("T")


class PaginationParams(BaseModel):
    """
    Schema cho các tham số phân trang nhận từ Query String của Client (GET request).
    VD: GET /topics?page=1&limit=10
    """

    page: int = Field(default=1, ge=1, description="Số trang hiện tại (bắt đầu từ 1)")
    limit: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Số lượng bản ghi trên một trang (tối đa 100)",
    )

    @property
    def offset(self) -> int:
        """
        Tính toán vị trí bỏ qua (OFFSET) dùng cho truy vấn SQL/SQLAlchemy.
        Công thức: (page - 1) * limit
        """
        return (self.page - 1) * self.limit


class PaginationMeta(BaseModel):
    """
    Schema chứa các thông tin metadata của trang (Tổng số bản ghi, tổng số trang,...).
    """

    item_count: int = Field(..., description="Tổng số bản ghi trong cơ sở dữ liệu")
    total_pages: int = Field(..., description="Tổng số trang tính toán được")
    current_page: int = Field(..., description="Trang hiện tại")
    items_per_page: int = Field(..., description="Số bản ghi trên mỗi trang")


class PaginatedData(BaseModel, Generic[T]):
    """
    Schema bao bọc danh sách dữ liệu kết hợp với thông tin phân trang.
    """

    items: list[T] = Field(..., description="Danh sách các bản ghi của trang hiện tại")
    meta: PaginationMeta = Field(..., description="Thông tin chi tiết về phân trang")


def create_paginated_response(
    items: list[T],
    total_items: int,
    page: int,
    limit: int,
) -> PaginatedData[T]:
    """
    Tạo đối tượng PaginatedData đã sẵn sàng đưa vào SuccessResponse.
    """
    total_pages = math.ceil(total_items / limit) if limit > 0 else 0

    meta = PaginationMeta(
        item_count=total_items,
        total_pages=total_pages,
        current_page=page,
        items_per_page=limit,
    )

    return PaginatedData(items=items, meta=meta)

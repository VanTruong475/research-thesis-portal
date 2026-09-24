from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.db.enums import TopicStatus


class TopicBase(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    academic_period_id: UUID
    code: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    requirements: str | None = None
    max_students: int = Field(default=1, ge=1)


class TopicCreateRequest(TopicBase):
    pass


class TopicUpdateRequest(TopicBase):
    pass


class TopicRejectRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    rejection_reason: str = Field(..., min_length=1)

    @field_validator("rejection_reason")
    @classmethod
    def rejection_reason_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Rejection reason is required.")
        return value


class TopicStatusUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: TopicStatus


class PaginationResponse(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class TopicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    academic_period_id: UUID
    code: str
    title: str
    description: str
    requirements: str | None = None
    max_students: int
    current_students: int = 0
    proposed_by_id: UUID
    approved_by_id: UUID | None = None
    status: TopicStatus
    rejection_reason: str | None = None
    approved_at: datetime | None = None
    closed_at: datetime | None = None
    cancelled_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class TopicListResponse(BaseModel):
    items: list[TopicResponse]
    pagination: PaginationResponse


TopicAvailabilityFilter = Literal["available"]

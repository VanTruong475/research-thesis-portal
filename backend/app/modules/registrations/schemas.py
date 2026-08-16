from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.db.enums import RegistrationStatus


class RegistrationCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    topic_id: UUID
    student_note: str | None = None


class RegistrationRejectRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    review_reason: str = Field(..., min_length=1)

    @field_validator("review_reason")
    @classmethod
    def review_reason_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Review reason is required.")
        return value


class AssignSupervisorRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    supervisor_id: UUID


class RegistrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    academic_period_id: UUID
    topic_id: UUID
    student_id: UUID
    supervisor_id: UUID | None = None
    status: RegistrationStatus
    student_note: str | None = None
    review_reason: str | None = None
    reviewed_by_id: UUID | None = None
    registered_at: datetime
    reviewed_at: datetime | None = None
    supervisor_assigned_by_id: UUID | None = None
    supervisor_assigned_at: datetime | None = None
    cancelled_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class PaginationResponse(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class RegistrationListResponse(BaseModel):
    items: list[RegistrationResponse]
    pagination: PaginationResponse

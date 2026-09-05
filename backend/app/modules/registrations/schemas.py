from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.db.enums import AcademicPeriodStatus, RegistrationStatus


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
    topic_code: str | None = None
    topic_title: str | None = None
    academic_period_code: str | None = None
    academic_period_name: str | None = None
    academic_period_status: AcademicPeriodStatus | None = None
    student_institutional_code: str | None = None
    student_full_name: str | None = None
    supervisor_institutional_code: str | None = None
    supervisor_full_name: str | None = None

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        data = super().model_validate(obj, *args, **kwargs)
        topic = getattr(obj, "topic", None)
        academic_period = getattr(obj, "academic_period", None) or getattr(topic, "academic_period", None)
        student = getattr(obj, "student", None)
        supervisor = getattr(obj, "supervisor", None)

        if topic is not None:
            data.topic_code = topic.code
            data.topic_title = topic.title
        if academic_period is not None:
            data.academic_period_code = academic_period.code
            data.academic_period_name = academic_period.name
            data.academic_period_status = academic_period.status
        if student is not None:
            data.student_institutional_code = student.institutional_code
            data.student_full_name = student.full_name
        if supervisor is not None:
            data.supervisor_institutional_code = supervisor.institutional_code
            data.supervisor_full_name = supervisor.full_name

        return data


class PaginationResponse(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class RegistrationListResponse(BaseModel):
    items: list[RegistrationResponse]
    pagination: PaginationResponse

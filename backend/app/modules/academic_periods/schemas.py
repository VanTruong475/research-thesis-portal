from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.db.enums import AcademicPeriodStatus


class AcademicPeriodBase(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=150)
    academic_year: str = Field(..., min_length=1, max_length=20)
    semester: int | None = Field(default=None, ge=1, le=3)
    proposal_start_at: datetime
    proposal_end_at: datetime
    registration_start_at: datetime
    registration_end_at: datetime
    execution_start_at: datetime | None = None
    execution_end_at: datetime | None = None
    report_deadline_at: datetime | None = None
    defense_start_at: datetime | None = None
    defense_end_at: datetime | None = None


class AcademicPeriodCreateRequest(AcademicPeriodBase):
    pass


class AcademicPeriodUpdateRequest(AcademicPeriodBase):
    pass


class AcademicPeriodStatusUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: AcademicPeriodStatus


class AcademicPeriodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    academic_year: str
    semester: int | None = None
    proposal_start_at: datetime
    proposal_end_at: datetime
    registration_start_at: datetime
    registration_end_at: datetime
    execution_start_at: datetime | None = None
    execution_end_at: datetime | None = None
    report_deadline_at: datetime | None = None
    defense_start_at: datetime | None = None
    defense_end_at: datetime | None = None
    status: AcademicPeriodStatus
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime


class PaginationResponse(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class AcademicPeriodListResponse(BaseModel):
    items: list[AcademicPeriodResponse]
    pagination: PaginationResponse

import math
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import AppException, NotFoundException
from app.core.security import utc_now
from app.db.enums import AcademicPeriodStatus, TopicStatus, UserRole
from app.modules.academic_periods.model import AcademicPeriod
from app.modules.topics.model import Topic
from app.modules.topics.repository import TopicRepository
from app.modules.topics.schemas import (
    PaginationResponse,
    TopicCreateRequest,
    TopicListResponse,
    TopicRejectRequest,
    TopicResponse,
    TopicStatusUpdateRequest,
    TopicUpdateRequest,
)
from app.modules.users.model import User

_ALLOWED_SORT_FIELDS = {"code", "title", "status", "max_students", "created_at", "updated_at"}
_ALLOWED_SORT_ORDERS = {"asc", "desc"}
_LECTURER_EDITABLE_STATUSES = {TopicStatus.PENDING_APPROVAL}
_APPROVABLE_STATUSES = {TopicStatus.PENDING_APPROVAL, TopicStatus.REJECTED}
_REJECTABLE_STATUSES = {TopicStatus.PENDING_APPROVAL, TopicStatus.APPROVED}
_ADMIN_STATUS_TRANSITIONS: dict[TopicStatus, set[TopicStatus]] = {
    TopicStatus.PENDING_APPROVAL: {TopicStatus.CANCELLED},
    TopicStatus.APPROVED: {TopicStatus.CLOSED, TopicStatus.CANCELLED, TopicStatus.COMPLETED},
    TopicStatus.CLOSED: {TopicStatus.CANCELLED, TopicStatus.COMPLETED},
    TopicStatus.REJECTED: {TopicStatus.CANCELLED},
}


class TopicService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repository = TopicRepository(db)

    async def list_topics(
        self,
        *,
        current_user: User,
        page: int,
        page_size: int,
        status: TopicStatus | None = None,
        academic_period_id: UUID | None = None,
        proposed_by_id: UUID | None = None,
        availability: str | None = None,
        keyword: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> TopicListResponse:
        self._validate_list_arguments(sort_by, sort_order, availability)
        only_approved_visible = current_user.role == UserRole.STUDENT
        visible_to_user_id = current_user.id if current_user.role == UserRole.LECTURER else None
        only_available = availability == "available" or current_user.role == UserRole.STUDENT

        topics, total_items = await self.repository.list_topics(
            page=page,
            page_size=page_size,
            status=status,
            academic_period_id=academic_period_id,
            proposed_by_id=proposed_by_id,
            keyword=keyword,
            sort_by=sort_by,
            sort_order=sort_order,
            visible_to_user_id=visible_to_user_id,
            only_approved_visible=only_approved_visible,
            only_available=only_available,
            now=utc_now(),
        )
        total_pages = math.ceil(total_items / page_size) if total_items else 0

        return TopicListResponse(
            items=[
                self._build_topic_response(topic, current_students)
                for topic, current_students in topics
            ],
            pagination=PaginationResponse(
                page=page,
                page_size=page_size,
                total_items=total_items,
                total_pages=total_pages,
            ),
        )

    async def create_topic(
        self,
        payload: TopicCreateRequest,
        lecturer_id: UUID,
    ) -> TopicResponse:
        period = await self._get_period_or_raise(payload.academic_period_id)
        await self._ensure_active_lecturer(lecturer_id)
        self._ensure_proposal_is_open(period)
        await self._ensure_code_is_available(payload.academic_period_id, payload.code)

        topic = Topic(
            **payload.model_dump(),
            proposed_by_id=lecturer_id,
            status=TopicStatus.PENDING_APPROVAL,
        )
        await self.repository.create(topic)
        await self.db.commit()
        return await self._build_topic_response_with_count(topic)

    async def get_topic(self, topic_id: UUID, current_user: User) -> TopicResponse:
        topic = await self._get_topic_or_raise(topic_id)
        await self._ensure_user_can_view_topic(topic, current_user)
        return await self._build_topic_response_with_count(topic)

    async def update_topic(
        self,
        topic_id: UUID,
        payload: TopicUpdateRequest,
        current_user: User,
    ) -> TopicResponse:
        topic = await self._get_topic_or_raise(topic_id)
        self._ensure_user_can_update_topic(topic, current_user)
        await self._get_period_or_raise(payload.academic_period_id)

        if topic.academic_period_id != payload.academic_period_id or topic.code != payload.code:
            await self._ensure_code_is_available(
                payload.academic_period_id,
                payload.code,
                current_topic_id=topic.id,
            )

        for field, value in payload.model_dump().items():
            setattr(topic, field, value)

        await self.repository.update(topic)
        await self.db.commit()
        return await self._build_topic_response_with_count(topic)

    async def approve_topic(self, topic_id: UUID, admin_id: UUID) -> TopicResponse:
        topic = await self._get_topic_or_raise(topic_id)
        if topic.status not in _APPROVABLE_STATUSES:
            raise AppException(
                status_code=400,
                message="Topic cannot be approved from its current status.",
                code="TOPIC_INVALID_STATUS_TRANSITION",
                details={"current_status": topic.status.value, "new_status": TopicStatus.APPROVED.value},
            )

        topic.status = TopicStatus.APPROVED
        topic.approved_by_id = admin_id
        topic.approved_at = utc_now()
        topic.rejection_reason = None
        topic.closed_at = None
        topic.cancelled_at = None
        await self.repository.update(topic)
        await self.db.commit()
        return await self._build_topic_response_with_count(topic)

    async def reject_topic(
        self,
        topic_id: UUID,
        payload: TopicRejectRequest,
        admin_id: UUID,
    ) -> TopicResponse:
        topic = await self._get_topic_or_raise(topic_id)
        if topic.status not in _REJECTABLE_STATUSES:
            raise AppException(
                status_code=400,
                message="Topic cannot be rejected from its current status.",
                code="TOPIC_INVALID_STATUS_TRANSITION",
                details={"current_status": topic.status.value, "new_status": TopicStatus.REJECTED.value},
            )

        topic.status = TopicStatus.REJECTED
        topic.approved_by_id = admin_id
        topic.rejection_reason = payload.rejection_reason
        topic.approved_at = None
        topic.closed_at = None
        topic.cancelled_at = None
        await self.repository.update(topic)
        await self.db.commit()
        return await self._build_topic_response_with_count(topic)

    async def update_status(
        self,
        topic_id: UUID,
        payload: TopicStatusUpdateRequest,
        admin_id: UUID,
    ) -> TopicResponse:
        topic = await self._get_topic_or_raise(topic_id)
        self._validate_status_transition(topic.status, payload.status)

        now = utc_now()
        topic.status = payload.status
        if payload.status == TopicStatus.CLOSED:
            topic.closed_at = now
        elif payload.status == TopicStatus.CANCELLED:
            topic.cancelled_at = now
        elif payload.status == TopicStatus.COMPLETED:
            topic.closed_at = topic.closed_at or now

        if payload.status in {TopicStatus.CLOSED, TopicStatus.COMPLETED}:
            topic.approved_by_id = topic.approved_by_id or admin_id

        await self.repository.update(topic)
        await self.db.commit()
        return await self._build_topic_response_with_count(topic)

    async def _build_topic_response_with_count(self, topic: Topic) -> TopicResponse:
        current_students = await self.repository.count_accepted_registrations(topic.id)
        return self._build_topic_response(topic, current_students)

    def _build_topic_response(self, topic: Topic, current_students: int) -> TopicResponse:
        response = TopicResponse.model_validate(topic)
        response.current_students = current_students
        return response

    async def _get_topic_or_raise(self, topic_id: UUID) -> Topic:
        topic = await self.repository.get_by_id(topic_id)
        if topic is None:
            raise NotFoundException(
                message="Topic not found.",
                error_code="TOPIC_NOT_FOUND",
            )
        return topic

    async def _get_period_or_raise(self, academic_period_id: UUID) -> AcademicPeriod:
        period = await self.repository.get_academic_period(academic_period_id)
        if period is None:
            raise NotFoundException(
                message="Academic period not found.",
                error_code="ACADEMIC_PERIOD_NOT_FOUND",
            )
        return period

    async def _ensure_active_lecturer(self, lecturer_id: UUID) -> None:
        lecturer = await self.repository.get_active_lecturer(lecturer_id)
        if lecturer is None:
            raise AppException(
                status_code=403,
                message="Only active lecturers may propose topics.",
                code="PERMISSION_DENIED",
            )

    async def _ensure_code_is_available(
        self,
        academic_period_id: UUID,
        code: str,
        current_topic_id: UUID | None = None,
    ) -> None:
        existing = await self.repository.get_by_code_in_period(academic_period_id, code)
        if existing is not None and existing.id != current_topic_id:
            raise AppException(
                status_code=409,
                message="Topic code already exists in this academic period.",
                code="TOPIC_CODE_EXISTS",
                details={"academic_period_id": str(academic_period_id), "code": code},
            )

    def _ensure_proposal_is_open(self, period: AcademicPeriod) -> None:
        now = utc_now()
        if period.status != AcademicPeriodStatus.PROPOSAL_OPEN:
            raise AppException(
                status_code=400,
                message="Topic proposal is not open for this academic period.",
                code="TOPIC_PROPOSAL_PERIOD_CLOSED",
                details={"academic_period_id": str(period.id), "status": period.status.value},
            )
        if not (period.proposal_start_at <= now <= period.proposal_end_at):
            raise AppException(
                status_code=400,
                message="Topic proposal is outside the configured proposal interval.",
                code="TOPIC_PROPOSAL_PERIOD_CLOSED",
                details={"academic_period_id": str(period.id)},
            )

    async def _ensure_user_can_view_topic(self, topic: Topic, current_user: User) -> None:
        if current_user.role == UserRole.ADMIN:
            return
        if current_user.role == UserRole.LECTURER and topic.proposed_by_id == current_user.id:
            return
        if current_user.role == UserRole.STUDENT and await self._is_topic_available_for_students(topic):
            return
        if current_user.role == UserRole.LECTURER and topic.status == TopicStatus.APPROVED:
            return
        raise NotFoundException(
            message="Topic not found.",
            error_code="TOPIC_NOT_FOUND",
        )

    def _ensure_user_can_update_topic(self, topic: Topic, current_user: User) -> None:
        if current_user.role == UserRole.ADMIN:
            return
        if (
            current_user.role == UserRole.LECTURER
            and topic.proposed_by_id == current_user.id
            and topic.status in _LECTURER_EDITABLE_STATUSES
        ):
            return
        raise AppException(
            status_code=403,
            message="You do not have permission to perform this action.",
            code="PERMISSION_DENIED",
        )

    async def _is_topic_available_for_students(self, topic: Topic) -> bool:
        now = utc_now()
        period = topic.academic_period
        accepted_count = await self.repository.count_accepted_registrations(topic.id)
        return (
            topic.status == TopicStatus.APPROVED
            and period.status == AcademicPeriodStatus.REGISTRATION_OPEN
            and period.registration_start_at <= now <= period.registration_end_at
            and accepted_count < topic.max_students
        )

    def _validate_list_arguments(
        self,
        sort_by: str,
        sort_order: str,
        availability: str | None,
    ) -> None:
        if sort_by not in _ALLOWED_SORT_FIELDS:
            raise AppException(
                status_code=422,
                message="Request validation failed.",
                code="VALIDATION_ERROR",
                details={"fields": [{"field": "sort_by", "message": "Unsupported sort field."}]},
            )
        if sort_order not in _ALLOWED_SORT_ORDERS:
            raise AppException(
                status_code=422,
                message="Request validation failed.",
                code="VALIDATION_ERROR",
                details={"fields": [{"field": "sort_order", "message": "Unsupported sort order."}]},
            )
        if availability is not None and availability != "available":
            raise AppException(
                status_code=422,
                message="Request validation failed.",
                code="VALIDATION_ERROR",
                details={"fields": [{"field": "availability", "message": "Unsupported availability filter."}]},
            )

    def _validate_status_transition(
        self,
        current_status: TopicStatus,
        new_status: TopicStatus,
    ) -> None:
        if current_status == new_status:
            return
        if new_status in {TopicStatus.APPROVED, TopicStatus.REJECTED}:
            raise AppException(
                status_code=400,
                message="Use the dedicated approve or reject endpoint for this topic status.",
                code="TOPIC_INVALID_STATUS_TRANSITION",
                details={"current_status": current_status.value, "new_status": new_status.value},
            )
        if new_status in _ADMIN_STATUS_TRANSITIONS.get(current_status, set()):
            return
        raise AppException(
            status_code=400,
            message="Invalid topic status transition.",
            code="TOPIC_INVALID_STATUS_TRANSITION",
            details={"current_status": current_status.value, "new_status": new_status.value},
        )

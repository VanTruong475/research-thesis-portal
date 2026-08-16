from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.responses import create_success_response
from app.db.enums import TopicStatus, UserRole
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.topics.schemas import (
    TopicCreateRequest,
    TopicRejectRequest,
    TopicStatusUpdateRequest,
    TopicUpdateRequest,
)
from app.modules.topics.service import TopicService
from app.modules.users.model import User

router = APIRouter(prefix="/topics", tags=["Topics"])


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="List topics",
)
async def list_topics(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    status_filter: Annotated[TopicStatus | None, Query(alias="status")] = None,
    academic_period_id: UUID | None = None,
    proposed_by_id: UUID | None = None,
    availability: str | None = None,
    keyword: str | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
):
    topics_data = await TopicService(db).list_topics(
        current_user=current_user,
        page=page,
        page_size=page_size,
        status=status_filter,
        academic_period_id=academic_period_id,
        proposed_by_id=proposed_by_id,
        availability=availability,
        keyword=keyword,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return create_success_response(
        data=topics_data.model_dump(mode="json"),
        message="Topics retrieved successfully.",
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Lecturer propose a topic",
)
async def create_topic(
    payload: TopicCreateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_lecturer: Annotated[User, Depends(require_roles(UserRole.LECTURER))],
):
    topic_data = await TopicService(db).create_topic(payload, current_lecturer.id)
    return create_success_response(
        data=topic_data.model_dump(mode="json"),
        message="Topic created successfully.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/{topic_id}",
    status_code=status.HTTP_200_OK,
    summary="Get a topic",
)
async def get_topic(
    topic_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    topic_data = await TopicService(db).get_topic(topic_id, current_user)
    return create_success_response(
        data=topic_data.model_dump(mode="json"),
        message="Topic retrieved successfully.",
    )


@router.put(
    "/{topic_id}",
    status_code=status.HTTP_200_OK,
    summary="Update a topic",
)
async def update_topic(
    topic_id: UUID,
    payload: TopicUpdateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    topic_data = await TopicService(db).update_topic(topic_id, payload, current_user)
    return create_success_response(
        data=topic_data.model_dump(mode="json"),
        message="Topic updated successfully.",
    )


@router.put(
    "/{topic_id}/approve",
    status_code=status.HTTP_200_OK,
    summary="Admin approve a topic",
)
async def approve_topic(
    topic_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
):
    topic_data = await TopicService(db).approve_topic(topic_id, current_admin.id)
    return create_success_response(
        data=topic_data.model_dump(mode="json"),
        message="Topic approved successfully.",
    )


@router.put(
    "/{topic_id}/reject",
    status_code=status.HTTP_200_OK,
    summary="Admin reject a topic",
)
async def reject_topic(
    topic_id: UUID,
    payload: TopicRejectRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
):
    topic_data = await TopicService(db).reject_topic(topic_id, payload, current_admin.id)
    return create_success_response(
        data=topic_data.model_dump(mode="json"),
        message="Topic rejected successfully.",
    )


@router.patch(
    "/{topic_id}/status",
    status_code=status.HTTP_200_OK,
    summary="Admin update topic status",
)
async def update_topic_status(
    topic_id: UUID,
    payload: TopicStatusUpdateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
):
    topic_data = await TopicService(db).update_status(topic_id, payload, current_admin.id)
    return create_success_response(
        data=topic_data.model_dump(mode="json"),
        message="Topic status updated successfully.",
    )

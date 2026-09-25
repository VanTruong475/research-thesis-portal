from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.responses import create_success_response
from app.core.security import utc_now
from app.db.enums import (
    AcademicPeriodStatus,
    FinalResultStatus,
    RegistrationStatus,
    TopicStatus,
    UserRole,
)
from app.db.session import get_db
from app.modules.academic_periods.model import AcademicPeriod
from app.modules.auth.dependencies import get_current_user
from app.modules.councils.model import Council, CouncilMember, DefenseSchedule
from app.modules.evaluation.model import FinalResult
from app.modules.progress.model import ProgressLog
from app.modules.registrations.model import Registration
from app.modules.reports.model import Report
from app.modules.topics.model import Topic
from app.modules.users.model import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats/member-a")
async def get_dashboard_member_a_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    stats = {}

    if current_user.role == UserRole.ADMIN:
        res = await db.execute(select(func.count(User.id)))
        stats["users_count"] = res.scalar_one()

        res = await db.execute(
            select(func.count(User.id)).where(User.role == UserRole.STUDENT)
        )
        stats["students_count"] = res.scalar_one()

        res = await db.execute(
            select(func.count(User.id)).where(User.role == UserRole.LECTURER)
        )
        stats["lecturers_count"] = res.scalar_one()

        res = await db.execute(
            select(func.count(AcademicPeriod.id)).where(
                AcademicPeriod.status.in_(
                    [
                        AcademicPeriodStatus.PROPOSAL_OPEN,
                        AcademicPeriodStatus.REGISTRATION_OPEN,
                        AcademicPeriodStatus.IN_PROGRESS,
                        AcademicPeriodStatus.DEFENSE,
                    ]
                )
            )
        )
        stats["active_periods_count"] = res.scalar_one()

        res = await db.execute(
            select(func.count(Topic.id)).where(
                Topic.status == TopicStatus.PENDING_APPROVAL
            )
        )
        stats["pending_topics_count"] = res.scalar_one()

        res = await db.execute(
            select(func.count(Topic.id)).where(Topic.status == TopicStatus.APPROVED)
        )
        stats["approved_topics_count"] = res.scalar_one()

        res = await db.execute(
            select(func.count(Registration.id)).where(
                Registration.status == RegistrationStatus.PENDING
            )
        )
        stats["pending_registrations_count"] = res.scalar_one()

        res = await db.execute(
            select(func.count(Registration.id)).where(
                Registration.status.in_(
                    [RegistrationStatus.APPROVED, RegistrationStatus.IN_PROGRESS]
                )
            )
        )
        stats["approved_registrations_count"] = res.scalar_one()

    elif current_user.role == UserRole.LECTURER:
        res = await db.execute(
            select(func.count(Topic.id)).where(
                Topic.proposed_by_id == current_user.id
            )
        )
        stats["my_topics_count"] = res.scalar_one()

        res = await db.execute(
            select(func.count(Topic.id)).where(
                Topic.proposed_by_id == current_user.id,
                Topic.status == TopicStatus.PENDING_APPROVAL,
            )
        )
        stats["my_pending_topics_count"] = res.scalar_one()

        res = await db.execute(
            select(func.count(Topic.id)).where(
                Topic.proposed_by_id == current_user.id,
                Topic.status == TopicStatus.APPROVED,
            )
        )
        stats["my_approved_topics_count"] = res.scalar_one()

        res = await db.execute(
            select(func.count(Registration.id))
            .join(Topic, Registration.topic_id == Topic.id)
            .where(
                Topic.proposed_by_id == current_user.id,
                Registration.status == RegistrationStatus.PENDING,
            )
        )
        stats["pending_registrations_count"] = res.scalar_one()

        res = await db.execute(
            select(func.count(Registration.id)).where(
                Registration.supervisor_id == current_user.id,
                Registration.status.in_(
                    [RegistrationStatus.APPROVED, RegistrationStatus.IN_PROGRESS]
                ),
            )
        )
        stats["supervising_registrations_count"] = res.scalar_one()

    elif current_user.role == UserRole.STUDENT:
        res = await db.execute(
            select(func.count(Registration.id)).where(
                Registration.student_id == current_user.id
            )
        )
        stats["my_registrations_count"] = res.scalar_one()

        res = await db.execute(
            select(func.count(Registration.id)).where(
                Registration.student_id == current_user.id,
                Registration.status == RegistrationStatus.PENDING,
            )
        )
        stats["pending_registrations_count"] = res.scalar_one()

        res = await db.execute(
            select(func.count(Registration.id)).where(
                Registration.student_id == current_user.id,
                Registration.status.in_(
                    [RegistrationStatus.APPROVED, RegistrationStatus.IN_PROGRESS]
                ),
            )
        )
        stats["active_registrations_count"] = res.scalar_one()

        accepted_registrations_count = (
            select(func.count(Registration.id))
            .where(
                Registration.topic_id == Topic.id,
                Registration.status.in_(
                    [RegistrationStatus.APPROVED, RegistrationStatus.IN_PROGRESS]
                ),
            )
            .correlate(Topic)
            .scalar_subquery()
        )
        now = utc_now()
        res = await db.execute(
            select(func.count(Topic.id))
            .join(AcademicPeriod, Topic.academic_period_id == AcademicPeriod.id)
            .where(
                Topic.status == TopicStatus.APPROVED,
                AcademicPeriod.status == AcademicPeriodStatus.REGISTRATION_OPEN,
                AcademicPeriod.registration_start_at <= now,
                AcademicPeriod.registration_end_at >= now,
                accepted_registrations_count < Topic.max_students,
            )
        )
        stats["available_topics_count"] = res.scalar_one()

    return create_success_response(data=stats, message="Lấy thống kê Member A thành công")


@router.get("/stats/member-b")
async def get_dashboard_member_b_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    stats = {}
    
    if current_user.role == UserRole.ADMIN:
        # Số hội đồng đã lập
        res = await db.execute(select(func.count(Council.id)))
        stats["councils_count"] = res.scalar_one()
        
        # Số lịch bảo vệ
        res = await db.execute(select(func.count(DefenseSchedule.id)))
        stats["schedules_count"] = res.scalar_one()
        
        # Số kết quả đã tính
        res = await db.execute(
            select(func.count(FinalResult.id)).where(
                FinalResult.status.in_(
                    [FinalResultStatus.CALCULATED, FinalResultStatus.PUBLISHED]
                )
            )
        )
        stats["calculated_results"] = res.scalar_one()

        # Số kết quả đã công bố
        res = await db.execute(
            select(func.count(FinalResult.id)).where(
                FinalResult.status == FinalResultStatus.PUBLISHED
            )
        )
        stats["published_results"] = res.scalar_one()
        
    elif current_user.role == UserRole.LECTURER:
        # Số tiến độ chưa nhận xét (do sinh viên hướng dẫn gửi)
        # Giả định tiến độ cần nhận xét là progress chưa có comment
        res = await db.execute(
            select(func.count(ProgressLog.id)).where(ProgressLog.comments.is_(None))
        )
        stats["pending_progress"] = res.scalar_one()
        
        # Số báo cáo nộp
        res = await db.execute(select(func.count(Report.id)))
        stats["new_reports"] = res.scalar_one()
        
        # Số hội đồng được phân công
        res = await db.execute(
            select(func.count(CouncilMember.id)).where(
                CouncilMember.lecturer_id == current_user.id
            )
        )
        stats["assigned_councils"] = res.scalar_one()
        
        stats["upcoming_schedules"] = 0
        
    elif current_user.role == UserRole.STUDENT:
        # Số báo cáo đã nộp
        res = await db.execute(
            select(func.count(Report.id)).where(Report.created_by_id == current_user.id)
        )
        stats["submitted_reports"] = res.scalar_one()
        
        stats["next_deadline"] = "Chưa có"
        stats["defense_schedule"] = "Chưa có"
        stats["final_result"] = "Chưa công bố"

    return create_success_response(data=stats, message="Lấy thống kê thành công")

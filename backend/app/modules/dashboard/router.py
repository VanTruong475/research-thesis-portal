from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.deps import get_db, get_current_user
from app.common.responses import create_success_response
from app.db.enums import UserRole, FinalResultStatus
from app.modules.users.model import User
from app.modules.councils.model import Council, DefenseSchedule, CouncilMember
from app.modules.evaluation.model import FinalResult
from app.modules.progress.model import ProgressLog
from app.modules.reports.model import Report

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats/member-b")
async def get_dashboard_member_b_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
        res = await db.execute(select(func.count(FinalResult.id)).where(FinalResult.status.in_([FinalResultStatus.CALCULATED, FinalResultStatus.PUBLISHED])))
        stats["calculated_results"] = res.scalar_one()
        
        # Số kết quả đã công bố
        res = await db.execute(select(func.count(FinalResult.id)).where(FinalResult.status == FinalResultStatus.PUBLISHED))
        stats["published_results"] = res.scalar_one()
        
    elif current_user.role == UserRole.LECTURER:
        # Số tiến độ chưa nhận xét (do sinh viên hướng dẫn gửi)
        # Giả định tiến độ cần nhận xét là progress chưa có comment
        res = await db.execute(select(func.count(ProgressLog.id)).where(ProgressLog.comments == None))
        stats["pending_progress"] = res.scalar_one()
        
        # Số báo cáo nộp
        res = await db.execute(select(func.count(Report.id)))
        stats["new_reports"] = res.scalar_one()
        
        # Số hội đồng được phân công
        res = await db.execute(select(func.count(CouncilMember.id)).where(CouncilMember.lecturer_id == current_user.id))
        stats["assigned_councils"] = res.scalar_one()
        
        stats["upcoming_schedules"] = 0
        
    elif current_user.role == UserRole.STUDENT:
        # Số báo cáo đã nộp
        res = await db.execute(select(func.count(Report.id)).where(Report.created_by_id == current_user.id))
        stats["submitted_reports"] = res.scalar_one()
        
        stats["next_deadline"] = "Chưa có"
        stats["defense_schedule"] = "Chưa có"
        stats["final_result"] = "Chưa công bố"

    return create_success_response(data=stats, message="Lấy thống kê thành công")

from datetime import datetime, timezone
from uuid import UUID
from typing import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.progress.model import ProgressLog
from app.modules.registrations.model import Registration
from app.modules.progress.schemas import CreateProgressLogRequest, AddTeacherCommentRequest
from app.common.exceptions import ResourceNotFoundException, BusinessRuleException

class ProgressService:
    @staticmethod
    async def create_progress_log(
        db: AsyncSession,
        student_id: UUID,
        payload: CreateProgressLogRequest
    ) -> ProgressLog:
        """
        Xử lý nghiệp vụ cho Sinh viên nộp báo cáo tiến độ mới (FR-13).
        """
        # 1. Truy vấn kiểm tra đơn đăng ký đề tài có tồn tại không
        stmt = select(Registration).where(Registration.id == payload.registration_id)
        result = await db.execute(stmt)
        registration = result.scalar_one_or_none()

        # Kiểm tra nếu đơn đăng ký không tồn tại
        if not registration:
            raise ResourceNotFoundException("Đơn đăng ký đề tài không tồn tại.")

        # 2. Kiểm tra xem đơn đăng ký này có đúng là của sinh viên đang nộp không
        if registration.student_id != student_id:
            raise BusinessRuleException("Bạn không có quyền nộp báo cáo tiến độ cho đơn đăng ký này.")

        # 3. Tạo đối tượng ProgressLog mới để lưu vào CSDL
        new_log = ProgressLog(
            registration_id=payload.registration_id,
            student_id=student_id,
            milestone_id=payload.milestone_id,
            content=payload.content,
            submitted_at=datetime.now(timezone.utc)
        )

        # Ghi vào session và commit lưu CSDL
        db.add(new_log)
        await db.commit()
        await db.refresh(new_log)

        return new_log

    @staticmethod
    async def add_teacher_comment(
        db: AsyncSession,
        log_id: UUID,
        payload: AddTeacherCommentRequest
    ) -> ProgressLog:
        """
        Xử lý nghiệp vụ cho Giảng viên hướng dẫn ghi nhận xét vào báo cáo tiến độ (FR-14).
        """
        # 1. Truy vấn tìm nhật ký tiến độ theo log_id
        stmt = select(ProgressLog).where(ProgressLog.id == log_id)
        result = await db.execute(stmt)
        progress_log = result.scalar_one_or_none()

        # Kiểm tra nếu nhật ký tiến độ không tồn tại
        if not progress_log:
            raise ResourceNotFoundException("Bản ghi tiến độ không tồn tại.")

        # 2. Cập nhật nhận xét và mốc thời gian nhận xét của GVHD
        progress_log.teacher_comment = payload.teacher_comment
        progress_log.commented_at = datetime.now(timezone.utc)

        # Commit cập nhật CSDL
        await db.commit()
        await db.refresh(progress_log)

        return progress_log

    @staticmethod
    async def get_progress_logs_by_registration(
        db: AsyncSession,
        registration_id: UUID
    ) -> Sequence[ProgressLog]:
        """
        Lấy danh sách tất cả nhật ký tiến độ của một đơn đăng ký đề tài.
        """
        # Truy vấn sắp xếp nhật ký tiến độ theo thứ tự thời gian nộp mới nhất lên đầu
        stmt = (
            select(ProgressLog)
            .where(ProgressLog.registration_id == registration_id)
            .order_by(ProgressLog.submitted_at.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

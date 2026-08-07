from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.modules.registrations.model import Registration
from app.modules.users.model import User
from app.db.enums import UserRole, RegistrationStatus
from app.common.exceptions import ResourceNotFoundException, BusinessRuleException


class RegistrationService:
    @staticmethod
    async def assign_supervisor(
        db: AsyncSession,
        registration_id: UUID,
        supervisor_id: UUID,
        admin_id: UUID
    ) -> Registration:
        """
        FR-11: Nghiệp vụ Phân công Giảng viên hướng dẫn (GVHD) thủ công bởi Admin
        """
        # 1. Truy vấn lấy thông tin đơn đăng ký (Registration) theo ID
        stmt = select(Registration).where(Registration.id == registration_id)
        result = await db.execute(stmt)
        registration = result.scalar_one_or_none()

        # Kiểm tra nếu đăng ký không tồn tại
        if not registration:
            raise ResourceNotFoundException("Đơn đăng ký đề tài không tồn tại.")

        # 2. Kiểm tra thông tin Giảng viên được phân công
        stmt_user = select(User).where(User.id == supervisor_id)
        res_user = await db.execute(stmt_user)
        supervisor = res_user.scalar_one_or_none()

        # Kiểm tra nếu giảng viên không tồn tại hoặc không có vai trò LECTURER
        if not supervisor or supervisor.role != UserRole.LECTURER:
            raise BusinessRuleException("Người dùng được chọn không tồn tại hoặc không phải là Giảng viên.")

        # Kiểm tra nếu tài khoản giảng viên đang bị khóa/không hoạt động
        if not supervisor.is_active:
            raise BusinessRuleException("Giảng viên được chọn hiện không hoạt động.")

        # 3. Tiến hành cập nhật thông tin phân công GVHD
        registration.supervisor_id = supervisor_id
        registration.supervisor_assigned_by_id = admin_id
        registration.supervisor_assigned_at = datetime.now(timezone.utc)

        # Lưu thay đổi vào CSDL
        await db.commit()
        await db.refresh(registration)

        return registration


class LecturerService:
    @staticmethod
    async def get_lecturer_workload(
        db: AsyncSession,
        lecturer_id: UUID
    ) -> dict:
        """
        FR-12: Nghiệp vụ Lấy thông tin khối lượng/tải hướng dẫn của Giảng viên
        """
        # 1. Kiểm tra tồn tại và vai trò của Giảng viên
        stmt_user = select(User).where(User.id == lecturer_id)
        res_user = await db.execute(stmt_user)
        lecturer = res_user.scalar_one_or_none()

        if not lecturer or lecturer.role != UserRole.LECTURER:
            raise ResourceNotFoundException("Giảng viên không tồn tại.")

        # 2. Đếm số lượng đề tài/đơn đăng ký mà Giảng viên này đang hướng dẫn (Status = APPROVED hoặc IN_PROGRESS)
        stmt_count = (
            select(func.count(Registration.id))
            .where(
                Registration.supervisor_id == lecturer_id,
                Registration.status.in_([RegistrationStatus.APPROVED, RegistrationStatus.IN_PROGRESS])
            )
        )
        res_count = await db.execute(stmt_count)
        assigned_count = res_count.scalar() or 0

        # Trả về dictionary kết quả để chuyển đổi qua Pydantic DTO
        return {
            "lecturer_id": lecturer.id,
            "lecturer_name": lecturer.full_name,
            "email": lecturer.email,
            "max_quota": 5, # Hạn ngạch mặc định 5 SV/GV (có thể cấu hình linh hoạt)
            "current_assigned_count": assigned_count
        }

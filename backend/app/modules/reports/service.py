import os
from asyncio import to_thread
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import AppException, NotFoundException
from app.modules.reports.model import Report
from app.modules.topics.model import Topic

# Cấu hình dung lượng file tối đa cho phép: 20MB (tính bằng Bytes)
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

# ĐỊnh nghĩa thư mục lưu trữ file nộp báo cáo trên server
UPLOAD_DIR = os.path.join("uploads", "reports")


class ReportService:
    @staticmethod
    async def upload_report(
        db: AsyncSession,
        topic_id: UUID,
        student_id: UUID,
        file: UploadFile,
    ) -> Report:
        """
        Xử lý nghiệp vụ Nộp file báo cáo / sản phẩm (FR-16, FR-17, FR-18).
        """
        # 1. Kiểm tra tồn tại của đề tài
        stmt_topic = select(Topic).where(Topic.id == topic_id)
        res_topic = await db.execute(stmt_topic)
        topic = res_topic.scalar_one_or_none()

        if not topic:
            raise NotFoundException("Đề tài không tồn tại.")

        # 2. Đọc và Validate kích thước file (FR-16: Tối đa 20MB)
        file_content = await file.read()
        file_size = len(file_content)

        if file_size > MAX_FILE_SIZE_BYTES:
            raise AppException("Kích thước file vượt quá giới hạn tối đa cho phép (20MB).")

        if file_size == 0:
            raise AppException("File nộp vào không được rỗng.")

        # 3. Tính toán số phiên bản tiếp theo cho đề tài này (FR-17)
        stmt_max_version = select(func.coalesce(func.max(Report.version), 0)).where(
            Report.topic_id == topic_id,
        )
        res_version = await db.execute(stmt_max_version)
        current_max_version = res_version.scalar() or 0
        next_version = current_max_version + 1

        # 4. Tạo đường dẫn và lưu file vật lý vào ổ đĩa server
        await to_thread(os.makedirs, UPLOAD_DIR, exist_ok=True)
        file_extension = os.path.splitext(file.filename or "")[1]
        unique_file_name = f"{uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_file_name)

        # Ghi nội dung file lên ổ đĩa
        await to_thread(_write_file, file_path, file_content)

        # 5. Lưu thông tin bản ghi báo cáo vào CSDL
        new_report = Report(
            topic_id=topic_id,
            student_id=student_id,
            file_name=file.filename or "report.pdf",
            file_path=file_path,
            file_size=file_size,
            version=next_version,
            submitted_at=datetime.now(timezone.utc),
        )

        db.add(new_report)
        await db.commit()
        await db.refresh(new_report)

        return new_report

    @staticmethod
    async def get_reports_by_topic(
        db: AsyncSession,
        topic_id: UUID,
    ) -> list[Report]:
        """
        Lấy lịch sử tất cả các phiên bản báo cáo đã nộp của một đề tài.
        """
        stmt = select(Report).where(Report.topic_id == topic_id).order_by(Report.version.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())


def _write_file(file_path: str, file_content: bytes) -> None:
    with open(file_path, "wb") as file_object:
        file_object.write(file_content)

import os
from asyncio import to_thread
from collections.abc import Sequence
from uuid import UUID, uuid4

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import AppException, NotFoundException
from app.core.security import utc_now
from app.db.enums import AcademicPeriodStatus, RegistrationStatus, UserRole, ReportType
from app.modules.registrations.model import Registration
from app.modules.reports.model import Report
from app.modules.reports.repository import ReportRepository
from app.modules.users.model import User

# Cấu hình dung lượng file tối đa cho phép: 20MB (tính bằng Bytes)
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

# Danh sách các định dạng mở rộng (extension) được phép tải lên hệ thống
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".zip"}

# Định nghĩa thư mục lưu trữ file nộp báo cáo trên server
UPLOAD_DIR = os.path.join("uploads", "reports")


class ReportService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repository = ReportRepository(db)

    async def upload_report(
        self,
        *,
        registration_id: UUID,
        current_student: User,
        file: UploadFile,
        report_type: ReportType = ReportType.PROGRESS_REPORT,
    ) -> Report:
        """
        Xử lý nghiệp vụ Nộp file báo cáo / sản phẩm (FR-16, FR-17, FR-18).
        Kiểm tra trạng thái đăng ký, kiểm tra quyền sinh viên, validate dung lượng và đuôi file.
        """
        registration = await self._get_registration_or_raise(registration_id)
        self._ensure_student_can_upload(registration, current_student)

        # 1. Kiểm tra phần mở rộng (đuôi file) có nằm trong danh sách cho phép không
        self._validate_file_extension(file.filename)

        # 2. Đọc nội dung file và kiểm tra dung lượng
        file_content = await file.read()
        file_size = len(file_content)
        self._validate_file_size(file_size)

        # 3. Tự động tính số phiên bản tiếp theo (Version = Version cũ nhất + 1)
        next_version = await self.repository.get_max_version_for_registration(registration_id) + 1
        file_path = await self._store_file(file, file_content)

        new_report = Report(
            registration_id=registration_id,
            topic_id=registration.topic_id,
            student_id=current_student.id,
            file_name=file.filename or "report.pdf",
            file_path=file_path,
            file_size=file_size,
            version=next_version,
            report_type=report_type,
            submitted_at=utc_now(),
        )

        try:
            await self.repository.create(new_report)
            await self.db.commit()
            await self.db.refresh(new_report)
        except Exception:
            await self.db.rollback()
            # Nếu lưu DB thất bại thì xóa file vật lý để tránh rác ổ cứng
            await to_thread(_remove_file_if_exists, file_path)
            raise

        return await self.repository.get_report_by_id(new_report.id) or new_report

    async def get_reports_by_registration(
        self,
        *,
        registration_id: UUID,
        current_user: User,
    ) -> Sequence[Report]:
        """
        Lấy lịch sử tất cả các phiên bản báo cáo đã nộp của một đơn đăng ký.
        """
        registration = await self._get_registration_or_raise(registration_id)
        self._ensure_user_can_read(registration, current_user)
        return await self.repository.list_by_registration(registration_id)

    async def get_report_file_for_download(
        self,
        *,
        report_id: UUID,
        current_user: User,
    ) -> tuple[str, str]:
        """
        Lấy đường dẫn file và tên file gốc để phục vụ endpoint download an toàn.
        Đảm bảo chỉ Admin, GVHD phụ trách hoặc Sinh viên nộp đề tài mới được tải file.
        """
        # 1. Tìm bản ghi báo cáo trong cơ sở dữ liệu
        report = await self.repository.get_report_by_id(report_id)
        if report is None:
            raise NotFoundException(
                message="Bản ghi báo cáo không tồn tại.",
                error_code="REPORT_NOT_FOUND",
            )

        # 2. Kiểm tra quyền truy cập thông qua đơn đăng ký liên kết
        registration = await self._get_registration_or_raise(report.registration_id)
        self._ensure_user_can_read(registration, current_user)

        # 3. Kiểm tra file vật lý trên đĩa cứng của server
        if not os.path.exists(report.file_path):
            raise NotFoundException(
                message="File báo cáo không tồn tại trên hệ thống lưu trữ.",
                error_code="REPORT_FILE_NOT_FOUND",
            )

        return report.file_path, report.file_name

    async def _get_registration_or_raise(self, registration_id: UUID) -> Registration:
        registration = await self.repository.get_registration_by_id(registration_id)
        if registration is None:
            raise NotFoundException(
                message="Registration not found.",
                error_code="REGISTRATION_NOT_FOUND",
            )
        return registration

    def _ensure_student_can_upload(self, registration: Registration, current_student: User) -> None:
        if current_student.role != UserRole.STUDENT or registration.student_id != current_student.id:
            raise self._permission_denied()
        if registration.status != RegistrationStatus.APPROVED:
            raise AppException(
                status_code=400,
                message="Report can be submitted only for an approved registration.",
                code="REPORT_REGISTRATION_NOT_APPROVED",
                details={"current_status": registration.status.value},
            )
        if registration.academic_period.status != AcademicPeriodStatus.IN_PROGRESS:
            raise AppException(
                status_code=400,
                message="Report can be submitted only while the academic period is in progress.",
                code="REPORT_PERIOD_NOT_IN_PROGRESS",
                details={"academic_period_status": registration.academic_period.status.value},
            )

    def _ensure_user_can_read(self, registration: Registration, current_user: User) -> None:
        if current_user.role == UserRole.ADMIN:
            return
        if current_user.role == UserRole.STUDENT and registration.student_id == current_user.id:
            return
        if current_user.role == UserRole.LECTURER and registration.supervisor_id == current_user.id:
            return
        raise self._permission_denied()

    def _validate_file_extension(self, filename: str | None) -> None:
        """
        Kiểm tra phần mở rộng file (đuôi file) có hợp lệ không.
        Chỉ cho phép các đuôi file: .pdf, .doc, .docx, .zip
        """
        if not filename:
            raise AppException(
                status_code=400,
                message="Tên file không hợp lệ.",
                code="REPORT_FILE_INVALID_NAME",
            )

        file_extension = os.path.splitext(filename.lower())[1]
        if file_extension not in ALLOWED_EXTENSIONS:
            raise AppException(
                status_code=400,
                message=(
                    f"Định dạng file '{file_extension}' không được hỗ trợ. "
                    f"Vui lòng chỉ tải lên các định dạng: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
                ),
                code="REPORT_FILE_EXTENSION_NOT_ALLOWED",
                details={"allowed_extensions": list(ALLOWED_EXTENSIONS), "provided_extension": file_extension},
            )

    def _validate_file_size(self, file_size: int) -> None:
        if file_size > MAX_FILE_SIZE_BYTES:
            raise AppException(
                status_code=400,
                message="Report file exceeds the maximum allowed size (20MB).",
                code="REPORT_FILE_TOO_LARGE",
                details={"max_size_bytes": MAX_FILE_SIZE_BYTES},
            )

        if file_size == 0:
            raise AppException(
                status_code=400,
                message="Report file must not be empty.",
                code="REPORT_FILE_EMPTY",
            )

    async def _store_file(self, file: UploadFile, file_content: bytes) -> str:
        await to_thread(os.makedirs, UPLOAD_DIR, exist_ok=True)
        file_extension = os.path.splitext(file.filename or "")[1]
        unique_file_name = f"{uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_file_name)
        await to_thread(_write_file, file_path, file_content)
        return file_path

    def _permission_denied(self) -> AppException:
        return AppException(
            status_code=403,
            message="You do not have permission to perform this action.",
            code="PERMISSION_DENIED",
        )


def _write_file(file_path: str, file_content: bytes) -> None:
    with open(file_path, "wb") as file_object:
        file_object.write(file_content)


def _remove_file_if_exists(file_path: str) -> None:
    if os.path.exists(file_path):
        os.remove(file_path)

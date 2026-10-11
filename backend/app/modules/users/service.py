import csv
import math
from io import StringIO
from typing import ClassVar
from uuid import UUID

from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import AppException, NotFoundException
from app.core.security import hash_password
from app.db.enums import UserRole, UserStatus
from app.modules.users.model import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import (
    PaginationResponse,
    UserCreateRequest,
    UserImportResponse,
    UserImportRowError,
    UserListResponse,
    UserPasswordUpdateRequest,
    UserProfileUpdateRequest,
    UserResponse,
    UserStatusUpdateRequest,
)


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repository = UserRepository(db)

    async def get_current_profile(self, current_user: User) -> UserResponse:
        return UserResponse.model_validate(current_user)

    async def update_current_profile(
        self,
        current_user: User,
        payload: UserProfileUpdateRequest,
    ) -> UserResponse:
        update_data = payload.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(current_user, field, value)

        await self.repository.update_user(current_user)
        await self.db.commit()
        return UserResponse.model_validate(current_user)

    async def change_password(
        self,
        current_user: User,
        payload: UserPasswordUpdateRequest,
    ) -> UserResponse:
        from app.core.security import hash_password, verify_password

        if not verify_password(payload.current_password, current_user.password_hash):
            raise AppException(
                status_code=400,
                message="Mật khẩu hiện tại không chính xác.",
                code="INVALID_PASSWORD",
            )

        current_user.password_hash = hash_password(payload.new_password)
        await self.repository.update_user(current_user)
        await self.db.commit()
        return UserResponse.model_validate(current_user)

    async def list_users(self, *, page: int, page_size: int) -> UserListResponse:
        users, total_items = await self.repository.list_users(
            page=page,
            page_size=page_size,
        )
        total_pages = math.ceil(total_items / page_size) if total_items else 0

        return UserListResponse(
            items=[UserResponse.model_validate(user) for user in users],
            pagination=PaginationResponse(
                page=page,
                page_size=page_size,
                total_items=total_items,
                total_pages=total_pages,
            ),
        )

    async def create_user(self, payload: UserCreateRequest) -> UserResponse:
        existing_user = await self.repository.get_by_email_or_code(
            email=str(payload.email),
            institutional_code=payload.institutional_code,
        )

        if existing_user:
            raise AppException(
                status_code=409,
                message="Institutional code or email already exists.",
                code="USER_ALREADY_EXISTS",
            )

        new_user = User(
            institutional_code=payload.institutional_code,
            email=str(payload.email).lower(),
            password_hash=hash_password(payload.password),
            full_name=payload.full_name,
            role=payload.role,
            status=UserStatus.ACTIVE,
            class_name=payload.class_name if payload.role == UserRole.STUDENT else None,
            department=(
                payload.department
                if payload.role in (UserRole.LECTURER, UserRole.ADMIN)
                else None
            ),
        )

        await self.repository.create_user(new_user)
        await self.db.commit()
        return UserResponse.model_validate(new_user)

    async def import_users_csv(
        self,
        *,
        file_content: bytes,
        filename: str | None,
    ) -> UserImportResponse:
        if filename and not filename.lower().endswith(".csv"):
            raise AppException(
                status_code=400,
                message="Uploaded file must be a CSV file.",
                code="USER_IMPORT_INVALID_FILE",
            )

        try:
            csv_text = file_content.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise AppException(
                status_code=400,
                message="CSV file must use UTF-8 encoding.",
                code="USER_IMPORT_INVALID_FILE",
            ) from exc

        reader = csv.DictReader(StringIO(csv_text))
        if reader.fieldnames:
            reader.fieldnames = [field.strip().lower() for field in reader.fieldnames]

        required_headers = {
            "institutional_code",
            "email",
            "password",
            "full_name",
            "role",
            "status",
        }
        allowed_headers = required_headers | {"phone", "class_name", "department"}
        headers = set(reader.fieldnames or [])

        if not headers:
            raise AppException(
                status_code=400,
                message="CSV file is empty or missing a header row.",
                code="USER_IMPORT_INVALID_FILE",
            )

        missing_headers = sorted(required_headers - headers)
        unsupported_headers = sorted(headers - allowed_headers)
        if missing_headers or unsupported_headers:
            raise AppException(
                status_code=400,
                message="CSV header is invalid.",
                code="USER_IMPORT_INVALID_FILE",
                details={
                    "missing_headers": missing_headers,
                    "unsupported_headers": unsupported_headers,
                },
            )

        rows = list(reader)
        if not rows:
            raise AppException(
                status_code=400,
                message="CSV file has no data rows.",
                code="USER_IMPORT_INVALID_FILE",
            )

        errors: list[UserImportRowError] = []
        payloads: list[tuple[UserCreateRequest, UserStatus, str | None]] = []
        seen_emails: dict[str, int] = {}
        seen_codes: dict[str, int] = {}

        for index, raw_row in enumerate(rows, start=2):
            row = self._normalize_import_row(raw_row)
            self._validate_required_import_fields(row, index, errors)

            role_value = row.get("role", "")
            status_value = row.get("status", "")
            if role_value == UserRole.ADMIN.value:
                errors.append(
                    UserImportRowError(
                        row_number=index,
                        field="role",
                        message="CSV import chỉ hỗ trợ student hoặc lecturer.",
                    )
                )
            elif role_value and role_value not in {
                UserRole.STUDENT.value,
                UserRole.LECTURER.value,
            }:
                errors.append(
                    UserImportRowError(
                        row_number=index,
                        field="role",
                        message="Vai trò không hợp lệ.",
                    )
                )

            user_status: UserStatus | None = None
            if status_value:
                try:
                    user_status = UserStatus(status_value)
                except ValueError:
                    errors.append(
                        UserImportRowError(
                            row_number=index,
                            field="status",
                            message="Trạng thái không hợp lệ.",
                        )
                    )

            phone = row.get("phone")
            if phone and len(phone) > 20:
                errors.append(
                    UserImportRowError(
                        row_number=index,
                        field="phone",
                        message="Số điện thoại không được vượt quá 20 ký tự.",
                    )
                )

            email = row.get("email", "")
            institutional_code = row.get("institutional_code", "")
            if email:
                previous_row = seen_emails.get(email)
                if previous_row:
                    errors.append(
                        UserImportRowError(
                            row_number=index,
                            field="email",
                            message=f"Email trùng với dòng {previous_row} trong file CSV.",
                        )
                    )
                else:
                    seen_emails[email] = index

            if institutional_code:
                normalized_code = institutional_code.lower()
                previous_row = seen_codes.get(normalized_code)
                if previous_row:
                    errors.append(
                        UserImportRowError(
                            row_number=index,
                            field="institutional_code",
                            message=(
                                "Mã định danh trùng với dòng "
                                f"{previous_row} trong file CSV."
                            ),
                        )
                    )
                else:
                    seen_codes[normalized_code] = index

            try:
                payload = UserCreateRequest(
                    institutional_code=row.get("institutional_code", ""),
                    email=row.get("email", ""),
                    password=row.get("password", ""),
                    full_name=row.get("full_name", ""),
                    role=role_value,
                    class_name=row.get("class_name"),
                    department=row.get("department"),
                )
            except ValidationError as exc:
                errors.extend(self._pydantic_errors_to_import_errors(index, exc))
                continue

            if user_status is not None:
                payloads.append((payload, user_status, row.get("phone")))

        existing_users = await self.repository.list_by_emails_or_codes(
            emails=set(seen_emails.keys()),
            institutional_codes=set(seen_codes.keys()),
        )
        for user in existing_users:
            email_row = seen_emails.get(user.email.lower())
            if email_row:
                errors.append(
                    UserImportRowError(
                        row_number=email_row,
                        field="email",
                        message="Email đã tồn tại trong hệ thống.",
                    )
                )

            code_row = seen_codes.get(user.institutional_code.lower())
            if code_row:
                errors.append(
                    UserImportRowError(
                        row_number=code_row,
                        field="institutional_code",
                        message="Mã định danh đã tồn tại trong hệ thống.",
                    )
                )

        if errors:
            raise AppException(
                status_code=422,
                message="CSV contains invalid user rows.",
                code="USER_IMPORT_VALIDATION_ERROR",
                details={"errors": [error.model_dump() for error in errors]},
            )

        users = [
            User(
                institutional_code=payload.institutional_code,
                email=str(payload.email).lower(),
                password_hash=hash_password(payload.password),
                full_name=payload.full_name,
                phone=phone,
                role=payload.role,
                status=user_status,
                class_name=payload.class_name if payload.role == UserRole.STUDENT else None,
                department=payload.department if payload.role == UserRole.LECTURER else None,
            )
            for payload, user_status, phone in payloads
        ]

        await self.repository.create_users(users)
        await self.db.commit()
        return UserImportResponse(created_count=len(users), skipped_count=0, errors=[])

    async def update_status(
        self,
        user_id: UUID,
        payload: UserStatusUpdateRequest,
    ) -> UserResponse:
        user = await self.repository.get_by_id(user_id)
        if user is None:
            raise NotFoundException(
                message="User not found.",
                error_code="USER_NOT_FOUND",
            )

        user.status = payload.status
        await self.repository.update_user(user)
        await self.db.commit()
        return UserResponse.model_validate(user)

    private_fields: ClassVar[frozenset[str]] = frozenset(
        {
            "institutional_code",
            "email",
            "password",
            "full_name",
            "role",
            "status",
            "phone",
            "class_name",
            "department",
        }
    )

    def _normalize_import_row(
        self,
        raw_row: dict[str, str | None],
    ) -> dict[str, str | None]:
        row: dict[str, str | None] = {}
        for field in self.private_fields:
            value = raw_row.get(field)
            if value is None:
                row[field] = None
                continue

            normalized_value = value.strip()
            if field in {"email", "role", "status"}:
                normalized_value = normalized_value.lower()
            row[field] = normalized_value or None
        return row

    def _validate_required_import_fields(
        self,
        row: dict[str, str | None],
        row_number: int,
        errors: list[UserImportRowError],
    ) -> None:
        required_fields = [
            "institutional_code",
            "email",
            "password",
            "full_name",
            "role",
            "status",
        ]
        for field in required_fields:
            if not row.get(field):
                errors.append(
                    UserImportRowError(
                        row_number=row_number,
                        field=field,
                        message="Trường này là bắt buộc.",
                    )
                )

    def _pydantic_errors_to_import_errors(
        self,
        row_number: int,
        exc: ValidationError,
    ) -> list[UserImportRowError]:
        row_errors: list[UserImportRowError] = []
        for error in exc.errors():
            location = error.get("loc", [])
            field = ".".join(str(part) for part in location) if location else "row"
            row_errors.append(
                UserImportRowError(
                    row_number=row_number,
                    field=field,
                    message=str(error.get("msg", "Dữ liệu không hợp lệ.")),
                )
            )
        return row_errors

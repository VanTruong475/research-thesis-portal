import pytest

from app.common.exceptions import AppException, generic_exception_handler
from app.core.config import settings
from app.db.enums import UserRole, UserStatus
from app.modules.auth.service import require_role
from app.modules.users.model import User


def test_require_role_allows_matching_role():
    user = User(
        institutional_code="GV001",
        email="lecturer@example.edu.vn",
        password_hash="hash",
        full_name="Nguyen Van B",
        role=UserRole.LECTURER,
        status=UserStatus.ACTIVE,
    )

    require_role(user, (UserRole.LECTURER, UserRole.ADMIN))


def test_require_role_rejects_wrong_role():
    user = User(
        institutional_code="SV001",
        email="student@example.edu.vn",
        password_hash="hash",
        full_name="Nguyen Van A",
        role=UserRole.STUDENT,
        status=UserStatus.ACTIVE,
    )

    with pytest.raises(AppException) as exc_info:
        require_role(user, (UserRole.ADMIN,))

    assert exc_info.value.status_code == 403
    assert exc_info.value.code == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_generic_exception_handler_does_not_hide_programming_errors_in_test():
    original_error = RuntimeError("programming error")
    previous_app_env = settings.app_env
    settings.app_env = "test"

    try:
        with pytest.raises(RuntimeError, match="programming error"):
            await generic_exception_handler(None, original_error)  # type: ignore[arg-type]
    finally:
        settings.app_env = previous_app_env

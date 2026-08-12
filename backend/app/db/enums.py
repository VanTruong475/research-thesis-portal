from enum import StrEnum


def enum_values(enum_cls: type[StrEnum]) -> list[str]:
    return [item.value for item in enum_cls]


class UserRole(StrEnum):
    STUDENT = "student"
    LECTURER = "lecturer"
    ADMIN = "admin"


class UserStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    LOCKED = "locked"


class AcademicPeriodStatus(StrEnum):
    DRAFT = "draft"
    PROPOSAL_OPEN = "proposal_open"
    REGISTRATION_OPEN = "registration_open"
    IN_PROGRESS = "in_progress"
    DEFENSE = "defense"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TopicStatus(StrEnum):
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    CLOSED = "closed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class RegistrationStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


# Enums dành riêng cho Module Hội đồng đánh giá & Lịch bảo vệ (Councils Module)
class CouncilStatus(StrEnum):
    DRAFT = "draft"                # Bản nháp hội đồng
    SCHEDULED = "scheduled"        # Đã lên lịch
    IN_PROGRESS = "in_progress"    # Đang tiến hành chấm bảo vệ
    COMPLETED = "completed"        # Đã hoàn thành
    CANCELLED = "cancelled"        # Đã hủy hội đồng


class CouncilMemberRole(StrEnum):
    CHAIRPERSON = "chairperson"    # Chủ tịch hội đồng
    SECRETARY = "secretary"        # Thư ký hội đồng
    REVIEWER = "reviewer"          # Giảng viên phản biện
    MEMBER = "member"              # Ủy viên hội đồng


class CouncilMemberStatus(StrEnum):
    ACTIVE = "active"              # Đang tham gia hội đồng
    INACTIVE = "inactive"          # Tạm ngưng
    REMOVED = "removed"            # Đã rút khỏi hội đồng


class DefenseScheduleStatus(StrEnum):
    SCHEDULED = "scheduled"        # Đã xếp lịch bảo vệ
    IN_PROGRESS = "in_progress"    # Đang diễn ra
    COMPLETED = "completed"        # Đã bảo vệ xong
    CANCELLED = "cancelled"        # Hủy lịch
    POSTPONED = "postponed"        # Hoãn lịch

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

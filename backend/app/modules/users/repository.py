from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.model import User


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_identifier(self, identifier: str) -> User | None:
        normalized_identifier = identifier.strip().lower()
        stmt: Select[tuple[User]] = select(User).where(
            or_(
                func.lower(User.email) == normalized_identifier,
                func.lower(User.institutional_code) == normalized_identifier,
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email_or_code(
        self,
        email: str,
        institutional_code: str,
    ) -> User | None:
        normalized_email = email.strip().lower()
        normalized_code = institutional_code.strip().lower()
        stmt = select(User).where(
            or_(
                func.lower(User.email) == normalized_email,
                func.lower(User.institutional_code) == normalized_code,
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_users(self, *, page: int, page_size: int) -> tuple[list[User], int]:
        total_items = await self.db.scalar(select(func.count(User.id)))
        stmt = (
            select(User)
            .order_by(User.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), int(total_items or 0)

    async def create_user(self, user: User) -> User:
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update_user(self, user: User) -> User:
        await self.db.flush()
        await self.db.refresh(user)
        return user

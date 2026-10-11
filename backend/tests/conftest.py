import re
from collections.abc import AsyncGenerator, Generator
from pathlib import Path

import pytest
import pytest_asyncio
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from alembic import command
from app.core.config import settings
from app.db.session import get_db
from app.main import app


@pytest.fixture(scope="session")
def configure_test_database() -> Generator[None, None, None]:
    test_url = make_url(settings.test_database_url)
    default_url = make_url(settings.database_url)

    assert test_url.database != "thesis_db"
    assert test_url.database != default_url.database

    previous_database_url = settings.database_url
    previous_app_env = settings.app_env
    settings.database_url = settings.test_database_url
    settings.app_env = "test"

    _ensure_database_exists(settings.test_database_url)
    alembic_cfg = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    alembic_cfg.set_main_option(
        "script_location", str(Path(__file__).resolve().parents[1] / "alembic")
    )
    command.upgrade(alembic_cfg, "head")

    yield

    settings.database_url = previous_database_url
    settings.app_env = previous_app_env


def _ensure_database_exists(database_url: str) -> None:
    url = make_url(database_url)
    database_name = url.database
    if database_name is None or not re.fullmatch(r"[A-Za-z0-9_]+", database_name):
        raise RuntimeError("TEST_DATABASE_URL must include a safe database name.")

    maintenance_url = url.set(database="postgres")
    engine = create_async_engine(
        maintenance_url.render_as_string(hide_password=False),
        isolation_level="AUTOCOMMIT",
    )

    async def create_database_if_missing() -> None:
        async with engine.connect() as connection:
            exists = await connection.scalar(
                text("SELECT 1 FROM pg_database WHERE datname = :database_name"),
                {"database_name": database_name},
            )
            if exists is None:
                await connection.execute(text(f'CREATE DATABASE "{database_name}"'))
        await engine.dispose()

    import asyncio

    asyncio.run(create_database_if_missing())


@pytest_asyncio.fixture
async def test_session(
    configure_test_database: None,
) -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(settings.test_database_url, future=True)
    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_factory() as session:
        yield session
        await session.rollback()
        await session.execute(text("TRUNCATE refresh_tokens, users RESTART IDENTITY CASCADE"))
        await session.commit()

    await engine.dispose()


@pytest_asyncio.fixture
async def client(test_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield test_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app, raise_app_exceptions=False),
        base_url="http://test",
    ) as async_client:
        yield async_client
    app.dependency_overrides.clear()

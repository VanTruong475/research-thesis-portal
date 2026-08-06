from fastapi import FastAPI

from app.api.v1.router import router as v1_router
from app.common.exceptions import install_exception_handlers
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs",
    openapi_url="/openapi.json",
)

install_exception_handlers(app)
app.include_router(v1_router, prefix="/api/v1")

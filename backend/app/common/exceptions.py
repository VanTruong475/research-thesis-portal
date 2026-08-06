from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.config import settings


class AppException(Exception):
    def __init__(
        self,
        status_code: int,
        message: str,
        code: str,
        details: Any = None,
    ) -> None:
        self.status_code = status_code
        self.message = message
        self.code = code
        self.details = details


def error_response(
    status_code: int,
    message: str,
    code: str,
    details: Any = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "error": {
                "code": code,
                "details": details,
            },
        },
    )


def _validation_details(exc: RequestValidationError) -> dict[str, list[dict[str, str]]]:
    fields = []
    for error in exc.errors():
        location = [str(part) for part in error.get("loc", []) if part != "body"]
        fields.append(
            {
                "field": ".".join(location),
                "message": str(error.get("msg", "Invalid value.")),
            }
        )
    return {"fields": fields}


async def app_exception_handler(
    request: Request, exc: AppException
) -> JSONResponse:
    return error_response(
        status_code=exc.status_code,
        message=exc.message,
        code=exc.code,
        details=exc.details,
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        message="Request validation failed.",
        code="VALIDATION_ERROR",
        details=_validation_details(exc),
    )


async def http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, dict) else {}
    message = detail.get("message", "Request failed.")
    code = detail.get("code", "REQUEST_ERROR")
    details = detail.get("details")
    return error_response(
        status_code=exc.status_code,
        message=message,
        code=code,
        details=details,
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    if settings.app_env == "test":
        raise exc

    return error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        message="An unexpected error occurred.",
        code="INTERNAL_SERVER_ERROR",
        details=None,
    )


def install_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

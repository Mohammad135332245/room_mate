import logging
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)


class AppError(Exception):
    

    status_code: int = status.HTTP_400_BAD_REQUEST
    default_message: str = "Something went wrong"

    def __init__(self, message: str | None = None):
        self.message = message or self.default_message
        super().__init__(self.message)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    default_message = "Resource not found"


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    default_message = "Resource already exists"


class ValidationError(AppError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_message = "Invalid input"


class AuthenticationError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_message = "Invalid credentials"


class InvalidTokenError(AuthenticationError):
    default_message = "Could not validate credentials"


class PermissionDeniedError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    default_message = "You do not have permission to perform this action"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        headers = (
            {"WWW-Authenticate": "Bearer"}
            if isinstance(exc, AuthenticationError)
            else None
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
            headers=headers,
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_error(
        _: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = [
            {
                "field": ".".join(str(part) for part in err["loc"][1:]) or "body",
                "message": err["msg"],
            }
            for err in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": "Validation failed", "errors": errors},
        )

    @app.exception_handler(IntegrityError)
    async def _integrity_error(_: Request, exc: IntegrityError) -> JSONResponse:
        logger.warning("Database integrity error: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": "That operation conflicts with existing data"},
        )

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error", exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )

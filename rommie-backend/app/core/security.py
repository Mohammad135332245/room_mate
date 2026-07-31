from datetime import UTC, datetime, timedelta
from typing import Any, Literal
from uuid import UUID
import bcrypt
import jwt

from app.core.config import settings
from app.core.exceptions import InvalidTokenError

TokenType = Literal["access", "refresh"]

MAX_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def _create_token(subject: str | UUID, token_type: TokenType, expires: timedelta) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires).timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(subject: str | UUID) -> str:
    return _create_token(
        subject, "access", timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )


def create_refresh_token(subject: str | UUID) -> str:
    return _create_token(
        subject, "refresh", timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )


def decode_token(token: str, expected_type: TokenType | None = None) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except jwt.ExpiredSignatureError as exc:
        raise InvalidTokenError("Token has expired") from exc
    except jwt.PyJWTError as exc:
        raise InvalidTokenError("Could not validate credentials") from exc

    if expected_type and payload.get("type") != expected_type:
        raise InvalidTokenError(f"Expected a {expected_type} token")
    if not payload.get("sub"):
        raise InvalidTokenError("Token is missing a subject")
    return payload


def subject_from_token(token: str, expected_type: TokenType = "access") -> UUID:
    payload = decode_token(token, expected_type)
    try:
        return UUID(payload["sub"])
    except (ValueError, TypeError) as exc:
        raise InvalidTokenError("Token subject is not a valid user id") from exc

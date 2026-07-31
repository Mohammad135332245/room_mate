"""Shared FastAPI dependencies."""

from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import InvalidTokenError, PermissionDeniedError
from app.core.security import subject_from_token
from app.models.user import User, UserRole
from app.repositories.user_repo import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[AsyncSession, Depends(get_db)]
Credentials = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]


async def get_current_user(db: DbSession, credentials: Credentials) -> User:
    if credentials is None:
        raise InvalidTokenError("Not authenticated")

    user_id = subject_from_token(credentials.credentials, "access")
    user = await UserRepository(db).get(user_id)
    if user is None:
        raise InvalidTokenError("User no longer exists")
    return user


async def get_optional_user(db: DbSession, credentials: Credentials) -> User | None:
    """Like get_current_user but returns None instead of raising.

    Used by endpoints that are public yet richer when you're signed in.
    """
    if credentials is None:
        return None
    try:
        return await get_current_user(db, credentials)
    except InvalidTokenError:
        return None


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]


async def require_landlord(user: CurrentUser) -> User:
    if user.role is not UserRole.LANDLORD:
        raise PermissionDeniedError("This action is for property owners only")
    return user


async def require_student(user: CurrentUser) -> User:
    if user.role is not UserRole.STUDENT:
        raise PermissionDeniedError("This action is for students only")
    return user


LandlordUser = Annotated[User, Depends(require_landlord)]
StudentUser = Annotated[User, Depends(require_student)]


async def get_ws_user(websocket_token: str, db: AsyncSession) -> User:
    """Resolve a user from a token passed on the WebSocket query string."""
    user_id = subject_from_token(websocket_token, "access")
    user = await UserRepository(db).get(user_id)
    if user is None:
        raise InvalidTokenError("User no longer exists")
    return user


def client_ip(request: Request) -> str:  # pragma: no cover - trivial
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

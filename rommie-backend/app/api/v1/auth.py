from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.common import Message
from app.schemas.user import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    TokenPair,
    UserCreate,
    UserRead,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: DbSession) -> AuthResponse:
    """Create a student or landlord account and return a token pair."""
    return await AuthService(db).register(payload)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: DbSession) -> AuthResponse:
    return await AuthService(db).login(payload.email, payload.password)


@router.post("/refresh-token", response_model=TokenPair)
async def refresh_token(payload: RefreshRequest, db: DbSession) -> TokenPair:
    return await AuthService(db).refresh(payload.refresh_token)


@router.get("/me", response_model=UserRead)
async def read_me(user: CurrentUser) -> UserRead:
    return UserRead.model_validate(user)


@router.post("/logout", response_model=Message)
async def logout(user: CurrentUser) -> Message:
    """Stateless logout.

    Tokens are short-lived and not stored server-side, so the client simply
    drops them. The endpoint exists so the frontend has one call to make.
    """
    return Message(detail="Signed out")

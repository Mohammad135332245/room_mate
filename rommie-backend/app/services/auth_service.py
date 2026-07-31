"""Registration, login and token refresh."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError, ConflictError, NotFoundError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    subject_from_token,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import AuthResponse, TokenPair, UserCreate, UserRead


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.users = UserRepository(session)

    def _tokens(self, user: User) -> TokenPair:
        return TokenPair(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
        )

    async def register(self, payload: UserCreate) -> AuthResponse:
        if await self.users.email_exists(payload.email):
            raise ConflictError("An account with that email already exists")

        user = User(
            email=payload.email.lower(),
            password_hash=hash_password(payload.password),
            name=payload.name.strip(),
            role=payload.role,
            phone=payload.phone,
            city=payload.city,
        )
        await self.users.add(user)

        tokens = self._tokens(user)
        return AuthResponse(
            **tokens.model_dump(), user=UserRead.model_validate(user)
        )

    async def login(self, email: str, password: str) -> AuthResponse:
        user = await self.users.get_by_email(email)
        # Same message either way so we don't leak which emails are registered.
        if not user or not verify_password(password, user.password_hash):
            raise AuthenticationError("Incorrect email or password")

        tokens = self._tokens(user)
        return AuthResponse(
            **tokens.model_dump(), user=UserRead.model_validate(user)
        )

    async def refresh(self, refresh_token: str) -> TokenPair:
        user_id: UUID = subject_from_token(refresh_token, "refresh")
        user = await self.users.get(user_id)
        if not user:
            raise NotFoundError("User no longer exists")
        return self._tokens(user)

import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserRole
from app.schemas.common import PHONE_PATTERN, normalize_phone


def validate_moroccan_phone(value: str | None) -> str | None:
    """Normalize to +212XXXXXXXXX, rejecting anything that isn't Moroccan."""
    if value in (None, ""):
        return None
    normalized = normalize_phone(value)
    if not re.match(PHONE_PATTERN, normalized or ""):
        raise ValueError("Phone must be a Moroccan number, e.g. +212612345678")
    return normalized


class UserBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = None
    city: str | None = Field(default=None, max_length=80)

    @field_validator("phone")
    @classmethod
    def _phone_validator(cls, value: str | None) -> str | None:
        return validate_moroccan_phone(value)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72)
    role: UserRole = UserRole.STUDENT

    @field_validator("password")
    @classmethod
    def _strong_password(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password is too long (max 72 bytes)")
        if not any(c.isalpha() for c in value) or not any(c.isdigit() for c in value):
            raise ValueError("Password must contain both letters and numbers")
        return value


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    bio: str | None = Field(default=None, max_length=2000)
    avatar_url: str | None = Field(default=None, max_length=500)
    phone: str | None = None
    city: str | None = Field(default=None, max_length=80)

    @field_validator("phone")
    @classmethod
    def _phone_validator(cls, value: str | None) -> str | None:
        return validate_moroccan_phone(value)


class UserPublic(BaseModel):
    """Profile fields safe to expose to anyone."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    role: UserRole
    bio: str | None = None
    avatar_url: str | None = None
    city: str | None = None
    created_at: datetime


class UserRead(UserPublic):
    """Full profile, only ever returned to the user themselves."""

    email: EmailStr
    phone: str | None = None
    updated_at: datetime


class UserProfile(UserPublic):
    """Public profile enriched with aggregate stats."""

    listings_count: int = 0
    rating: float | None = None
    reviews_count: int = 0


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(TokenPair):
    user: UserRead

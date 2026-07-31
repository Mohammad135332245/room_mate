from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.application import ApplicationStatus
from app.schemas.user import UserPublic


class ListingSummary(BaseModel):
    """Trimmed listing view embedded in application payloads."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    price: int
    city: str
    campus_proximity: str | None = None
    photos: list[str] = Field(default_factory=list)
    owner_id: UUID
    owner: UserPublic


class ApplicationCreate(BaseModel):
    listing_id: UUID
    message: str | None = Field(default=None, max_length=1500)


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    applicant_id: UUID
    listing_id: UUID
    status: ApplicationStatus
    message: str | None
    created_at: datetime
    updated_at: datetime
    applicant: UserPublic
    listing: ListingSummary


class ApplicationSummary(ApplicationRead):
    """Application plus chat metadata, used by the messages inbox."""

    unread_count: int = 0
    last_message: str | None = None
    last_message_at: datetime | None = None

from datetime import UTC, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.meeting import MeetingStatus, MeetingType
from app.schemas.application import ApplicationRead


def _ensure_future(value: datetime) -> datetime:
    """Reject past datetimes; assume UTC when the client sends a naive one."""
    moment = value if value.tzinfo else value.replace(tzinfo=UTC)
    if moment <= datetime.now(UTC):
        raise ValueError("Meeting must be scheduled in the future")
    return moment


class MeetingCreate(BaseModel):
    application_id: UUID
    meeting_type: MeetingType = MeetingType.IN_PERSON
    scheduled_at: datetime
    location_link: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("scheduled_at")
    @classmethod
    def _future(cls, value: datetime) -> datetime:
        return _ensure_future(value)

    @model_validator(mode="after")
    def _virtual_needs_link(self) -> "MeetingCreate":
        if self.meeting_type is MeetingType.VIRTUAL and not self.location_link:
            raise ValueError("Virtual meetings need a meeting link")
        if self.meeting_type is MeetingType.IN_PERSON and not self.location_link:
            raise ValueError("In-person meetings need an address")
        return self


class MeetingUpdate(BaseModel):
    scheduled_at: datetime | None = None
    location_link: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=500)
    status: MeetingStatus | None = None

    @field_validator("scheduled_at")
    @classmethod
    def _future(cls, value: datetime | None) -> datetime | None:
        return _ensure_future(value) if value else value


class MeetingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    application_id: UUID
    meeting_type: MeetingType
    status: MeetingStatus
    scheduled_at: datetime
    location_link: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class MeetingDetail(MeetingRead):
    application: ApplicationRead

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import (
    GUID,
    Base,
    TimestampMixin,
    UTCDateTime,
    UUIDPrimaryKeyMixin,
)

if TYPE_CHECKING:
    from app.models.application import Application


class MeetingType(str, enum.Enum):
    VIRTUAL = "VIRTUAL"
    IN_PERSON = "IN_PERSON"


class MeetingStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class Meeting(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "meetings"

    application_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("applications.id", ondelete="CASCADE"), index=True
    )
    meeting_type: Mapped[MeetingType] = mapped_column(
        SAEnum(MeetingType, name="meeting_type"), default=MeetingType.IN_PERSON
    )
    status: Mapped[MeetingStatus] = mapped_column(
        SAEnum(MeetingStatus, name="meeting_status"),
        default=MeetingStatus.SCHEDULED,
        index=True,
    )
    scheduled_at: Mapped[datetime] = mapped_column(UTCDateTime(), index=True)
    location_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    application: Mapped["Application"] = relationship(
        back_populates="meetings", lazy="joined"
    )

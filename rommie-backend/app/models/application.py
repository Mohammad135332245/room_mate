import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import GUID, Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.listing import Listing
    from app.models.meeting import Meeting
    from app.models.message import Message
    from app.models.user import User


class ApplicationStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    MEETING_SCHEDULED = "MEETING_SCHEDULED"
    COMPLETED = "COMPLETED"

STATUS_TRANSITIONS: dict[ApplicationStatus, set[ApplicationStatus]] = {
    ApplicationStatus.PENDING: {
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.DECLINED,
    },
    ApplicationStatus.ACCEPTED: {
        ApplicationStatus.MEETING_SCHEDULED,
        ApplicationStatus.DECLINED,
        ApplicationStatus.COMPLETED,
    },
    ApplicationStatus.MEETING_SCHEDULED: {
        ApplicationStatus.COMPLETED,
        ApplicationStatus.DECLINED,
    },
    ApplicationStatus.DECLINED: set(),
    ApplicationStatus.COMPLETED: set(),
}


class Application(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("applicant_id", "listing_id", name="uq_application_once"),
    )

    applicant_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    listing_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("listings.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        SAEnum(ApplicationStatus, name="application_status"),
        default=ApplicationStatus.PENDING,
        index=True,
    )
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    applicant: Mapped["User"] = relationship(
        back_populates="applications", lazy="joined"
    )
    listing: Mapped["Listing"] = relationship(
        back_populates="applications", lazy="joined"
    )
    meetings: Mapped[list["Meeting"]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )
    messages: Mapped[list["Message"]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )

    def involves(self, user_id: uuid.UUID) -> bool:
        return user_id in {self.applicant_id, self.listing.owner_id}

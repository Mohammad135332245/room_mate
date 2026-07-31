import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import GUID, Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.user import User


class Message(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "messages"

    application_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("applications.id", ondelete="CASCADE"), index=True
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    text: Mapped[str] = mapped_column(Text)
    read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    application: Mapped["Application"] = relationship(back_populates="messages")
    sender: Mapped["User"] = relationship(lazy="joined")

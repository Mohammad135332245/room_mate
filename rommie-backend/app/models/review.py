import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import GUID, Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class Review(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating"),
        UniqueConstraint("reviewer_id", "reviewed_user_id", name="uq_review_once"),
    )

    reviewer_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    reviewed_user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    reviewer: Mapped["User"] = relationship(
        foreign_keys=[reviewer_id], lazy="joined"
    )
    reviewed_user: Mapped["User"] = relationship(
        back_populates="reviews_received", foreign_keys=[reviewed_user_id]
    )

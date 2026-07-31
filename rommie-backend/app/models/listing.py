import uuid
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.models.base import GUID, Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.user import User


class Listing(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "listings"

    owner_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(160), index=True)
    description: Mapped[str] = mapped_column(Text)
    price: Mapped[int] = mapped_column(Integer, index=True)  # whole DH per month
    city: Mapped[str] = mapped_column(String(80), index=True)
    campus_proximity: Mapped[str | None] = mapped_column(
        String(160), nullable=True, index=True
    )
    rooms: Mapped[int] = mapped_column(Integer, default=1)
    bathrooms: Mapped[int] = mapped_column(Integer, default=1)
    furnished: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    amenities: Mapped[list[str]] = mapped_column(JSON, default=list)
    photos: Mapped[list[str]] = mapped_column(JSON, default=list)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    views: Mapped[int] = mapped_column(Integer, default=0)

    owner: Mapped["User"] = relationship(back_populates="listings", lazy="joined")
    applications: Mapped[list["Application"]] = relationship(
        back_populates="listing", cascade="all, delete-orphan"
    )
    saved_by: Mapped[list["SavedListing"]] = relationship(
        back_populates="listing", cascade="all, delete-orphan"
    )


class SavedListing(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    
    __tablename__ = "saved_listings"
    __table_args__ = (
        UniqueConstraint("user_id", "listing_id", name="uq_saved_user_listing"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    listing_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("listings.id", ondelete="CASCADE"), index=True
    )

    user: Mapped["User"] = relationship(back_populates="saved_listings")
    listing: Mapped["Listing"] = relationship(back_populates="saved_by", lazy="joined")

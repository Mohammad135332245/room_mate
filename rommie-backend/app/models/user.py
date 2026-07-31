import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.listing import Listing, SavedListing
    from app.models.review import Review


class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    LANDLORD = "LANDLORD"


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role"), default=UserRole.STUDENT, index=True
    )
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    city: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)

    listings: Mapped[list["Listing"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan", lazy="selectin"
    )
    applications: Mapped[list["Application"]] = relationship(
        back_populates="applicant", cascade="all, delete-orphan"
    )
    saved_listings: Mapped[list["SavedListing"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    reviews_received: Mapped[list["Review"]] = relationship(
        back_populates="reviewed_user",
        foreign_keys="Review.reviewed_user_id",
        cascade="all, delete-orphan",
    )

    @property
    def is_landlord(self) -> bool:
        return self.role is UserRole.LANDLORD

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<User {self.email} ({self.role.value})>"

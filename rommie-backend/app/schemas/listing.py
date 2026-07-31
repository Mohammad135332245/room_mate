from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.common import MOROCCAN_CITIES
from app.schemas.user import UserPublic


def validate_city(value: str | None) -> str | None:
    """Title-case the city and check it against the supported list."""
    if value in (None, ""):
        return None
    normalized = value.strip().title()
    if normalized not in MOROCCAN_CITIES:
        raise ValueError(f"City must be one of: {', '.join(MOROCCAN_CITIES)}")
    return normalized


class ListingBase(BaseModel):
    title: str = Field(min_length=6, max_length=160)
    description: str = Field(min_length=20, max_length=5000)
    price: int = Field(gt=0, le=200_000, description="Whole dirhams per month")
    city: str = Field(max_length=80)
    campus_proximity: str | None = Field(default=None, max_length=160)
    rooms: int = Field(default=1, ge=1, le=20)
    bathrooms: int = Field(default=1, ge=1, le=10)
    furnished: bool = False
    amenities: list[str] = Field(default_factory=list)
    photos: list[str] = Field(default_factory=list, max_length=12)
    address: str | None = Field(default=None, max_length=255)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @field_validator("city")
    @classmethod
    def _city_validator(cls, value: str | None) -> str | None:
        return validate_city(value)

    @field_validator("amenities")
    @classmethod
    def _clean_amenities(cls, value: list[str]) -> list[str]:
        # Preserve order, drop blanks and duplicates.
        seen: list[str] = []
        for item in value:
            cleaned = item.strip()
            if cleaned and cleaned not in seen:
                seen.append(cleaned)
        return seen


class ListingCreate(ListingBase):
    pass


class ListingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=6, max_length=160)
    description: str | None = Field(default=None, min_length=20, max_length=5000)
    price: int | None = Field(default=None, gt=0, le=200_000)
    city: str | None = None
    campus_proximity: str | None = None
    rooms: int | None = Field(default=None, ge=1, le=20)
    bathrooms: int | None = Field(default=None, ge=1, le=10)
    furnished: bool | None = None
    amenities: list[str] | None = None
    photos: list[str] | None = None
    address: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    is_active: bool | None = None

    @field_validator("city")
    @classmethod
    def _city_validator(cls, value: str | None) -> str | None:
        return validate_city(value)


class ListingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    title: str
    description: str
    price: int
    city: str
    campus_proximity: str | None
    rooms: int
    bathrooms: int
    furnished: bool
    amenities: list[str]
    photos: list[str]
    address: str | None
    latitude: float | None
    longitude: float | None
    is_active: bool
    views: int
    created_at: datetime
    updated_at: datetime
    owner: UserPublic


class ListingDetail(ListingRead):
    applications_count: int = 0
    is_saved: bool = False
    has_applied: bool = False


class ListingFilters(BaseModel):
    """Query parameters accepted by GET /listings."""

    city: str | None = None
    campus: str | None = None
    price_min: int | None = Field(default=None, ge=0)
    price_max: int | None = Field(default=None, ge=0)
    rooms: int | None = Field(default=None, ge=1)
    furnished: bool | None = None
    amenities: list[str] | None = None
    search: str | None = None
    sort: str = Field(default="newest", pattern="^(newest|price_asc|price_desc)$")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=50)

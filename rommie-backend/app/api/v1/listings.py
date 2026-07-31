from uuid import UUID

from fastapi import APIRouter, File, Query, UploadFile, status

from app.api.deps import CurrentUser, DbSession, LandlordUser, OptionalUser
from app.integrations.storage import upload_images
from app.schemas.application import ApplicationRead
from app.schemas.common import AMENITIES, CAMPUSES, MOROCCAN_CITIES, Message, Page
from app.schemas.listing import (
    ListingCreate,
    ListingDetail,
    ListingFilters,
    ListingRead,
    ListingUpdate,
)
from app.services.application_service import ApplicationService
from app.services.listing_service import ListingService

router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("", response_model=Page[ListingRead])
async def browse_listings(
    db: DbSession,
    city: str | None = None,
    campus: str | None = None,
    price_min: int | None = Query(default=None, ge=0),
    price_max: int | None = Query(default=None, ge=0),
    rooms: int | None = Query(default=None, ge=1),
    furnished: bool | None = None,
    amenities: list[str] | None = Query(default=None),
    search: str | None = None,
    sort: str = Query(default="newest", pattern="^(newest|price_asc|price_desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
) -> Page[ListingRead]:
    """Public listing search with filters, sorting and pagination."""
    filters = ListingFilters(
        city=city,
        campus=campus,
        price_min=price_min,
        price_max=price_max,
        rooms=rooms,
        furnished=furnished,
        amenities=amenities,
        search=search,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    return await ListingService(db).search(filters)


@router.get("/meta")
async def listing_meta() -> dict:
    """Cities, campuses and amenities the frontend uses to build filters."""
    return {"cities": MOROCCAN_CITIES, "campuses": CAMPUSES, "amenities": AMENITIES}


@router.get("/featured", response_model=list[ListingRead])
async def featured_listings(
    db: DbSession, limit: int = Query(default=4, ge=1, le=12)
) -> list[ListingRead]:
    return await ListingService(db).featured(limit)


@router.get("/mine", response_model=list[ListingRead])
async def my_listings(owner: LandlordUser, db: DbSession) -> list[ListingRead]:
    return await ListingService(db).list_mine(owner)


@router.get("/saved", response_model=list[ListingRead])
async def saved_listings(user: CurrentUser, db: DbSession) -> list[ListingRead]:
    return await ListingService(db).list_saved(user)


@router.post("", response_model=ListingRead, status_code=status.HTTP_201_CREATED)
async def create_listing(
    payload: ListingCreate, owner: LandlordUser, db: DbSession
) -> ListingRead:
    return await ListingService(db).create(owner, payload)


@router.get("/{listing_id}", response_model=ListingDetail)
async def get_listing(
    listing_id: UUID, db: DbSession, viewer: OptionalUser
) -> ListingDetail:
    return await ListingService(db).detail(listing_id, viewer)


@router.get("/{listing_id}/related", response_model=list[ListingRead])
async def related_listings(
    listing_id: UUID, db: DbSession, limit: int = Query(default=3, ge=1, le=8)
) -> list[ListingRead]:
    return await ListingService(db).related(listing_id, limit)


@router.put("/{listing_id}", response_model=ListingRead)
async def update_listing(
    listing_id: UUID, payload: ListingUpdate, user: CurrentUser, db: DbSession
) -> ListingRead:
    return await ListingService(db).update(listing_id, user, payload)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(listing_id: UUID, user: CurrentUser, db: DbSession) -> None:
    await ListingService(db).delete(listing_id, user)


@router.post("/{listing_id}/photos", response_model=ListingRead)
async def add_photos(
    listing_id: UUID,
    user: CurrentUser,
    db: DbSession,
    files: list[UploadFile] = File(...),
) -> ListingRead:
    urls = await upload_images(files, folder="listings")
    return await ListingService(db).add_photos(listing_id, user, urls)


@router.get("/{listing_id}/applications", response_model=list[ApplicationRead])
async def listing_applications(
    listing_id: UUID, user: CurrentUser, db: DbSession
) -> list[ApplicationRead]:
    """Owner view: everyone who applied to this listing."""
    return await ApplicationService(db).list_for_listing(listing_id, user)


@router.post("/{listing_id}/save", response_model=Message, status_code=status.HTTP_201_CREATED)
async def save_listing(listing_id: UUID, user: CurrentUser, db: DbSession) -> Message:
    await ListingService(db).save(user, listing_id)
    return Message(detail="Listing saved")


@router.delete("/{listing_id}/save", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_listing(listing_id: UUID, user: CurrentUser, db: DbSession) -> None:
    await ListingService(db).unsave(user, listing_id)

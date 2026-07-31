"""Listing search, CRUD and bookmarks."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, PermissionDeniedError
from app.models.listing import Listing, SavedListing
from app.models.user import User, UserRole
from app.repositories.application_repo import ApplicationRepository
from app.repositories.listing_repo import ListingRepository, SavedListingRepository
from app.schemas.common import Page
from app.schemas.listing import (
    ListingCreate,
    ListingDetail,
    ListingFilters,
    ListingRead,
    ListingUpdate,
)


class ListingService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.listings = ListingRepository(session)
        self.saved = SavedListingRepository(session)
        self.applications = ApplicationRepository(session)

    # --- reads ---------------------------------------------------------

    async def search(self, filters: ListingFilters) -> Page[ListingRead]:
        items, total = await self.listings.search(filters)
        return Page[ListingRead](
            items=[ListingRead.model_validate(item) for item in items],
            total=total,
            page=filters.page,
            page_size=filters.page_size,
        )

    async def featured(self, limit: int = 4) -> list[ListingRead]:
        listings = await self.listings.featured(limit)
        return [ListingRead.model_validate(listing) for listing in listings]

    async def get_or_404(self, listing_id: UUID) -> Listing:
        listing = await self.listings.get(listing_id)
        if not listing:
            raise NotFoundError("Listing not found")
        return listing

    async def detail(
        self, listing_id: UUID, viewer: User | None = None
    ) -> ListingDetail:
        listing = await self.get_or_404(listing_id)
        await self.listings.increment_views(listing)

        detail = ListingDetail.model_validate(listing)
        detail.applications_count = await self.listings.applications_count(listing.id)
        if viewer is not None:
            detail.is_saved = (
                await self.saved.get_one(viewer.id, listing.id)
            ) is not None
            detail.has_applied = (
                await self.applications.get_for_applicant_and_listing(
                    viewer.id, listing.id
                )
            ) is not None
        return detail

    async def related(self, listing_id: UUID, limit: int = 3) -> list[ListingRead]:
        listing = await self.get_or_404(listing_id)
        related = await self.listings.related(listing, limit)
        return [ListingRead.model_validate(item) for item in related]

    async def list_mine(self, owner: User) -> list[ListingRead]:
        listings = await self.listings.list_by_owner(owner.id)
        return [ListingRead.model_validate(listing) for listing in listings]

    # --- writes --------------------------------------------------------

    def _assert_owner(self, listing: Listing, user: User) -> None:
        if listing.owner_id != user.id:
            raise PermissionDeniedError("You can only manage your own listings")

    async def create(self, owner: User, payload: ListingCreate) -> ListingRead:
        if owner.role is not UserRole.LANDLORD:
            raise PermissionDeniedError("Only property owners can post listings")

        listing = Listing(owner_id=owner.id, **payload.model_dump())
        await self.listings.add(listing)
        stored = await self.get_or_404(listing.id)
        return ListingRead.model_validate(stored)

    async def update(
        self, listing_id: UUID, user: User, payload: ListingUpdate
    ) -> ListingRead:
        listing = await self.get_or_404(listing_id)
        self._assert_owner(listing, user)

        data = payload.model_dump(exclude_unset=True)
        if data:
            await self.listings.update(listing, data)
        return ListingRead.model_validate(listing)

    async def delete(self, listing_id: UUID, user: User) -> None:
        listing = await self.get_or_404(listing_id)
        self._assert_owner(listing, user)
        await self.listings.remove(listing)

    async def add_photos(
        self, listing_id: UUID, user: User, urls: list[str]
    ) -> ListingRead:
        listing = await self.get_or_404(listing_id)
        self._assert_owner(listing, user)
        photos = [*(listing.photos or []), *urls][:12]
        await self.listings.update(listing, {"photos": photos})
        return ListingRead.model_validate(listing)

    # --- bookmarks -----------------------------------------------------

    async def save(self, user: User, listing_id: UUID) -> None:
        await self.get_or_404(listing_id)
        if await self.saved.get_one(user.id, listing_id):
            raise ConflictError("Listing is already saved")
        await self.saved.add(SavedListing(user_id=user.id, listing_id=listing_id))

    async def unsave(self, user: User, listing_id: UUID) -> None:
        entry = await self.saved.get_one(user.id, listing_id)
        if not entry:
            raise NotFoundError("Listing is not in your saved list")
        await self.saved.remove(entry)

    async def list_saved(self, user: User) -> list[ListingRead]:
        entries = await self.saved.list_for_user(user.id)
        return [ListingRead.model_validate(entry.listing) for entry in entries]

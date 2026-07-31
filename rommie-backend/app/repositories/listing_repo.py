from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import joinedload

from app.models.application import Application
from app.models.listing import Listing, SavedListing
from app.repositories.base_repo import BaseRepository
from app.schemas.listing import ListingFilters


class ListingRepository(BaseRepository[Listing]):
    model = Listing

    def _apply_filters(self, stmt: Select, filters: ListingFilters) -> Select:
        stmt = stmt.where(Listing.is_active.is_(True))
        if filters.city:
            stmt = stmt.where(Listing.city == filters.city.strip().title())
        if filters.campus:
            stmt = stmt.where(Listing.campus_proximity.ilike(f"%{filters.campus}%"))
        if filters.price_min is not None:
            stmt = stmt.where(Listing.price >= filters.price_min)
        if filters.price_max is not None:
            stmt = stmt.where(Listing.price <= filters.price_max)
        if filters.rooms is not None:
            stmt = stmt.where(Listing.rooms >= filters.rooms)
        if filters.furnished is not None:
            stmt = stmt.where(Listing.furnished.is_(filters.furnished))
        if filters.search:
            needle = f"%{filters.search.strip()}%"
            stmt = stmt.where(
                or_(
                    Listing.title.ilike(needle),
                    Listing.description.ilike(needle),
                    Listing.city.ilike(needle),
                    Listing.campus_proximity.ilike(needle),
                )
            )
        return stmt

    def _apply_sort(self, stmt: Select, sort: str) -> Select:
        if sort == "price_asc":
            return stmt.order_by(Listing.price.asc(), Listing.created_at.desc())
        if sort == "price_desc":
            return stmt.order_by(Listing.price.desc(), Listing.created_at.desc())
        return stmt.order_by(Listing.created_at.desc())

    async def search(self, filters: ListingFilters) -> tuple[list[Listing], int]:
        """Return one page of listings plus the total match count.

        Amenity filtering happens in Python because `amenities` is a JSON column
        and the containment operators differ between Postgres and SQLite.
        """
        base = self._apply_filters(select(Listing), filters)

        count_stmt = self._apply_filters(
            select(func.count()).select_from(Listing), filters
        )
        total = int((await self.session.execute(count_stmt)).scalar_one())

        stmt = self._apply_sort(base, filters.sort).options(
            joinedload(Listing.owner)
        )
        if not filters.amenities:
            stmt = stmt.limit(filters.page_size).offset(
                (filters.page - 1) * filters.page_size
            )
            result = await self.session.execute(stmt)
            return list(result.unique().scalars().all()), total

        wanted = {a.lower() for a in filters.amenities}
        result = await self.session.execute(stmt)
        matched = [
            listing
            for listing in result.unique().scalars().all()
            if wanted <= {a.lower() for a in (listing.amenities or [])}
        ]
        start = (filters.page - 1) * filters.page_size
        return matched[start : start + filters.page_size], len(matched)

    async def list_by_owner(self, owner_id: UUID) -> list[Listing]:
        result = await self.session.execute(
            select(Listing)
            .where(Listing.owner_id == owner_id)
            .order_by(Listing.created_at.desc())
            .options(joinedload(Listing.owner))
        )
        return list(result.unique().scalars().all())

    async def applications_count(self, listing_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(Application)
            .where(Application.listing_id == listing_id)
        )
        return int(result.scalar_one())

    async def increment_views(self, listing: Listing) -> None:
        listing.views = (listing.views or 0) + 1
        await self.session.commit()

    async def related(self, listing: Listing, limit: int = 3) -> list[Listing]:
        """Same city, similar price, excluding the listing itself."""
        low, high = int(listing.price * 0.7), int(listing.price * 1.3)
        result = await self.session.execute(
            select(Listing)
            .where(
                Listing.id != listing.id,
                Listing.is_active.is_(True),
                Listing.city == listing.city,
                Listing.price.between(low, high),
            )
            .order_by(Listing.created_at.desc())
            .limit(limit)
            .options(joinedload(Listing.owner))
        )
        return list(result.unique().scalars().all())

    async def featured(self, limit: int = 4) -> list[Listing]:
        result = await self.session.execute(
            select(Listing)
            .where(Listing.is_active.is_(True))
            .order_by(Listing.views.desc(), Listing.created_at.desc())
            .limit(limit)
            .options(joinedload(Listing.owner))
        )
        return list(result.unique().scalars().all())


class SavedListingRepository(BaseRepository[SavedListing]):
    model = SavedListing

    async def get_one(self, user_id: UUID, listing_id: UUID) -> SavedListing | None:
        result = await self.session.execute(
            select(SavedListing).where(
                SavedListing.user_id == user_id,
                SavedListing.listing_id == listing_id,
            )
        )
        return result.unique().scalar_one_or_none()

    async def list_for_user(self, user_id: UUID) -> list[SavedListing]:
        result = await self.session.execute(
            select(SavedListing)
            .where(SavedListing.user_id == user_id)
            .order_by(SavedListing.created_at.desc())
            .options(joinedload(SavedListing.listing).joinedload(Listing.owner))
        )
        return list(result.unique().scalars().all())

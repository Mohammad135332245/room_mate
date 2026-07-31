from uuid import UUID

from sqlalchemy import func, select

from app.models.listing import Listing
from app.models.review import Review
from app.models.user import User
from app.repositories.base_repo import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(func.lower(User.email) == email.lower())
        )
        return result.unique().scalar_one_or_none()

    async def email_exists(self, email: str) -> bool:
        result = await self.session.execute(
            select(func.count()).select_from(User).where(
                func.lower(User.email) == email.lower()
            )
        )
        return bool(result.scalar_one())

    async def listings_count(self, user_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(Listing)
            .where(Listing.owner_id == user_id, Listing.is_active.is_(True))
        )
        return int(result.scalar_one())

    async def rating_summary(self, user_id: UUID) -> tuple[float | None, int]:
        """Return (average rating, review count) for a user."""
        result = await self.session.execute(
            select(func.avg(Review.rating), func.count(Review.id)).where(
                Review.reviewed_user_id == user_id
            )
        )
        average, count = result.one()
        return (round(float(average), 2) if average is not None else None, int(count))

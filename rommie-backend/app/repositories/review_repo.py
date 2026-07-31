from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.models.review import Review
from app.repositories.base_repo import BaseRepository


class ReviewRepository(BaseRepository[Review]):
    model = Review

    async def list_for_user(self, user_id: UUID, limit: int = 20) -> list[Review]:
        result = await self.session.execute(
            select(Review)
            .where(Review.reviewed_user_id == user_id)
            .order_by(Review.created_at.desc())
            .limit(limit)
            .options(joinedload(Review.reviewer))
        )
        return list(result.unique().scalars().all())

    async def get_existing(
        self, reviewer_id: UUID, reviewed_user_id: UUID
    ) -> Review | None:
        result = await self.session.execute(
            select(Review).where(
                Review.reviewer_id == reviewer_id,
                Review.reviewed_user_id == reviewed_user_id,
            )
        )
        return result.unique().scalar_one_or_none()

"""Profiles, avatars and reviews."""

from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.integrations.storage import upload_image
from app.models.review import Review
from app.models.user import User
from app.repositories.review_repo import ReviewRepository
from app.repositories.user_repo import UserRepository
from app.schemas.review import ReviewCreate, ReviewRead
from app.schemas.user import UserProfile, UserRead, UserUpdate


class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.users = UserRepository(session)
        self.reviews = ReviewRepository(session)

    async def get_or_404(self, user_id: UUID) -> User:
        user = await self.users.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user

    async def update_me(self, user: User, payload: UserUpdate) -> UserRead:
        data = payload.model_dump(exclude_unset=True)
        if not data:
            return UserRead.model_validate(user)
        await self.users.update(user, data)
        return UserRead.model_validate(user)

    async def set_avatar(self, user: User, file: UploadFile) -> UserRead:
        url = await upload_image(file, folder="avatars")
        await self.users.update(user, {"avatar_url": url})
        return UserRead.model_validate(user)

    async def public_profile(self, user_id: UUID) -> UserProfile:
        user = await self.get_or_404(user_id)
        rating, reviews_count = await self.users.rating_summary(user_id)
        profile = UserProfile.model_validate(user)
        profile.listings_count = await self.users.listings_count(user_id)
        profile.rating = rating
        profile.reviews_count = reviews_count
        return profile

    async def list_reviews(self, user_id: UUID) -> list[ReviewRead]:
        await self.get_or_404(user_id)
        reviews = await self.reviews.list_for_user(user_id)
        return [ReviewRead.model_validate(review) for review in reviews]

    async def leave_review(self, reviewer: User, payload: ReviewCreate) -> ReviewRead:
        if reviewer.id == payload.reviewed_user_id:
            raise ValidationError("You cannot review yourself")
        await self.get_or_404(payload.reviewed_user_id)

        existing = await self.reviews.get_existing(
            reviewer.id, payload.reviewed_user_id
        )
        if existing:
            raise ConflictError("You already reviewed this user")

        review = Review(
            reviewer_id=reviewer.id,
            reviewed_user_id=payload.reviewed_user_id,
            rating=payload.rating,
            comment=payload.comment,
        )
        await self.reviews.add(review)
        stored = await self.reviews.get_existing(
            reviewer.id, payload.reviewed_user_id
        )
        return ReviewRead.model_validate(stored)

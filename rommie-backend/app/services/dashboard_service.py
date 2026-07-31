"""Aggregated numbers for the student and landlord dashboards."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import ApplicationStatus
from app.models.listing import Listing
from app.models.meeting import MeetingStatus
from app.models.user import User, UserRole
from app.repositories.application_repo import ApplicationRepository
from app.repositories.listing_repo import ListingRepository, SavedListingRepository
from app.repositories.meeting_repo import MeetingRepository
from app.repositories.message_repo import MessageRepository
from app.repositories.user_repo import UserRepository


class DashboardService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.listings = ListingRepository(session)
        self.saved = SavedListingRepository(session)
        self.applications = ApplicationRepository(session)
        self.meetings = MeetingRepository(session)
        self.messages = MessageRepository(session)
        self.users = UserRepository(session)

    async def stats(self, user: User) -> dict:
        now = datetime.now(UTC)
        upcoming = await self.meetings.list_for_user(
            user.id, status=MeetingStatus.SCHEDULED, upcoming_only=True, now=now
        )
        unread = await self.messages.unread_total(user.id)

        if user.role is UserRole.LANDLORD:
            return await self._landlord_stats(user, len(upcoming), unread)
        return await self._student_stats(user, len(upcoming), unread)

    async def _student_stats(
        self, user: User, upcoming_meetings: int, unread: int
    ) -> dict:
        applications = await self.applications.list_by_applicant(user.id)
        saved = await self.saved.list_for_user(user.id)
        by_status = {status.value: 0 for status in ApplicationStatus}
        for application in applications:
            by_status[application.status.value] += 1

        return {
            "role": user.role.value,
            "applications_total": len(applications),
            "applications_by_status": by_status,
            "saved_listings": len(saved),
            "upcoming_meetings": upcoming_meetings,
            "unread_messages": unread,
        }

    async def _landlord_stats(
        self, user: User, upcoming_meetings: int, unread: int
    ) -> dict:
        listings = await self.listings.list_by_owner(user.id)
        applications = await self.applications.list_for_owner(user.id)
        week_ago = datetime.now(UTC) - timedelta(days=7)

        views_result = await self.session.execute(
            select(func.coalesce(func.sum(Listing.views), 0)).where(
                Listing.owner_id == user.id
            )
        )
        recent = [
            application
            for application in applications
            if application.created_at >= week_ago
        ]
        answered = [
            application
            for application in applications
            if application.status is not ApplicationStatus.PENDING
        ]
        rating, reviews_count = await self.users.rating_summary(user.id)

        return {
            "role": user.role.value,
            "listings_total": len(listings),
            "listings_active": sum(1 for item in listings if item.is_active),
            "total_views": int(views_result.scalar_one()),
            "applications_total": len(applications),
            "applications_pending": sum(
                1
                for application in applications
                if application.status is ApplicationStatus.PENDING
            ),
            "applications_this_week": len(recent),
            "response_rate": (
                round(len(answered) / len(applications) * 100)
                if applications
                else None
            ),
            "upcoming_meetings": upcoming_meetings,
            "unread_messages": unread,
            "rating": rating,
            "reviews_count": reviews_count,
        }

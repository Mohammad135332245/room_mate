from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import joinedload

from app.models.application import Application
from app.models.listing import Listing
from app.models.meeting import Meeting, MeetingStatus
from app.repositories.base_repo import BaseRepository

_LOADERS = (
    joinedload(Meeting.application).joinedload(Application.applicant),
    joinedload(Meeting.application)
    .joinedload(Application.listing)
    .joinedload(Listing.owner),
)


class MeetingRepository(BaseRepository[Meeting]):
    model = Meeting

    async def get_full(self, meeting_id: UUID) -> Meeting | None:
        result = await self.session.execute(
            select(Meeting).where(Meeting.id == meeting_id).options(*_LOADERS)
        )
        return result.unique().scalar_one_or_none()

    async def list_for_user(
        self,
        user_id: UUID,
        status: MeetingStatus | None = None,
        upcoming_only: bool = False,
        now: datetime | None = None,
    ) -> list[Meeting]:
        stmt = (
            select(Meeting)
            .join(Application, Application.id == Meeting.application_id)
            .join(Listing, Listing.id == Application.listing_id)
            .where(
                or_(Application.applicant_id == user_id, Listing.owner_id == user_id)
            )
            .order_by(Meeting.scheduled_at.asc())
            .options(*_LOADERS)
        )
        if status is not None:
            stmt = stmt.where(Meeting.status == status)
        if upcoming_only and now is not None:
            stmt = stmt.where(Meeting.scheduled_at >= now)

        result = await self.session.execute(stmt)
        return list(result.unique().scalars().all())

    async def find_conflict(
        self,
        user_ids: list[UUID],
        scheduled_at: datetime,
        window_minutes: int = 60,
        exclude_meeting_id: UUID | None = None,
    ) -> Meeting | None:
        """Any active meeting for these users within +/- `window_minutes`."""
        start = scheduled_at - timedelta(minutes=window_minutes)
        end = scheduled_at + timedelta(minutes=window_minutes)

        stmt = (
            select(Meeting)
            .join(Application, Application.id == Meeting.application_id)
            .join(Listing, Listing.id == Application.listing_id)
            .where(
                Meeting.status == MeetingStatus.SCHEDULED,
                Meeting.scheduled_at > start,
                Meeting.scheduled_at < end,
                or_(
                    Application.applicant_id.in_(user_ids),
                    Listing.owner_id.in_(user_ids),
                ),
            )
            .options(*_LOADERS)
        )
        if exclude_meeting_id:
            stmt = stmt.where(Meeting.id != exclude_meeting_id)

        result = await self.session.execute(stmt)
        return result.unique().scalars().first()

"""Scheduling, rescheduling and cancelling viewings."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictError,
    NotFoundError,
    PermissionDeniedError,
    ValidationError,
)
from app.integrations import email
from app.models.application import Application, ApplicationStatus
from app.models.meeting import Meeting, MeetingStatus
from app.models.user import User
from app.repositories.application_repo import ApplicationRepository
from app.repositories.meeting_repo import MeetingRepository
from app.schemas.meeting import MeetingCreate, MeetingRead, MeetingUpdate

WHEN_FORMAT = "%d %b %Y at %H:%M"


class MeetingService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.meetings = MeetingRepository(session)
        self.applications = ApplicationRepository(session)

    async def _application_for(self, application_id: UUID, user: User) -> Application:
        application = await self.applications.get_full(application_id)
        if not application:
            raise NotFoundError("Application not found")
        if not application.involves(user.id):
            raise PermissionDeniedError("This application is not yours")
        return application

    @staticmethod
    def _parties(application: Application) -> list[tuple[str, str]]:
        return [
            (application.applicant.email, application.applicant.name),
            (application.listing.owner.email, application.listing.owner.name),
        ]

    async def get_or_404(self, meeting_id: UUID, user: User) -> Meeting:
        meeting = await self.meetings.get_full(meeting_id)
        if not meeting:
            raise NotFoundError("Meeting not found")
        if not meeting.application.involves(user.id):
            raise PermissionDeniedError("This meeting is not yours")
        return meeting

    async def schedule(self, user: User, payload: MeetingCreate) -> MeetingRead:
        application = await self._application_for(payload.application_id, user)
        if application.status in {
            ApplicationStatus.PENDING,
            ApplicationStatus.DECLINED,
        }:
            raise ValidationError(
                "The application must be accepted before scheduling a viewing"
            )

        participants = [application.applicant_id, application.listing.owner_id]
        clash = await self.meetings.find_conflict(participants, payload.scheduled_at)
        if clash:
            raise ConflictError(
                "One of you already has a viewing within an hour of that time"
            )

        meeting = Meeting(**payload.model_dump())
        await self.meetings.add(meeting)

        if application.status is ApplicationStatus.ACCEPTED:
            await self.applications.update(
                application, {"status": ApplicationStatus.MEETING_SCHEDULED}
            )

        when = payload.scheduled_at.strftime(WHEN_FORMAT)
        for address, name in self._parties(application):
            await email.send_meeting_notice(
                address, name, application.listing.title, when, "scheduled"
            )
        return MeetingRead.model_validate(meeting)

    async def list_for_user(
        self,
        user: User,
        status: MeetingStatus | None = None,
        upcoming_only: bool = False,
    ) -> list[MeetingRead]:
        meetings = await self.meetings.list_for_user(
            user.id, status=status, upcoming_only=upcoming_only, now=datetime.now(UTC)
        )
        return [MeetingRead.model_validate(meeting) for meeting in meetings]

    async def update(
        self, meeting_id: UUID, user: User, payload: MeetingUpdate
    ) -> MeetingRead:
        meeting = await self.get_or_404(meeting_id, user)
        if meeting.status is MeetingStatus.CANCELLED:
            raise ValidationError("This meeting was cancelled")

        data = payload.model_dump(exclude_unset=True)
        if not data:
            return MeetingRead.model_validate(meeting)

        if "scheduled_at" in data and data["scheduled_at"] is not None:
            application = meeting.application
            clash = await self.meetings.find_conflict(
                [application.applicant_id, application.listing.owner_id],
                data["scheduled_at"],
                exclude_meeting_id=meeting.id,
            )
            if clash:
                raise ConflictError(
                    "One of you already has a viewing within an hour of that time"
                )

        await self.meetings.update(meeting, data)

        when = meeting.scheduled_at.strftime(WHEN_FORMAT)
        for address, name in self._parties(meeting.application):
            await email.send_meeting_notice(
                address, name, meeting.application.listing.title, when, "updated"
            )
        return MeetingRead.model_validate(meeting)

    async def cancel(self, meeting_id: UUID, user: User) -> None:
        meeting = await self.get_or_404(meeting_id, user)
        if meeting.status is MeetingStatus.CANCELLED:
            return

        await self.meetings.update(meeting, {"status": MeetingStatus.CANCELLED})

        when = meeting.scheduled_at.strftime(WHEN_FORMAT)
        for address, name in self._parties(meeting.application):
            await email.send_meeting_notice(
                address, name, meeting.application.listing.title, when, "cancelled"
            )

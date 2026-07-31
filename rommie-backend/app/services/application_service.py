"""Applying to listings and moving applications through their lifecycle."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictError,
    NotFoundError,
    PermissionDeniedError,
    ValidationError,
)
from app.integrations import email
from app.models.application import STATUS_TRANSITIONS, Application, ApplicationStatus
from app.models.user import User, UserRole
from app.repositories.application_repo import ApplicationRepository
from app.repositories.listing_repo import ListingRepository
from app.schemas.application import (
    ApplicationCreate,
    ApplicationRead,
    ApplicationSummary,
)


class ApplicationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.applications = ApplicationRepository(session)
        self.listings = ListingRepository(session)

    async def get_or_404(self, application_id: UUID) -> Application:
        application = await self.applications.get_full(application_id)
        if not application:
            raise NotFoundError("Application not found")
        return application

    async def get_for_participant(
        self, application_id: UUID, user: User
    ) -> Application:
        """Fetch an application, enforcing that the user is party to it."""
        application = await self.get_or_404(application_id)
        if not application.involves(user.id):
            raise PermissionDeniedError("This application is not yours")
        return application

    async def submit(self, applicant: User, payload: ApplicationCreate) -> ApplicationRead:
        if applicant.role is not UserRole.STUDENT:
            raise PermissionDeniedError("Only students can apply to listings")

        listing = await self.listings.get(payload.listing_id)
        if not listing or not listing.is_active:
            raise NotFoundError("Listing not found")
        if listing.owner_id == applicant.id:
            raise ValidationError("You cannot apply to your own listing")

        existing = await self.applications.get_for_applicant_and_listing(
            applicant.id, listing.id
        )
        if existing:
            raise ConflictError("You already applied to this listing")

        application = Application(
            applicant_id=applicant.id,
            listing_id=listing.id,
            message=payload.message,
            status=ApplicationStatus.PENDING,
        )
        await self.applications.add(application)

        await email.send_application_received(
            listing.owner.email, listing.owner.name, applicant.name, listing.title
        )
        return ApplicationRead.model_validate(await self.get_or_404(application.id))

    async def list_mine(self, user: User) -> list[ApplicationRead]:
        applications = await self.applications.list_by_applicant(user.id)
        return [ApplicationRead.model_validate(app) for app in applications]

    async def list_received(self, owner: User) -> list[ApplicationRead]:
        applications = await self.applications.list_for_owner(owner.id)
        return [ApplicationRead.model_validate(app) for app in applications]

    async def list_for_listing(
        self, listing_id: UUID, user: User
    ) -> list[ApplicationRead]:
        listing = await self.listings.get(listing_id)
        if not listing:
            raise NotFoundError("Listing not found")
        if listing.owner_id != user.id:
            raise PermissionDeniedError("You can only view applications to your listings")

        applications = await self.applications.list_by_listing(listing_id)
        return [ApplicationRead.model_validate(app) for app in applications]

    async def conversations(self, user: User) -> list[ApplicationSummary]:
        """Chat inbox: every application the user is part of, newest first."""
        applications = await self.applications.list_involving(user.id)
        previews = await self.applications.chat_previews(
            [app.id for app in applications], user.id
        )
        summaries = []
        for app in applications:
            summary = ApplicationSummary.model_validate(app)
            preview = previews.get(app.id)
            if preview:
                summary.unread_count = preview["unread_count"]
                summary.last_message = preview["last_message"]
                summary.last_message_at = preview["last_message_at"]
            summaries.append(summary)
        return summaries

    async def update_status(
        self, application_id: UUID, user: User, new_status: ApplicationStatus
    ) -> ApplicationRead:
        application = await self.get_or_404(application_id)
        if application.listing.owner_id != user.id:
            raise PermissionDeniedError(
                "Only the listing owner can change an application's status"
            )
        if new_status == application.status:
            return ApplicationRead.model_validate(application)

        allowed = STATUS_TRANSITIONS[application.status]
        if new_status not in allowed:
            raise ValidationError(
                f"Cannot move an application from {application.status.value} "
                f"to {new_status.value}"
            )

        await self.applications.update(application, {"status": new_status})

        await email.send_application_status(
            application.applicant.email,
            application.applicant.name,
            application.listing.title,
            new_status.value,
        )
        return ApplicationRead.model_validate(application)

    async def withdraw(self, application_id: UUID, user: User) -> None:
        application = await self.get_or_404(application_id)
        if application.applicant_id != user.id:
            raise PermissionDeniedError("You can only withdraw your own applications")
        await self.applications.remove(application)

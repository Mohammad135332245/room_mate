from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from app.models.application import Application, ApplicationStatus
from app.models.listing import Listing
from app.models.message import Message
from app.repositories.base_repo import BaseRepository

_LOADERS = (
    joinedload(Application.applicant),
    joinedload(Application.listing).joinedload(Listing.owner),
)


class ApplicationRepository(BaseRepository[Application]):
    model = Application

    async def get_full(self, application_id: UUID) -> Application | None:
        result = await self.session.execute(
            select(Application).where(Application.id == application_id).options(*_LOADERS)
        )
        return result.unique().scalar_one_or_none()

    async def get_for_applicant_and_listing(
        self, applicant_id: UUID, listing_id: UUID
    ) -> Application | None:
        result = await self.session.execute(
            select(Application).where(
                Application.applicant_id == applicant_id,
                Application.listing_id == listing_id,
            )
        )
        return result.unique().scalar_one_or_none()

    async def list_by_applicant(self, applicant_id: UUID) -> list[Application]:
        result = await self.session.execute(
            select(Application)
            .where(Application.applicant_id == applicant_id)
            .order_by(Application.created_at.desc())
            .options(*_LOADERS)
        )
        return list(result.unique().scalars().all())

    async def list_by_listing(self, listing_id: UUID) -> list[Application]:
        result = await self.session.execute(
            select(Application)
            .where(Application.listing_id == listing_id)
            .order_by(Application.created_at.desc())
            .options(*_LOADERS)
        )
        return list(result.unique().scalars().all())

    async def list_for_owner(self, owner_id: UUID) -> list[Application]:
       
        result = await self.session.execute(
            select(Application)
            .join(Listing, Listing.id == Application.listing_id)
            .where(Listing.owner_id == owner_id)
            .order_by(Application.created_at.desc())
            .options(*_LOADERS)
        )
        return list(result.unique().scalars().all())

    async def list_involving(self, user_id: UUID) -> list[Application]:
        mine = await self.list_by_applicant(user_id)
        theirs = await self.list_for_owner(user_id)
        merged = {app.id: app for app in [*mine, *theirs]}
        return sorted(merged.values(), key=lambda a: a.updated_at, reverse=True)

    async def count_by_status(
        self, owner_id: UUID, status: ApplicationStatus
    ) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(Application)
            .join(Listing, Listing.id == Application.listing_id)
            .where(Listing.owner_id == owner_id, Application.status == status)
        )
        return int(result.scalar_one())

    async def chat_previews(
        self, application_ids: list[UUID], viewer_id: UUID
    ) -> dict[UUID, dict]:
        if not application_ids:
            return {}

        result = await self.session.execute(
            select(Message)
            .where(Message.application_id.in_(application_ids))
            .order_by(Message.created_at.asc())
        )
        previews: dict[UUID, dict] = {}
        for message in result.unique().scalars().all():
            entry = previews.setdefault(
                message.application_id,
                {"unread_count": 0, "last_message": None, "last_message_at": None},
            )
            entry["last_message"] = message.text
            entry["last_message_at"] = message.created_at
            if message.sender_id != viewer_id and not message.read:
                entry["unread_count"] += 1
        return previews

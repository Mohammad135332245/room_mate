from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.orm import joinedload

from app.models.application import Application
from app.models.listing import Listing
from app.models.message import Message
from app.repositories.base_repo import BaseRepository


class MessageRepository(BaseRepository[Message]):
    model = Message

    async def history(
        self, application_id: UUID, limit: int = 50, before_id: UUID | None = None
    ) -> tuple[list[Message], bool]:
        """Newest `limit` messages, returned oldest-first, plus a has_more flag."""
        stmt = (
            select(Message)
            .where(Message.application_id == application_id)
            .order_by(Message.created_at.desc())
            .limit(limit + 1)
            .options(joinedload(Message.sender))
        )
        if before_id is not None:
            anchor = await self.session.get(Message, before_id)
            if anchor is not None:
                stmt = stmt.where(Message.created_at < anchor.created_at)

        result = await self.session.execute(stmt)
        rows = list(result.unique().scalars().all())
        has_more = len(rows) > limit
        return list(reversed(rows[:limit])), has_more

    async def get_with_sender(self, message_id: UUID) -> Message | None:
        result = await self.session.execute(
            select(Message)
            .where(Message.id == message_id)
            .options(joinedload(Message.sender))
        )
        return result.unique().scalar_one_or_none()

    async def mark_read(self, application_id: UUID, reader_id: UUID) -> int:
        """Mark the other party's messages as read. Returns rows affected."""
        result = await self.session.execute(
            update(Message)
            .where(
                Message.application_id == application_id,
                Message.sender_id != reader_id,
                Message.read.is_(False),
            )
            .values(read=True)
        )
        await self.session.commit()
        return int(result.rowcount or 0)

    async def unread_total(self, user_id: UUID) -> int:
        """Unread messages across every conversation the user is part of."""
        result = await self.session.execute(
            select(func.count())
            .select_from(Message)
            .join(Application, Application.id == Message.application_id)
            .join(Listing, Listing.id == Application.listing_id)
            .where(
                Message.read.is_(False),
                Message.sender_id != user_id,
                (Application.applicant_id == user_id) | (Listing.owner_id == user_id),
            )
        )
        return int(result.scalar_one())

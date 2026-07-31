"""Chat persistence shared by the REST history endpoint and the WebSocket."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, PermissionDeniedError, ValidationError
from app.models.application import Application, ApplicationStatus
from app.models.message import Message
from app.models.user import User
from app.repositories.application_repo import ApplicationRepository
from app.repositories.message_repo import MessageRepository
from app.schemas.chat import ChatHistory, MessageRead


class ChatService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.messages = MessageRepository(session)
        self.applications = ApplicationRepository(session)

    async def get_room(self, application_id: UUID, user_id: UUID) -> Application:
        """Resolve the application backing a chat room and check membership."""
        application = await self.applications.get_full(application_id)
        if not application:
            raise NotFoundError("Conversation not found")
        if not application.involves(user_id):
            raise PermissionDeniedError("You are not part of this conversation")
        if application.status is ApplicationStatus.DECLINED:
            raise PermissionDeniedError("This conversation is closed")
        return application

    async def history(
        self,
        application_id: UUID,
        user: User,
        limit: int = 50,
        before_id: UUID | None = None,
    ) -> ChatHistory:
        await self.get_room(application_id, user.id)
        items, has_more = await self.messages.history(application_id, limit, before_id)
        await self.messages.mark_read(application_id, user.id)
        return ChatHistory(
            items=[MessageRead.model_validate(item) for item in items],
            has_more=has_more,
        )

    async def post(
        self, application_id: UUID, sender_id: UUID, text: str
    ) -> MessageRead:
        await self.get_room(application_id, sender_id)
        cleaned = text.strip()
        if not cleaned:
            raise ValidationError("Message cannot be empty")
        if len(cleaned) > 2000:
            raise ValidationError("Message is too long (max 2000 characters)")

        message = Message(
            application_id=application_id, sender_id=sender_id, text=cleaned
        )
        await self.messages.add(message)
        stored = await self.messages.get_with_sender(message.id)
        return MessageRead.model_validate(stored)

    async def mark_read(self, application_id: UUID, reader_id: UUID) -> int:
        await self.get_room(application_id, reader_id)
        return await self.messages.mark_read(application_id, reader_id)

    async def unread_total(self, user_id: UUID) -> int:
        return await self.messages.unread_total(user_id)

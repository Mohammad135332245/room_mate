from uuid import UUID

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession
from app.core.websocket import manager
from app.schemas.chat import ChatHistory, MessageCreate, MessageRead
from app.schemas.common import Message
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chats", tags=["chat"])


@router.get("/{application_id}/history", response_model=ChatHistory)
async def chat_history(
    application_id: UUID,
    user: CurrentUser,
    db: DbSession,
    limit: int = Query(default=50, ge=1, le=100),
    before: UUID | None = None,
) -> ChatHistory:
    return await ChatService(db).history(application_id, user, limit, before)


@router.post(
    "/{application_id}/messages",
    response_model=MessageRead,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    application_id: UUID, payload: MessageCreate, user: CurrentUser, db: DbSession
) -> MessageRead:
    """REST fallback for sending a message when no socket is connected."""
    message = await ChatService(db).post(application_id, user.id, payload.text)
    await manager.broadcast(
        application_id, {"type": "message", "payload": message.model_dump(mode="json")}
    )
    return message


@router.post("/{application_id}/read", response_model=Message)
async def mark_read(
    application_id: UUID, user: CurrentUser, db: DbSession
) -> Message:
    count = await ChatService(db).mark_read(application_id, user.id)
    await manager.broadcast(
        application_id,
        {"type": "read", "payload": {"reader_id": str(user.id), "count": count}},
    )
    return Message(detail=f"{count} message(s) marked as read")


@router.get("/unread-count")
async def unread_count(user: CurrentUser, db: DbSession) -> dict:
    return {"unread": await ChatService(db).unread_total(user.id)}

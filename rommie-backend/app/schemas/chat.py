from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserPublic


class MessageCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    application_id: UUID
    sender_id: UUID
    text: str
    read: bool
    created_at: datetime
    sender: UserPublic


class ChatHistory(BaseModel):
    items: list[MessageRead]
    has_more: bool = False


# --- WebSocket frames -------------------------------------------------------


class WSIncoming(BaseModel):
    """Frame sent by the client over /ws/chat/{application_id}."""

    type: Literal["message", "typing", "read"]
    text: str | None = Field(default=None, max_length=2000)


class WSOutgoing(BaseModel):
    """Frame pushed to clients."""

    type: Literal["message", "typing", "read", "presence", "error"]
    payload: dict | None = None
    detail: str | None = None

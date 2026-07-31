from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserPublic


class ReviewCreate(BaseModel):
    reviewed_user_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    reviewer_id: UUID
    reviewed_user_id: UUID
    rating: int
    comment: str | None
    created_at: datetime
    reviewer: UserPublic

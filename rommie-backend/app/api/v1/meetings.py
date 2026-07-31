from uuid import UUID

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession
from app.models.meeting import MeetingStatus
from app.schemas.meeting import MeetingCreate, MeetingRead, MeetingUpdate
from app.services.meeting_service import MeetingService

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.post("", response_model=MeetingRead, status_code=status.HTTP_201_CREATED)
async def schedule_meeting(
    payload: MeetingCreate, user: CurrentUser, db: DbSession
) -> MeetingRead:
    return await MeetingService(db).schedule(user, payload)


@router.get("", response_model=list[MeetingRead])
async def list_meetings(
    user: CurrentUser,
    db: DbSession,
    status_filter: MeetingStatus | None = Query(default=None, alias="status"),
    upcoming: bool = False,
) -> list[MeetingRead]:
    return await MeetingService(db).list_for_user(
        user, status=status_filter, upcoming_only=upcoming
    )


@router.get("/{meeting_id}", response_model=MeetingRead)
async def get_meeting(
    meeting_id: UUID, user: CurrentUser, db: DbSession
) -> MeetingRead:
    meeting = await MeetingService(db).get_or_404(meeting_id, user)
    return MeetingRead.model_validate(meeting)


@router.put("/{meeting_id}", response_model=MeetingRead)
async def update_meeting(
    meeting_id: UUID, payload: MeetingUpdate, user: CurrentUser, db: DbSession
) -> MeetingRead:
    return await MeetingService(db).update(meeting_id, user, payload)


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_meeting(meeting_id: UUID, user: CurrentUser, db: DbSession) -> None:
    await MeetingService(db).cancel(meeting_id, user)

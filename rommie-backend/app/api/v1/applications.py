from uuid import UUID

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.application import (
    ApplicationCreate,
    ApplicationRead,
    ApplicationStatusUpdate,
    ApplicationSummary,
)
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
async def submit_application(
    payload: ApplicationCreate, user: CurrentUser, db: DbSession
) -> ApplicationRead:
    return await ApplicationService(db).submit(user, payload)


@router.get("/my", response_model=list[ApplicationRead])
async def my_applications(user: CurrentUser, db: DbSession) -> list[ApplicationRead]:
    return await ApplicationService(db).list_mine(user)


@router.get("/received", response_model=list[ApplicationRead])
async def received_applications(
    user: CurrentUser, db: DbSession
) -> list[ApplicationRead]:
    """Landlord view: applications across all of the owner's listings."""
    return await ApplicationService(db).list_received(user)


@router.get("/conversations", response_model=list[ApplicationSummary])
async def conversations(user: CurrentUser, db: DbSession) -> list[ApplicationSummary]:
    """Chat inbox — one entry per application the user is part of."""
    return await ApplicationService(db).conversations(user)


@router.get("/{application_id}", response_model=ApplicationRead)
async def get_application(
    application_id: UUID, user: CurrentUser, db: DbSession
) -> ApplicationRead:
    application = await ApplicationService(db).get_for_participant(application_id, user)
    return ApplicationRead.model_validate(application)


@router.put("/{application_id}/status", response_model=ApplicationRead)
async def update_status(
    application_id: UUID,
    payload: ApplicationStatusUpdate,
    user: CurrentUser,
    db: DbSession,
) -> ApplicationRead:
    return await ApplicationService(db).update_status(
        application_id, user, payload.status
    )


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def withdraw_application(
    application_id: UUID, user: CurrentUser, db: DbSession
) -> None:
    await ApplicationService(db).withdraw(application_id, user)

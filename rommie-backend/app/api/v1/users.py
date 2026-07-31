from uuid import UUID

from fastapi import APIRouter, File, UploadFile, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.review import ReviewCreate, ReviewRead
from app.schemas.user import UserProfile, UserRead, UserUpdate
from app.services.dashboard_service import DashboardService
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_me(user: CurrentUser) -> UserRead:
    return UserRead.model_validate(user)


@router.put("/me", response_model=UserRead)
async def update_me(payload: UserUpdate, user: CurrentUser, db: DbSession) -> UserRead:
    return await UserService(db).update_me(user, payload)


@router.post("/me/avatar", response_model=UserRead)
async def upload_avatar(
    user: CurrentUser, db: DbSession, file: UploadFile = File(...)
) -> UserRead:
    return await UserService(db).set_avatar(user, file)


@router.get("/me/stats")
async def my_stats(user: CurrentUser, db: DbSession) -> dict:
    """Dashboard counters, shaped by the caller's role."""
    return await DashboardService(db).stats(user)


@router.get("/{user_id}", response_model=UserProfile)
async def get_profile(user_id: UUID, db: DbSession) -> UserProfile:
    return await UserService(db).public_profile(user_id)


@router.get("/{user_id}/reviews", response_model=list[ReviewRead])
async def get_reviews(user_id: UUID, db: DbSession) -> list[ReviewRead]:
    return await UserService(db).list_reviews(user_id)


@router.post(
    "/reviews", response_model=ReviewRead, status_code=status.HTTP_201_CREATED
)
async def leave_review(
    payload: ReviewCreate, user: CurrentUser, db: DbSession
) -> ReviewRead:
    return await UserService(db).leave_review(user, payload)

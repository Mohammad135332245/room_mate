"""Aggregates every /api/v1 route."""

from fastapi import APIRouter

from app.api.v1 import applications, auth, chats, listings, meetings, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(listings.router)
api_router.include_router(applications.router)
api_router.include_router(meetings.router)
api_router.include_router(chats.router)

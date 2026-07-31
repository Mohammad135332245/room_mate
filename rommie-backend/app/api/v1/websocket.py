"""Real-time chat socket: /ws/chat/{application_id}?token=<access token>."""

import logging
from uuid import UUID

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from pydantic import ValidationError as PydanticValidationError

from app.api.deps import get_ws_user
from app.core.database import AsyncSessionLocal
from app.core.exceptions import AppError
from app.core.websocket import manager
from app.schemas.chat import WSIncoming
from app.services.chat_service import ChatService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])

# Close codes (4000+ is the application-defined range).
CLOSE_UNAUTHORIZED = 4401
CLOSE_FORBIDDEN = 4403


@router.websocket("/ws/chat/{application_id}")
async def chat_socket(
    websocket: WebSocket,
    application_id: UUID,
    token: str = Query(..., description="JWT access token"),
) -> None:
    async with AsyncSessionLocal() as db:
        chat = ChatService(db)

        # Authenticate and authorize before accepting the socket.
        try:
            user = await get_ws_user(token, db)
            await chat.get_room(application_id, user.id)
        except AppError as exc:
            await websocket.close(code=CLOSE_UNAUTHORIZED, reason=exc.message)
            return

        await manager.connect(application_id, user.id, websocket)
        await manager.broadcast(
            application_id,
            {"type": "presence", "payload": {"user_id": str(user.id), "online": True}},
            exclude=websocket,
        )

        try:
            while True:
                raw = await websocket.receive_json()
                try:
                    frame = WSIncoming.model_validate(raw)
                except PydanticValidationError:
                    await manager.send_personal(
                        websocket, {"type": "error", "detail": "Malformed frame"}
                    )
                    continue

                if frame.type == "message":
                    try:
                        message = await chat.post(
                            application_id, user.id, frame.text or ""
                        )
                    except AppError as exc:
                        await manager.send_personal(
                            websocket, {"type": "error", "detail": exc.message}
                        )
                        continue
                    await manager.broadcast(
                        application_id,
                        {
                            "type": "message",
                            "payload": message.model_dump(mode="json"),
                        },
                    )

                elif frame.type == "typing":
                    await manager.broadcast(
                        application_id,
                        {
                            "type": "typing",
                            "payload": {"user_id": str(user.id), "name": user.name},
                        },
                        exclude=websocket,
                    )

                elif frame.type == "read":
                    count = await chat.mark_read(application_id, user.id)
                    await manager.broadcast(
                        application_id,
                        {
                            "type": "read",
                            "payload": {"reader_id": str(user.id), "count": count},
                        },
                    )

        except WebSocketDisconnect:
            pass
        except Exception:  # keep one bad socket from taking the room down
            logger.exception("Chat socket failed for application %s", application_id)
        finally:
            await manager.disconnect(application_id, websocket)
            await manager.broadcast(
                application_id,
                {
                    "type": "presence",
                    "payload": {"user_id": str(user.id), "online": False},
                },
            )

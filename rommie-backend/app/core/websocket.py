import asyncio
import logging
from collections import defaultdict
from typing import Any
from uuid import UUID

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._rooms: dict[UUID, list[tuple[UUID, WebSocket]]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def connect(self, room_id: UUID, user_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._rooms[room_id].append((user_id, websocket))
        logger.info("user %s joined room %s", user_id, room_id)

    async def disconnect(self, room_id: UUID, websocket: WebSocket) -> None:
        async with self._lock:
            room = self._rooms.get(room_id)
            if not room:
                return
            self._rooms[room_id] = [
                entry for entry in room if entry[1] is not websocket
            ]
            if not self._rooms[room_id]:
                del self._rooms[room_id]

    async def broadcast(
        self, room_id: UUID, payload: dict[str, Any], exclude: WebSocket | None = None
    ) -> None:
        async with self._lock:
            targets = list(self._rooms.get(room_id, []))

        stale: list[WebSocket] = []
        for _, socket in targets:
            if socket is exclude:
                continue
            try:
                await socket.send_json(payload)
            except Exception:  # client vanished mid-send
                stale.append(socket)

        for socket in stale:
            await self.disconnect(room_id, socket)

    async def send_personal(self, websocket: WebSocket, payload: dict[str, Any]) -> None:
        await websocket.send_json(payload)

    def participants(self, room_id: UUID) -> set[UUID]:
        return {user_id for user_id, _ in self._rooms.get(room_id, [])}

    def is_online(self, room_id: UUID, user_id: UUID) -> bool:
        return user_id in self.participants(room_id)


manager = ConnectionManager()

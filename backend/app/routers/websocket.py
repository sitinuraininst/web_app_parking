"""
Smart Parking UMSU — WebSocket Router

WebSocket endpoint for realtime parking dashboard updates.
Broadcasts parking entry/exit events and statistics to connected clients.
"""

import json
import logging
from typing import Optional

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.constants import WSEventType
from app.core.security import decode_access_token

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


# ── Connection Manager ─────────────────────────────────────

class ConnectionManager:
    """
    Manages active WebSocket connections for realtime broadcasts.
    Thread-safe connection tracking and message broadcasting.
    """

    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self._authenticated_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: Optional[str] = None):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        if user_id:
            self._authenticated_connections[user_id] = websocket
        logger.info(
            f"WebSocket connected. Total: {len(self.active_connections)}"
        )

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        # Remove from authenticated map
        to_remove = [
            uid for uid, ws in self._authenticated_connections.items()
            if ws == websocket
        ]
        for uid in to_remove:
            del self._authenticated_connections[uid]

        logger.info(
            f"WebSocket disconnected. Total: {len(self.active_connections)}"
        )

    async def broadcast(self, message: dict):
        """Send a message to all connected clients."""
        if not self.active_connections:
            return

        disconnected = []
        message_str = json.dumps(message, default=str)

        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)

    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send a message to a specific client."""
        try:
            await websocket.send_json(message)
        except Exception:
            self.disconnect(websocket)

    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to a specific authenticated user."""
        ws = self._authenticated_connections.get(user_id)
        if ws:
            await self.send_personal(ws, message)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)


# Singleton manager instance — imported by parking router for broadcasts
manager = ConnectionManager()


# ── WebSocket Endpoint ─────────────────────────────────────

@router.websocket("/ws/parking")
async def websocket_parking(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for realtime parking updates.

    Connect: ws://localhost:8000/api/ws/parking?token=<jwt>

    Events sent to clients:
    - parking:entry — when a vehicle enters
    - parking:exit — when a vehicle exits
    - stats:update — periodic statistics refresh
    - connection:ack — on successful connection
    """
    user_id = None

    # Validate token if provided
    if token:
        payload = decode_access_token(token)
        if payload is None:
            await websocket.close(code=4001, reason="Invalid token")
            return
        user_id = payload.get("sub")

    await manager.connect(websocket, user_id)

    try:
        # Send connection acknowledgment
        await manager.send_personal(websocket, {
            "type": WSEventType.CONNECTION_ACK.value,
            "data": {
                "message": "Terhubung ke Smart Parking UMSU realtime",
                "active_connections": manager.connection_count,
                "authenticated": user_id is not None,
            },
        })

        # Keep connection alive
        while True:
            data = await websocket.receive_text()

            # Handle ping/pong
            try:
                parsed = json.loads(data)
                if parsed.get("type") == "ping":
                    await manager.send_personal(websocket, {
                        "type": "pong",
                        "data": {"connections": manager.connection_count},
                    })
            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)
        logger.error(f"WebSocket error: {e}")

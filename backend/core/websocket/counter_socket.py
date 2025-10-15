"""WebSocket handler for counter updates."""

from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
from core.utils.logger import logger
import json
import asyncio


class ConnectionManager:
    """Manages WebSocket connections for counter updates."""

    def __init__(self):
        # session_id -> Set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            if session_id not in self.active_connections:
                self.active_connections[session_id] = set()
            self.active_connections[session_id].add(websocket)
        logger.info(f"WebSocket connected for session {session_id}. Active connections: {len(self.active_connections[session_id])}")

    async def disconnect(self, websocket: WebSocket, session_id: str):
        """Remove a WebSocket connection."""
        async with self._lock:
            if session_id in self.active_connections:
                self.active_connections[session_id].discard(websocket)
                if not self.active_connections[session_id]:
                    del self.active_connections[session_id]
        logger.info(f"WebSocket disconnected for session {session_id}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific WebSocket."""
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending message to websocket: {e}")

    async def broadcast_to_session(self, message: dict, session_id: str):
        """Broadcast a message to all connections in a session."""
        if session_id not in self.active_connections:
            return

        message_text = json.dumps(message)
        disconnected = set()

        for connection in self.active_connections[session_id].copy():
            try:
                await connection.send_text(message_text)
            except Exception as e:
                logger.error(f"Error broadcasting to session {session_id}: {e}")
                disconnected.add(connection)

        # Clean up disconnected connections
        if disconnected:
            async with self._lock:
                self.active_connections[session_id] -= disconnected
                if not self.active_connections[session_id]:
                    del self.active_connections[session_id]


# Global connection manager instance
counter_manager = ConnectionManager()


async def handle_counter_websocket(websocket: WebSocket, session_id: str):
    """
    Handle WebSocket connection for counter updates.

    Args:
        websocket: The WebSocket connection
        session_id: The session/thread ID for this connection
    """
    await counter_manager.connect(websocket, session_id)

    try:
        while True:
            # Keep connection alive and handle any incoming messages
            data = await websocket.receive_text()

            # Handle ping/pong for connection health
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            else:
                # Log any other messages for debugging
                logger.debug(f"Received message from session {session_id}: {data}")

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected normally for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}")
    finally:
        await counter_manager.disconnect(websocket, session_id)

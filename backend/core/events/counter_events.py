"""Event handlers for counter updates."""

from typing import Optional
from core.websocket.counter_socket import counter_manager
from core.services.counter_service import counter_service
from core.utils.logger import logger
import asyncio
from collections import defaultdict
import time


class CounterEventManager:
    """Manages counter update events with rate limiting."""

    def __init__(self):
        # Rate limiting: track last update time per session
        self._last_update = defaultdict(float)
        self._min_update_interval = 0.1  # 100ms minimum between updates

    async def emit_context_used(
        self, session_id: str, used: int, total: int, force: bool = False
    ):
        """
        Emit context_used event to WebSocket clients.

        Args:
            session_id: The session/thread ID
            used: Tokens used
            total: Total tokens available
            force: Skip rate limiting if True
        """
        try:
            # Rate limiting check
            if not force:
                now = time.time()
                last = self._last_update.get(session_id, 0)
                if now - last < self._min_update_interval:
                    logger.debug(f"Rate limited context update for {session_id}")
                    return
                self._last_update[session_id] = now

            # Update counter service
            context_data = await counter_service.update_context_usage(
                session_id, used, total
            )

            # Broadcast to WebSocket clients
            message = {
                "type": "context_update",
                "session_id": session_id,
                "data": context_data,
                "timestamp": time.time()
            }

            await counter_manager.broadcast_to_session(message, session_id)
            logger.debug(f"Emitted context_used event for {session_id}: {context_data}")

        except Exception as e:
            logger.error(f"Error emitting context_used event for {session_id}: {e}")

    async def emit_context_freed(
        self, session_id: str, freed: int, total: int
    ):
        """
        Emit context_freed event when context is released.

        Args:
            session_id: The session/thread ID
            freed: Tokens freed
            total: Total tokens available
        """
        try:
            # Get current usage and subtract freed amount
            current = await counter_service.get_context_usage(session_id)
            new_used = max(0, current["used"] - freed)

            # Update and emit
            await self.emit_context_used(session_id, new_used, total, force=True)

        except Exception as e:
            logger.error(f"Error emitting context_freed event for {session_id}: {e}")

    async def emit_token_count(
        self, session_id: str, text: str
    ):
        """
        Emit token_count event for real-time counting.

        Args:
            session_id: The session/thread ID
            text: Text to count tokens for
        """
        try:
            # Calculate token count
            token_data = await counter_service.get_token_count(session_id, text)

            # Broadcast to WebSocket clients
            message = {
                "type": "token_count",
                "session_id": session_id,
                "data": token_data,
                "timestamp": time.time()
            }

            await counter_manager.broadcast_to_session(message, session_id)

        except Exception as e:
            logger.error(f"Error emitting token_count event for {session_id}: {e}")


# Global event manager instance
counter_events = CounterEventManager()

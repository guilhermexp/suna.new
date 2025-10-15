"""Service for managing context and token counters."""

from typing import Optional
from core.utils.logger import logger
from core.services import redis
import json


class CounterService:
    """Service for tracking and updating context/token counters."""

    def __init__(self):
        self.redis_prefix = "counter:"

    async def get_context_usage(self, session_id: str) -> dict:
        """
        Get current context usage for a session.

        Args:
            session_id: The session/thread ID

        Returns:
            dict with used, total, percentage
        """
        try:
            client = await redis.get_client()
            key = f"{self.redis_prefix}context:{session_id}"
            data = await client.get(key)

            if data:
                return json.loads(data)

            # Default values
            return {
                "used": 0,
                "total": 200000,
                "percentage": 0.0
            }
        except Exception as e:
            logger.error(f"Error getting context usage for {session_id}: {e}")
            return {"used": 0, "total": 200000, "percentage": 0.0}

    async def update_context_usage(self, session_id: str, used: int, total: int) -> dict:
        """
        Update context usage for a session.

        Args:
            session_id: The session/thread ID
            used: Tokens used
            total: Total tokens available

        Returns:
            Updated context data
        """
        try:
            percentage = (used / total * 100) if total > 0 else 0

            data = {
                "used": used,
                "total": total,
                "percentage": round(percentage, 2)
            }

            client = await redis.get_client()
            key = f"{self.redis_prefix}context:{session_id}"

            # Store with 24 hour expiry
            await client.setex(key, 86400, json.dumps(data))

            logger.debug(f"Updated context usage for {session_id}: {used}/{total} ({percentage:.2f}%)")
            return data
        except Exception as e:
            logger.error(f"Error updating context usage for {session_id}: {e}")
            raise

    async def get_token_count(self, session_id: str, text: str) -> dict:
        """
        Calculate token count for given text.

        Args:
            session_id: The session/thread ID
            text: Text to count tokens for

        Returns:
            dict with token count and limits
        """
        try:
            # Simple estimation: ~4 characters per token
            # In production, use a proper tokenizer like tiktoken
            estimated_tokens = len(text) // 4

            # Default limits (can be customized per user/plan)
            max_tokens = 8000

            percentage = (estimated_tokens / max_tokens * 100) if max_tokens > 0 else 0

            data = {
                "count": estimated_tokens,
                "max": max_tokens,
                "percentage": round(percentage, 2),
                "warning": percentage >= 80
            }

            return data
        except Exception as e:
            logger.error(f"Error calculating token count for {session_id}: {e}")
            return {"count": 0, "max": 8000, "percentage": 0.0, "warning": False}


# Global counter service instance
counter_service = CounterService()

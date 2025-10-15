"""WebSocket API endpoints."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from core.websocket.counter_socket import handle_counter_websocket
from core.utils.logger import logger

router = APIRouter()


@router.websocket("/ws/counters/{session_id}")
async def websocket_counter_endpoint(
    websocket: WebSocket,
    session_id: str
):
    """
    WebSocket endpoint for real-time counter updates.

    Args:
        websocket: The WebSocket connection
        session_id: The session/thread ID
    """
    logger.info(f"WebSocket connection request for session: {session_id}")

    try:
        await handle_counter_websocket(websocket, session_id)
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}")


@router.get("/counters/context/{session_id}")
async def get_context_usage(session_id: str):
    """
    Get current context usage for a session.

    Args:
        session_id: The session/thread ID

    Returns:
        Context usage data
    """
    from core.services.counter_service import counter_service
    return await counter_service.get_context_usage(session_id)


@router.post("/counters/context/{session_id}")
async def update_context_usage(
    session_id: str,
    used: int,
    total: int
):
    """
    Update context usage for a session.

    Args:
        session_id: The session/thread ID
        used: Tokens used
        total: Total tokens available

    Returns:
        Updated context data
    """
    from core.events.counter_events import counter_events
    await counter_events.emit_context_used(session_id, used, total, force=True)
    return {"status": "ok", "session_id": session_id}


@router.post("/counters/tokens/{session_id}")
async def count_tokens(
    session_id: str,
    text: str
):
    """
    Count tokens for given text.

    Args:
        session_id: The session/thread ID
        text: Text to count tokens for

    Returns:
        Token count data
    """
    from core.services.counter_service import counter_service
    return await counter_service.get_token_count(session_id, text)

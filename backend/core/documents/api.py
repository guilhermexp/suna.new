"""
Document Management API Endpoints
Provides REST API for document CRUD operations with rate limiting
"""
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Header, Request, Response
from core.services.supabase import DBConnection
from core.utils.auth_utils import verify_and_get_user_id_from_jwt
from core.utils.logger import logger
from core.services import redis
from datetime import datetime, timezone, timedelta
import json

from .models import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentListResponse,
    DocumentVersionResponse,
    DocumentStatus
)
from .service import DocumentService


router = APIRouter(prefix="/documents", tags=["documents"])


# Rate limiting configuration
RATE_LIMIT_REQUESTS = 100  # requests per window
RATE_LIMIT_WINDOW = 60  # seconds


async def check_rate_limit(request: Request, user_id: str):
    """
    Check rate limit for a user

    Args:
        request: FastAPI request
        user_id: User ID

    Raises:
        HTTPException: 429 if rate limit exceeded
    """
    try:
        redis_client = await redis.get_client()
        key = f"rate_limit:documents:{user_id}"

        # Get current count
        count = await redis_client.get(key)

        if count is None:
            # First request in window
            await redis_client.setex(key, RATE_LIMIT_WINDOW, 1)
            remaining = RATE_LIMIT_REQUESTS - 1
        else:
            count = int(count)
            if count >= RATE_LIMIT_REQUESTS:
                # Rate limit exceeded
                ttl = await redis_client.ttl(key)
                logger.warning(f"Rate limit exceeded for user {user_id}")
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limit exceeded. Try again in {ttl} seconds.",
                    headers={
                        "X-RateLimit-Limit": str(RATE_LIMIT_REQUESTS),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(ttl),
                        "Retry-After": str(ttl)
                    }
                )

            # Increment counter
            await redis_client.incr(key)
            remaining = RATE_LIMIT_REQUESTS - count - 1

        # Add rate limit headers to response
        request.state.rate_limit_headers = {
            "X-RateLimit-Limit": str(RATE_LIMIT_REQUESTS),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(RATE_LIMIT_WINDOW)
        }

    except HTTPException:
        raise
    except Exception as e:
        # If Redis fails, log but don't block the request
        logger.warning(f"Rate limit check failed: {e}")
        pass


async def get_db_connection() -> DBConnection:
    """Get database connection"""
    db = DBConnection()
    await db.initialize()
    return db


async def get_document_service(db: DBConnection = Depends(get_db_connection)) -> DocumentService:
    """Get document service"""
    return DocumentService(db)


async def get_account_id_from_user(user_id: str, db: DBConnection) -> UUID:
    """
    Get the primary account ID for a user

    Args:
        user_id: User ID
        db: Database connection

    Returns:
        Account ID

    Raises:
        HTTPException: If user has no account
    """
    client = await db.client

    try:
        result = await client.schema('basejump').table('account_user').select(
            'account_id'
        ).eq('user_id', user_id).limit(1).execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=403, detail="User has no associated account")

        return UUID(result.data[0]['account_id'])

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching account for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user account")


@router.post("", response_model=DocumentResponse, status_code=201)
async def create_document(
    document_data: DocumentCreate,
    request: Request,
    response: Response,
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
    db: DBConnection = Depends(get_db_connection),
    service: DocumentService = Depends(get_document_service)
):
    """
    Create a new document

    **Permissions**: User must be authenticated and have an associated account

    **Rate Limit**: 100 requests per minute

    **Request Body**:
    - title: Document title (max 500 chars)
    - content: Document content
    - content_type: MIME type (default: text/plain)
    - metadata: Additional metadata (JSON object)
    - tags: List of tags for categorization

    **Response**: Created document with version 1
    """
    await check_rate_limit(request, user_id)

    account_id = await get_account_id_from_user(user_id, db)
    result = await service.create_document(document_data, account_id, UUID(user_id))

    # Add rate limit headers
    if hasattr(request.state, 'rate_limit_headers'):
        for key, value in request.state.rate_limit_headers.items():
            response.headers[key] = value

    return result


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    request: Request,
    response: Response,
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
    db: DBConnection = Depends(get_db_connection),
    service: DocumentService = Depends(get_document_service),
    if_none_match: Optional[str] = Header(None)
):
    """
    Get a document by ID

    **Permissions**: User must have access to the document's account

    **Rate Limit**: 100 requests per minute

    **Headers**:
    - If-None-Match: ETag for cache validation (returns 304 if unchanged)

    **Response**: Document data with current version
    """
    await check_rate_limit(request, user_id)

    account_id = await get_account_id_from_user(user_id, db)
    document = await service.get_document(document_id, account_id)

    # Add rate limit headers
    if hasattr(request.state, 'rate_limit_headers'):
        for key, value in request.state.rate_limit_headers.items():
            response.headers[key] = value

    # Add ETag header
    response.headers['ETag'] = document.etag
    response.headers['Last-Modified'] = document.last_modified_at.strftime('%a, %d %b %Y %H:%M:%S GMT')

    # Check If-None-Match for caching
    if if_none_match and if_none_match == document.etag:
        return Response(status_code=304)

    return document


@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: UUID,
    update_data: DocumentUpdate,
    request: Request,
    response: Response,
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
    db: DBConnection = Depends(get_db_connection),
    service: DocumentService = Depends(get_document_service)
):
    """
    Update a document

    **Permissions**: User must have access to the document's account

    **Rate Limit**: 100 requests per minute

    **Version Control**: Each update increments the version number

    **Conflict Detection**: Use if_match field with ETag to prevent conflicts

    **Request Body**:
    - title: New title (optional)
    - content: New content (optional)
    - content_type: New MIME type (optional)
    - metadata: New metadata (optional)
    - tags: New tags (optional)
    - status: New status (optional)
    - if_match: ETag for optimistic locking (recommended)

    **Response**: Updated document with incremented version

    **Error Codes**:
    - 404: Document not found
    - 409: Conflict - document was modified by another user (if if_match provided)
    """
    await check_rate_limit(request, user_id)

    account_id = await get_account_id_from_user(user_id, db)
    result = await service.update_document(document_id, update_data, account_id, UUID(user_id))

    # Add rate limit headers
    if hasattr(request.state, 'rate_limit_headers'):
        for key, value in request.state.rate_limit_headers.items():
            response.headers[key] = value

    # Add ETag header
    response.headers['ETag'] = result.etag
    response.headers['Last-Modified'] = result.last_modified_at.strftime('%a, %d %b %Y %H:%M:%S GMT')

    return result


@router.delete("/{document_id}")
async def delete_document(
    document_id: UUID,
    request: Request,
    response: Response,
    hard_delete: bool = False,
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
    db: DBConnection = Depends(get_db_connection),
    service: DocumentService = Depends(get_document_service)
):
    """
    Delete a document (soft delete by default)

    **Permissions**: User must have access to the document's account

    **Rate Limit**: 100 requests per minute

    **Query Parameters**:
    - hard_delete: If true, permanently delete. If false (default), soft delete.

    **Response**: Deletion confirmation message
    """
    await check_rate_limit(request, user_id)

    account_id = await get_account_id_from_user(user_id, db)
    result = await service.delete_document(document_id, account_id, UUID(user_id), hard_delete)

    # Add rate limit headers
    if hasattr(request.state, 'rate_limit_headers'):
        for key, value in request.state.rate_limit_headers.items():
            response.headers[key] = value

    return result


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    request: Request,
    response: Response,
    page: int = 1,
    page_size: int = 20,
    status: Optional[DocumentStatus] = None,
    tags: Optional[str] = None,
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
    db: DBConnection = Depends(get_db_connection),
    service: DocumentService = Depends(get_document_service)
):
    """
    List documents with pagination and filtering

    **Permissions**: User must be authenticated

    **Rate Limit**: 100 requests per minute

    **Query Parameters**:
    - page: Page number (default: 1)
    - page_size: Items per page (default: 20, max: 100)
    - status: Filter by status (active, archived, deleted)
    - tags: Comma-separated list of tags to filter by

    **Response**: Paginated list of documents
    """
    await check_rate_limit(request, user_id)

    # Validate page size
    if page_size > 100:
        page_size = 100
    if page_size < 1:
        page_size = 20

    if page < 1:
        page = 1

    account_id = await get_account_id_from_user(user_id, db)

    # Parse tags
    tag_list = None
    if tags:
        tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]

    documents, total = await service.list_documents(
        account_id,
        page=page,
        page_size=page_size,
        status=status,
        tags=tag_list
    )

    # Add rate limit headers
    if hasattr(request.state, 'rate_limit_headers'):
        for key, value in request.state.rate_limit_headers.items():
            response.headers[key] = value

    has_more = (page * page_size) < total

    return DocumentListResponse(
        documents=documents,
        total=total,
        page=page,
        page_size=page_size,
        has_more=has_more
    )


@router.get("/{document_id}/versions", response_model=List[DocumentVersionResponse])
async def get_document_versions(
    document_id: UUID,
    request: Request,
    response: Response,
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
    db: DBConnection = Depends(get_db_connection),
    service: DocumentService = Depends(get_document_service)
):
    """
    Get version history for a document

    **Permissions**: User must have access to the document's account

    **Rate Limit**: 100 requests per minute

    **Response**: List of all versions, newest first
    """
    await check_rate_limit(request, user_id)

    account_id = await get_account_id_from_user(user_id, db)
    versions = await service.get_document_versions(document_id, account_id)

    # Add rate limit headers
    if hasattr(request.state, 'rate_limit_headers'):
        for key, value in request.state.rate_limit_headers.items():
            response.headers[key] = value

    return versions


# Initialize function (if needed)
def initialize(db: DBConnection):
    """Initialize the documents module"""
    logger.info("Documents API initialized")

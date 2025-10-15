"""
Document Management Service
Handles CRUD operations, version control, conflict detection, and content sanitization
"""
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from uuid import UUID
import bleach
from fastapi import HTTPException
from core.services.supabase import DBConnection
from core.utils.logger import logger
from .models import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentVersionResponse,
    DocumentStatus,
    ConflictError
)


class DocumentService:
    """Service for managing documents with version control and conflict detection"""

    # Allowed HTML tags for sanitization
    ALLOWED_TAGS = [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'hr', 'table',
        'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div'
    ]

    ALLOWED_ATTRIBUTES = {
        'a': ['href', 'title', 'target'],
        'span': ['class'],
        'div': ['class'],
        'code': ['class'],
        'pre': ['class']
    }

    ALLOWED_PROTOCOLS = ['http', 'https', 'mailto']

    def __init__(self, db: DBConnection):
        self.db = db

    async def _get_client(self):
        """Get the Supabase client"""
        return await self.db.client

    def _sanitize_content(self, content: str, content_type: str) -> str:
        """
        Sanitize content based on content type

        Args:
            content: The content to sanitize
            content_type: MIME type of the content

        Returns:
            Sanitized content
        """
        if content_type in ['text/html', 'text/markdown']:
            # Sanitize HTML/Markdown content
            return bleach.clean(
                content,
                tags=self.ALLOWED_TAGS,
                attributes=self.ALLOWED_ATTRIBUTES,
                protocols=self.ALLOWED_PROTOCOLS,
                strip=True
            )
        elif content_type.startswith('text/'):
            # For plain text, just escape HTML entities
            return bleach.clean(content, tags=[], strip=True)
        else:
            # For other content types, return as-is
            # In production, you might want to validate or reject unknown types
            return content

    async def _create_version_snapshot(
        self,
        document_id: UUID,
        version: int,
        title: str,
        content: str,
        content_type: str,
        metadata: dict,
        created_by: UUID
    ):
        """Create a version snapshot in document_versions table"""
        client = await self._get_client()

        try:
            await client.table('document_versions').insert({
                'document_id': str(document_id),
                'version': version,
                'title': title,
                'content': content,
                'content_type': content_type,
                'metadata': metadata,
                'created_by': str(created_by)
            }).execute()

            logger.debug(f"Created version snapshot for document {document_id}, version {version}")
        except Exception as e:
            logger.error(f"Failed to create version snapshot: {e}")
            # Don't fail the main operation if versioning fails
            pass

    async def _check_document_access(
        self,
        client,
        document_id: UUID,
        account_id: UUID
    ) -> Optional[dict]:
        """
        Check if user has access to a document

        Returns:
            Document data if access is granted, None otherwise
        """
        result = await client.table('documents').select('*').eq(
            'id', str(document_id)
        ).eq(
            'account_id', str(account_id)
        ).is_('deleted_at', 'null').execute()

        if result.data and len(result.data) > 0:
            return result.data[0]
        return None

    async def create_document(
        self,
        document_data: DocumentCreate,
        account_id: UUID,
        user_id: UUID
    ) -> DocumentResponse:
        """
        Create a new document

        Args:
            document_data: Document creation data
            account_id: Account ID that owns the document
            user_id: User ID creating the document

        Returns:
            Created document
        """
        client = await self._get_client()

        # Sanitize content
        sanitized_content = self._sanitize_content(
            document_data.content,
            document_data.content_type
        )

        # Prepare document data
        doc_insert = {
            'title': document_data.title,
            'content': sanitized_content,
            'content_type': document_data.content_type,
            'metadata': document_data.metadata,
            'tags': document_data.tags,
            'account_id': str(account_id),
            'created_by': str(user_id),
            'updated_by': str(user_id),
            'version': 1,
            'status': DocumentStatus.ACTIVE.value
        }

        try:
            result = await client.table('documents').insert(doc_insert).execute()

            if not result.data or len(result.data) == 0:
                raise HTTPException(status_code=500, detail="Failed to create document")

            created_doc = result.data[0]

            # Create initial version snapshot
            await self._create_version_snapshot(
                document_id=UUID(created_doc['id']),
                version=1,
                title=created_doc['title'],
                content=created_doc['content'],
                content_type=created_doc['content_type'],
                metadata=created_doc['metadata'],
                created_by=user_id
            )

            logger.info(f"Created document {created_doc['id']} for account {account_id}")
            return DocumentResponse(**created_doc)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating document: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create document: {str(e)}")

    async def get_document(
        self,
        document_id: UUID,
        account_id: UUID
    ) -> DocumentResponse:
        """
        Get a document by ID

        Args:
            document_id: Document ID
            account_id: Account ID for permission check

        Returns:
            Document data
        """
        client = await self._get_client()

        doc_data = await self._check_document_access(client, document_id, account_id)

        if not doc_data:
            raise HTTPException(status_code=404, detail="Document not found")

        return DocumentResponse(**doc_data)

    async def update_document(
        self,
        document_id: UUID,
        update_data: DocumentUpdate,
        account_id: UUID,
        user_id: UUID
    ) -> DocumentResponse:
        """
        Update a document with version control and conflict detection

        Args:
            document_id: Document ID
            update_data: Update data
            account_id: Account ID for permission check
            user_id: User ID performing the update

        Returns:
            Updated document

        Raises:
            HTTPException: 404 if not found, 409 if conflict detected, 412 if precondition failed
        """
        client = await self._get_client()

        # Get current document
        current_doc = await self._check_document_access(client, document_id, account_id)

        if not current_doc:
            raise HTTPException(status_code=404, detail="Document not found")

        # Check for conflicts using ETag
        if update_data.if_match:
            current_etag = current_doc.get('etag')
            if current_etag != update_data.if_match:
                logger.warning(
                    f"Document conflict detected for {document_id}: "
                    f"expected {update_data.if_match}, got {current_etag}"
                )
                conflict_error = ConflictError(
                    message="Document has been modified by another user",
                    current_etag=current_etag,
                    current_version=current_doc['version'],
                    provided_etag=update_data.if_match
                )
                raise HTTPException(
                    status_code=409,
                    detail=conflict_error.model_dump()
                )

        # Prepare update data
        update_dict = {}

        if update_data.title is not None:
            update_dict['title'] = update_data.title

        if update_data.content is not None:
            # Sanitize content
            content_type = update_data.content_type or current_doc.get('content_type', 'text/plain')
            update_dict['content'] = self._sanitize_content(update_data.content, content_type)

        if update_data.content_type is not None:
            update_dict['content_type'] = update_data.content_type

        if update_data.metadata is not None:
            update_dict['metadata'] = update_data.metadata

        if update_data.tags is not None:
            update_dict['tags'] = update_data.tags

        if update_data.status is not None:
            update_dict['status'] = update_data.status.value

        # Increment version
        new_version = current_doc['version'] + 1
        update_dict['version'] = new_version
        update_dict['updated_by'] = str(user_id)
        update_dict['parent_version_id'] = current_doc['id']

        try:
            # Update document
            result = await client.table('documents').update(update_dict).eq(
                'id', str(document_id)
            ).execute()

            if not result.data or len(result.data) == 0:
                raise HTTPException(status_code=500, detail="Failed to update document")

            updated_doc = result.data[0]

            # Create version snapshot
            await self._create_version_snapshot(
                document_id=document_id,
                version=new_version,
                title=updated_doc['title'],
                content=updated_doc['content'],
                content_type=updated_doc['content_type'],
                metadata=updated_doc['metadata'],
                created_by=user_id
            )

            logger.info(
                f"Updated document {document_id} to version {new_version} by user {user_id}"
            )
            return DocumentResponse(**updated_doc)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating document: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to update document: {str(e)}")

    async def delete_document(
        self,
        document_id: UUID,
        account_id: UUID,
        user_id: UUID,
        hard_delete: bool = False
    ) -> dict:
        """
        Delete a document (soft delete by default)

        Args:
            document_id: Document ID
            account_id: Account ID for permission check
            user_id: User ID performing the deletion
            hard_delete: If True, permanently delete. If False, soft delete.

        Returns:
            Deletion confirmation
        """
        client = await self._get_client()

        # Check access
        doc_data = await self._check_document_access(client, document_id, account_id)
        if not doc_data:
            raise HTTPException(status_code=404, detail="Document not found")

        try:
            if hard_delete:
                # Hard delete
                await client.table('documents').delete().eq('id', str(document_id)).execute()
                logger.info(f"Hard deleted document {document_id}")
                return {"message": "Document permanently deleted", "id": str(document_id)}
            else:
                # Soft delete
                await client.table('documents').update({
                    'deleted_at': datetime.now(timezone.utc).isoformat(),
                    'status': DocumentStatus.DELETED.value,
                    'updated_by': str(user_id)
                }).eq('id', str(document_id)).execute()

                logger.info(f"Soft deleted document {document_id}")
                return {"message": "Document deleted", "id": str(document_id)}

        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")

    async def list_documents(
        self,
        account_id: UUID,
        page: int = 1,
        page_size: int = 20,
        status: Optional[DocumentStatus] = None,
        tags: Optional[List[str]] = None
    ) -> Tuple[List[DocumentResponse], int]:
        """
        List documents with pagination and filtering

        Args:
            account_id: Account ID
            page: Page number (1-indexed)
            page_size: Number of items per page
            status: Filter by status
            tags: Filter by tags

        Returns:
            Tuple of (list of documents, total count)
        """
        client = await self._get_client()

        try:
            # Build query
            query = client.table('documents').select(
                '*',
                count='exact'
            ).eq(
                'account_id', str(account_id)
            ).is_(
                'deleted_at', 'null'
            )

            if status:
                query = query.eq('status', status.value)

            if tags:
                # Filter by tags (PostgreSQL array contains)
                for tag in tags:
                    query = query.contains('tags', [tag])

            # Calculate offset
            offset = (page - 1) * page_size

            # Execute query with pagination
            query = query.order('created_at', desc=True).range(offset, offset + page_size - 1)
            result = await query.execute()

            documents = [DocumentResponse(**doc) for doc in result.data]
            total = result.count or 0

            return documents, total

        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")

    async def get_document_versions(
        self,
        document_id: UUID,
        account_id: UUID
    ) -> List[DocumentVersionResponse]:
        """
        Get version history for a document

        Args:
            document_id: Document ID
            account_id: Account ID for permission check

        Returns:
            List of document versions
        """
        client = await self._get_client()

        # Check access
        doc_data = await self._check_document_access(client, document_id, account_id)
        if not doc_data:
            raise HTTPException(status_code=404, detail="Document not found")

        try:
            result = await client.table('document_versions').select('*').eq(
                'document_id', str(document_id)
            ).order('version', desc=True).execute()

            versions = [DocumentVersionResponse(**v) for v in result.data]
            return versions

        except Exception as e:
            logger.error(f"Error fetching document versions: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch versions: {str(e)}")

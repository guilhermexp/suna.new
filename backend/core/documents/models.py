"""
Document Management Models and Schemas
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class DocumentStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class DocumentBase(BaseModel):
    """Base document schema"""
    title: str = Field(..., max_length=500, description="Document title")
    content: str = Field(..., description="Document content")
    content_type: str = Field(default="text/plain", max_length=100, description="MIME type of content")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    tags: List[str] = Field(default_factory=list, description="Document tags for categorization")


class DocumentCreate(DocumentBase):
    """Schema for creating a new document"""
    pass


class DocumentUpdate(BaseModel):
    """Schema for updating a document"""
    title: Optional[str] = Field(None, max_length=500, description="Document title")
    content: Optional[str] = Field(None, description="Document content")
    content_type: Optional[str] = Field(None, max_length=100, description="MIME type of content")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    tags: Optional[List[str]] = Field(None, description="Document tags")
    status: Optional[DocumentStatus] = Field(None, description="Document status")
    if_match: Optional[str] = Field(None, description="ETag for optimistic locking")

    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        if v is not None and len(v) > 10_000_000:  # 10MB limit
            raise ValueError("Content exceeds maximum size of 10MB")
        return v


class DocumentResponse(DocumentBase):
    """Schema for document response"""
    id: UUID
    version: int
    account_id: UUID
    created_by: UUID
    updated_by: UUID
    status: DocumentStatus
    etag: str
    last_modified_at: datetime
    created_at: datetime
    updated_at: datetime
    parent_version_id: Optional[UUID] = None

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Schema for paginated document list"""
    documents: List[DocumentResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class DocumentVersionResponse(BaseModel):
    """Schema for document version history"""
    id: UUID
    document_id: UUID
    version: int
    title: str
    content: str
    content_type: str
    metadata: Dict[str, Any]
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ConflictError(BaseModel):
    """Schema for conflict error response"""
    error: str = "conflict"
    message: str
    current_etag: str
    current_version: int
    provided_etag: Optional[str] = None

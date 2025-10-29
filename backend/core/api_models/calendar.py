"""Calendar-related API models."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Import PaginationInfo from common
from .common import PaginationInfo


class CalendarEventCreateRequest(BaseModel):
    """Request model for creating a new calendar event."""
    title: str = Field(..., min_length=1, max_length=255, description="Event title")
    description: Optional[str] = Field(None, description="Optional event description")
    location: Optional[str] = Field(None, max_length=255, description="Optional event location")
    start_date: datetime = Field(..., description="Event start date and time")
    end_date: Optional[datetime] = Field(None, description="Optional event end date and time")
    is_all_day: bool = Field(False, description="Whether the event is an all-day event")
    category: str = Field("other", description="Event category: meeting, work, personal, other")
    color: Optional[str] = Field("#6B7280", description="Hex color code for event display")


class CalendarEventUpdateRequest(BaseModel):
    """Request model for updating an existing calendar event."""
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Event title")
    description: Optional[str] = Field(None, description="Optional event description")
    location: Optional[str] = Field(None, max_length=255, description="Optional event location")
    start_date: Optional[datetime] = Field(None, description="Event start date and time")
    end_date: Optional[datetime] = Field(None, description="Optional event end date and time")
    is_all_day: Optional[bool] = Field(None, description="Whether the event is an all-day event")
    category: Optional[str] = Field(None, description="Event category: meeting, work, personal, other")
    color: Optional[str] = Field(None, description="Hex color code for event display")


class CalendarEventResponse(BaseModel):
    """Response model for calendar event information."""
    id: str
    title: str
    description: Optional[str]
    location: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]
    is_all_day: bool
    category: str
    color: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class CalendarEventsResponse(BaseModel):
    """Response model for list of calendar events with pagination."""
    events: List[CalendarEventResponse]
    pagination: PaginationInfo

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query

from core.utils.auth_utils import verify_and_get_user_id_from_jwt
from core.utils.logger import logger

from .api_models.calendar import (
    CalendarEventCreateRequest,
    CalendarEventUpdateRequest,
    CalendarEventResponse,
    CalendarEventsResponse,
    PaginationInfo
)
from .services.supabase import DBConnection

router = APIRouter()


@router.post("/events", response_model=CalendarEventResponse)
async def create_event(
    event_data: CalendarEventCreateRequest,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Create a new calendar event."""
    logger.debug(f"Creating calendar event for user: {user_id}")

    try:
        db = DBConnection()
        client = await db.client
        
        # Validate end_date if provided
        if event_data.end_date and event_data.end_date < event_data.start_date:
            raise HTTPException(status_code=400, detail="end_date must be after start_date")
        
        # Validate category
        valid_categories = ['meeting', 'work', 'personal', 'other']
        if event_data.category not in valid_categories:
            raise HTTPException(status_code=400, detail=f"category must be one of: {', '.join(valid_categories)}")
        
        # Create event record
        event_record = {
            "title": event_data.title,
            "description": event_data.description,
            "location": event_data.location,
            "start_date": event_data.start_date.isoformat(),
            "end_date": event_data.end_date.isoformat() if event_data.end_date else None,
            "is_all_day": event_data.is_all_day,
            "category": event_data.category,
            "color": event_data.color,
            "user_id": user_id
        }
        
        result = await client.table('calendar_events').insert(event_record).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create calendar event")
        
        event = result.data[0]
        
        logger.info(f"Calendar event created successfully: {event['id']} for user {user_id}")
        return CalendarEventResponse(**event)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating calendar event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events", response_model=CalendarEventsResponse)
async def get_events(
    start_date: str = Query(..., description="Start date in ISO 8601 format"),
    end_date: str = Query(..., description="End date in ISO 8601 format"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(100, ge=1, le=500, description="Items per page"),
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Get calendar events for the authenticated user with filtering and pagination."""
    logger.debug(f"Getting calendar events for user: {user_id}, start: {start_date}, end: {end_date}")

    try:
        db = DBConnection()
        client = await db.client
        
        # Parse dates
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
        
        # Build query
        query = client.table('calendar_events').select("*").eq("user_id", user_id)
        
        # Filter by date range
        query = query.gte("start_date", start_dt.isoformat())
        query = query.lte("start_date", end_dt.isoformat())
        
        # Filter by category if provided
        if category and category != 'all':
            query = query.eq("category", category)
        
        # Search in title and description if provided
        if search:
            query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")
        
        # Order by start_date
        query = query.order("start_date")
        
        # Get total count
        count_query = client.table('calendar_events').select("id", count="exact").eq("user_id", user_id)
        count_query = count_query.gte("start_date", start_dt.isoformat())
        count_query = count_query.lte("start_date", end_dt.isoformat())
        
        if category and category != 'all':
            count_query = count_query.eq("category", category)
        
        if search:
            count_query = count_query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")
        
        try:
            count_result = await count_query.execute()
            total_items = count_result.count or 0
        except Exception as exc:
            logger.debug(f"Unable to count events for user {user_id}, defaulting to 0: {exc}")
            total_items = 0
        
        # Apply pagination
        offset = (page - 1) * per_page
        query = query.range(offset, offset + per_page - 1)
        
        result = await query.execute()
        
        if not result.data:
            return CalendarEventsResponse(
                events=[],
                pagination=PaginationInfo(
                    current_page=page,
                    page_size=per_page,
                    total_items=0,
                    total_pages=0,
                    has_next=False,
                    has_previous=False
                )
            )
        
        events = [CalendarEventResponse(**event) for event in result.data]
        
        # Calculate pagination info
        total_pages = (total_items + per_page - 1) // per_page if total_items else 0
        
        logger.info(f"Retrieved {len(events)} calendar events for user {user_id}")
        
        return CalendarEventsResponse(
            events=events,
            pagination=PaginationInfo(
                current_page=page,
                page_size=per_page,
                total_items=total_items,
                total_pages=total_pages,
                has_next=page < total_pages,
                has_previous=page > 1
            )
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting calendar events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events/{event_id}", response_model=CalendarEventResponse)
async def get_event(
    event_id: str,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Get a specific calendar event by ID."""
    logger.debug(f"Getting calendar event {event_id} for user: {user_id}")

    try:
        db = DBConnection()
        client = await db.client
        
        result = await client.table('calendar_events').select("*").eq("id", event_id).eq("user_id", user_id).maybe_single().execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Event not found")
        
        logger.info(f"Retrieved calendar event {event_id} for user {user_id}")
        return CalendarEventResponse(**result.data)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting calendar event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/events/{event_id}", response_model=CalendarEventResponse)
async def update_event(
    event_id: str,
    event_data: CalendarEventUpdateRequest,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Update an existing calendar event."""
    logger.debug(f"Updating calendar event {event_id} for user: {user_id}")

    try:
        db = DBConnection()
        client = await db.client
        
        # Check if event exists and user has permission
        existing = await client.table('calendar_events').select("*").eq("id", event_id).eq("user_id", user_id).maybe_single().execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Build update data with only non-None fields
        update_data = {}
        if event_data.title is not None:
            update_data["title"] = event_data.title
        if event_data.description is not None:
            update_data["description"] = event_data.description
        if event_data.location is not None:
            update_data["location"] = event_data.location
        if event_data.start_date is not None:
            update_data["start_date"] = event_data.start_date.isoformat()
        if event_data.end_date is not None:
            update_data["end_date"] = event_data.end_date.isoformat()
        if event_data.is_all_day is not None:
            update_data["is_all_day"] = event_data.is_all_day
        if event_data.category is not None:
            valid_categories = ['meeting', 'work', 'personal', 'other']
            if event_data.category not in valid_categories:
                raise HTTPException(status_code=400, detail=f"category must be one of: {', '.join(valid_categories)}")
            update_data["category"] = event_data.category
        if event_data.color is not None:
            update_data["color"] = event_data.color
        
        if not update_data:
            # No updates needed, return existing event
            return CalendarEventResponse(**existing.data)
        
        # Validate dates if both are being updated
        if "start_date" in update_data and "end_date" in update_data:
            if update_data["end_date"] and update_data["end_date"] < update_data["start_date"]:
                raise HTTPException(status_code=400, detail="end_date must be after start_date")
        
        # Update event
        result = await client.table('calendar_events').update(update_data).eq("id", event_id).eq("user_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update calendar event")
        
        event = result.data[0]
        
        logger.info(f"Calendar event {event_id} updated successfully for user {user_id}")
        return CalendarEventResponse(**event)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating calendar event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/events/{event_id}")
async def delete_event(
    event_id: str,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Delete a calendar event."""
    logger.debug(f"Deleting calendar event {event_id} for user: {user_id}")

    try:
        db = DBConnection()
        client = await db.client
        
        # Check if event exists and user has permission
        existing = await client.table('calendar_events').select("*").eq("id", event_id).eq("user_id", user_id).maybe_single().execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Delete event
        await client.table('calendar_events').delete().eq("id", event_id).eq("user_id", user_id).execute()
        
        logger.info(f"Calendar event {event_id} deleted successfully for user {user_id}")
        return {"message": "Event deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting calendar event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

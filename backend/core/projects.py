from typing import Optional, List, Dict
import re
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query

from core.utils.auth_utils import verify_and_get_user_id_from_jwt
from core.utils.logger import logger
from core.utils.pagination import PaginationParams
from core.utils.config import config, EnvMode

from .api_models import (
    ProjectCreateRequest, ProjectUpdateRequest, ProjectResponse, ProjectsResponse,
    KanbanTaskCreateRequest, KanbanTaskUpdateRequest, KanbanTaskResponse, KanbanTasksResponse,
    ProjectIconGenerationRequest, ProjectIconGenerationResponse,
    TaskBulkUpdateRequest, TaskBulkUpdateResponse,
    PaginationInfo
)
from .services.supabase import DBConnection

_OPTIONAL_PROJECT_COLUMNS = {
    "description",
    "icon_name",
    "icon_color",
    "icon_background",
    "settings",
    "is_archived",
    "is_public",
}

router = APIRouter()


@router.post("/projects", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreateRequest,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Create a new project."""
    logger.debug(f"Creating project for user: {user_id}")

    try:
        db = DBConnection()
        client = await db.client
        
        # Create project record
        project_record = {
            "name": project_data.name,
            "description": project_data.description,
            "user_id": user_id,
            "icon_name": project_data.icon_name,
            "icon_color": project_data.icon_color,
            "icon_background": project_data.icon_background,
            "is_public": project_data.is_public,
            "settings": project_data.settings,
            "is_archived": False
        }

        project = await _create_project_record(client, project_record)

        logger.info(f"Project created successfully: {project['id']} for user {user_id}")
        return ProjectResponse(**project)

    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects", response_model=ProjectsResponse)
async def get_projects(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term"),
    is_archived: Optional[bool] = Query(None, description="Filter by archived status"),
    is_public: Optional[bool] = Query(None, description="Filter by public status"),
    sort_by: Optional[str] = Query("updated_at", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Get projects for the authenticated user with pagination and filtering."""
    logger.debug(f"Getting projects for user: {user_id}, page: {page}, per_page: {per_page}")

    try:
        db = DBConnection()
        client = await db.client
        # Build query without relying on related table subselects
        query = client.table('kanban_projects').select("*").eq("user_id", user_id)

        # Apply filters
        if is_archived is not None:
            query = query.eq("is_archived", is_archived)

        if is_public is not None:
            query = query.eq("is_public", is_public)

        if search:
            query = query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")

        # Apply sorting
        if sort_order.lower() == "asc":
            query = query.order(sort_by)
        else:
            query = query.order(sort_by, desc=True)

        # Get total count
        count_query = client.table('kanban_projects').select("id", count="exact").eq("user_id", user_id)

        if is_archived is not None:
            count_query = count_query.eq("is_archived", is_archived)

        if is_public is not None:
            count_query = count_query.eq("is_public", is_public)

        if search:
            count_query = count_query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")

        total_items = 0
        try:
            count_result = await count_query.execute()
            total_items = count_result.count or 0
        except Exception as exc:
            logger.debug(f"Unable to count projects for user {user_id}, defaulting to 0: {exc}")

        # Apply pagination
        offset = (page - 1) * per_page
        query = query.range(offset, offset + per_page - 1)

        try:
            result = await query.execute()
            project_rows = result.data or []
        except Exception as exc:
            missing_column = _extract_missing_column_name(exc)
            if missing_column:
                logger.warning(
                    "Projects query failed because column '%s' is missing; "
                    "returning empty result. Apply migrations to restore the column.",
                    missing_column,
                )
            else:
                logger.debug(f"Unable to load projects for user {user_id}, returning empty list: {exc}")
            return ProjectsResponse(
                projects=[],
                pagination=PaginationInfo(
                    current_page=page,
                    page_size=per_page,
                    total_items=0,
                    total_pages=0,
                    has_next=False,
                    has_previous=False
                )
            )

        projects = []
        for project in project_rows:
            sanitized = _apply_project_defaults(project)
            sanitized['task_count'] = 0
            projects.append(ProjectResponse(**sanitized))

        # Calculate pagination info
        total_pages = (total_items + per_page - 1) // per_page if total_items else 0

        logger.info(f"Retrieved {len(projects)} projects for user {user_id}")

        return ProjectsResponse(
            projects=projects,
            pagination=PaginationInfo(
                current_page=page,
                page_size=per_page,
                total_items=total_items,
                total_pages=total_pages,
                has_next=page < total_pages,
                has_previous=page > 1
            )
        )
    except Exception as e:
        logger.error(f"Error getting projects: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Get a specific project by ID."""
    logger.debug(f"Getting project {project_id} for user: {user_id}")

    try:
        db = DBConnection()
        client = await db.client
        # Get project with task count
        try:
            result = await client.table('kanban_projects').select("*").eq("id", project_id).eq("user_id", user_id).maybe_single().execute()
        except Exception as exc:
            logger.debug(f"Schema issue while loading project {project_id}: {exc}")
            raise HTTPException(status_code=404, detail="Project not found")

        if not result.data:
            raise HTTPException(status_code=404, detail="Project not found")

        try:
            task_count = await _get_project_task_count(db, project_id)
        except Exception as exc:
            logger.debug(f"Failed to load task_count for project {project_id}: {exc}")
            task_count = 0

        sanitized = _apply_project_defaults(result.data)
        sanitized['task_count'] = task_count

        logger.info(f"Retrieved project {project_id} for user {user_id}")
        return ProjectResponse(**sanitized)

    except HTTPException:
            raise
    except Exception as e:
            logger.error(f"Error getting project {project_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))


@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdateRequest,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Update an existing project."""
    logger.debug(f"Updating project {project_id} for user: {user_id}")

    try:
        db = DBConnection()
        client = await db.client
        # Check if project exists and user has permission
        try:
            existing = await client.table('kanban_projects').select("*").eq("id", project_id).eq("user_id", user_id).maybe_single().execute()
        except Exception as exc:
            logger.debug(f"Schema issue while loading project {project_id} for update: {exc}")
            raise HTTPException(status_code=404, detail="Project not found")

        if not existing.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Build update data with only non-None fields
        update_data = {}
        if project_data.name is not None:
            update_data["name"] = project_data.name
        if project_data.description is not None:
            update_data["description"] = project_data.description
        if project_data.icon_name is not None:
            update_data["icon_name"] = project_data.icon_name
        if project_data.icon_color is not None:
            update_data["icon_color"] = project_data.icon_color
        if project_data.icon_background is not None:
            update_data["icon_background"] = project_data.icon_background
        if project_data.is_archived is not None:
            update_data["is_archived"] = project_data.is_archived
        if project_data.is_public is not None:
            update_data["is_public"] = project_data.is_public
        if project_data.settings is not None:
            update_data["settings"] = project_data.settings

        if not update_data:
            # No updates needed, return existing project
            try:
                task_count = await _get_project_task_count(db, project_id)
            except Exception as exc:
                logger.debug(f"Failed to load task_count for project {project_id}: {exc}")
                task_count = 0
            sanitized_existing = _apply_project_defaults(existing.data)
            sanitized_existing['task_count'] = task_count
            return ProjectResponse(**sanitized_existing)

        # Update project
        project = await _update_project_record(client, project_id, user_id, update_data)

        try:
            task_count = await _get_project_task_count(db, project_id)
        except Exception as exc:
            logger.debug(f"Failed to load task_count for project {project_id}: {exc}")
            task_count = 0

        sanitized = _apply_project_defaults(project)
        sanitized['task_count'] = task_count

        logger.info(f"Project {project_id} updated successfully for user {user_id}")
        return ProjectResponse(**sanitized)

    except HTTPException:
            raise
    except Exception as e:
            logger.error(f"Error updating project {project_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Delete a project and all its tasks."""
    logger.debug(f"Deleting project {project_id} for user: {user_id}")

    try:
        db = DBConnection()
        client = await db.client
        # Check if project exists and user has permission
        existing = await client.table('kanban_projects').select("*").eq("id", project_id).eq("user_id", user_id).maybe_single().execute()

        if not existing.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Delete project (cascade will delete tasks)
        await client.table('kanban_projects').delete().eq("id", project_id).eq("user_id", user_id).execute()

        logger.info(f"Project {project_id} deleted successfully for user {user_id}")
        return {"message": "Project deleted successfully"}

    except HTTPException:
            raise
    except Exception as e:
            logger.error(f"Error deleting project {project_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/generate-icon", response_model=ProjectIconGenerationResponse)
async def generate_project_icon(
    request: ProjectIconGenerationRequest,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Generate icon and colors for a project based on name and description."""
    logger.debug(f"Generating icon for project: {request.name}")

    try:
        # Simple icon generation logic - can be enhanced with AI in the future
        icon_name = _generate_icon_name(request.name, request.description)
        icon_color, icon_background = _generate_icon_colors(request.name)

        logger.info(f"Generated icon for project {request.name}: {icon_name}")

        return ProjectIconGenerationResponse(
            icon_name=icon_name,
            icon_color=icon_color,
            icon_background=icon_background
        )

    except Exception as e:
        logger.error(f"Error generating project icon: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def _create_project_record(client, project_record: Dict[str, object]) -> Dict[str, object]:
    """Insert a project record, dropping missing columns as needed."""
    pending_record = dict(project_record)
    while True:
        try:
            result = await client.table('kanban_projects').insert(pending_record).execute()
        except Exception as exc:
            missing_column = _extract_missing_column_name(exc)
            if missing_column and missing_column in pending_record:
                if missing_column not in _OPTIONAL_PROJECT_COLUMNS:
                    detail = (
                        f"Projects table is missing required column '{missing_column}'. "
                        "Run the latest database migrations to add it."
                    )
                    logger.error(detail)
                    raise HTTPException(status_code=500, detail=detail)
                logger.warning(f"Column '{missing_column}' missing in projects table; omitting for insert.")
                pending_record.pop(missing_column, None)
                continue
            raise

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create project")

        project = _apply_project_defaults(result.data[0])
        project['task_count'] = 0
        return project


async def _update_project_record(client, project_id: str, user_id: str, update_data: Dict[str, object]) -> Dict[str, object]:
    """Update a project record, ignoring fields for missing columns."""
    pending_update = dict(update_data)

    while True:
        try:
            result = await client.table('kanban_projects').update(pending_update).eq("id", project_id).eq("user_id", user_id).execute()
        except Exception as exc:
            missing_column = _extract_missing_column_name(exc)
            if missing_column and missing_column in pending_update:
                if missing_column not in _OPTIONAL_PROJECT_COLUMNS:
                    detail = (
                        f"Projects table is missing required column '{missing_column}'. "
                        "Run the latest database migrations to add it."
                    )
                    logger.error(detail)
                    raise HTTPException(status_code=500, detail=detail)
                logger.warning(f"Column '{missing_column}' missing in projects table; omitting from update.")
                pending_update.pop(missing_column, None)
                if not pending_update:
                    try:
                        fetch = await client.table('kanban_projects').select("*").eq("id", project_id).eq("user_id", user_id).maybe_single().execute()
                    except Exception as fetch_exc:
                        logger.debug(f"Schema issue while reloading project {project_id} after update fallback: {fetch_exc}")
                        raise HTTPException(status_code=404, detail="Project not found")
                    if not fetch.data:
                        raise HTTPException(status_code=404, detail="Project not found after update fallback")
                    return fetch.data
                continue
            raise

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update project")

        return result.data[0]


def _apply_project_defaults(project: Dict[str, object]) -> Dict[str, object]:
    """Ensure required project fields exist even if schema columns are missing."""
    sanitized = dict(project)
    sanitized.setdefault("description", None)
    sanitized["icon_name"] = sanitized.get("icon_name") or "folder"
    sanitized["icon_color"] = sanitized.get("icon_color") or "#000000"
    sanitized["icon_background"] = sanitized.get("icon_background") or "#F3F4F6"
    sanitized["is_archived"] = sanitized.get("is_archived") if sanitized.get("is_archived") is not None else False
    sanitized["is_public"] = sanitized.get("is_public") if sanitized.get("is_public") is not None else False
    sanitized["settings"] = sanitized.get("settings") or {}
    if "created_at" not in sanitized or sanitized.get("created_at") is None:
        sanitized["created_at"] = datetime.utcnow()
    if "updated_at" not in sanitized or sanitized.get("updated_at") is None:
        sanitized["updated_at"] = datetime.utcnow()
    return sanitized


def _extract_missing_column_name(exc: Exception) -> Optional[str]:
    """Parse Supabase/PostgREST error messages for missing column details."""
    message = getattr(exc, "message", None) or str(exc)
    lowered = message.lower()
    if "could not find" not in lowered or "column" not in lowered:
        return None
    match = re.search(r"'([^']+)' column", message)
    return match.group(1) if match else None


async def _get_project_task_count(db, project_id: str) -> int:
    """Get the number of tasks in a project."""
    try:
        client = await db.client
        result = await client.table('kanban_tasks').select("id", count="exact").eq("project_id", project_id).execute()
        return result.count or 0
    except Exception as exc:
        logger.debug(f"Falling back to task_count=0 for project {project_id}: {exc}")
        return 0


def _generate_icon_name(name: str, description: Optional[str] = None) -> str:
    """Generate an appropriate icon name based on project name/description."""
    name_lower = name.lower()
    desc_lower = description.lower() if description else ""

    # Common project type keywords and their corresponding icons
    icon_mapping = {
        'website': 'globe',
        'app': 'smartphone',
        'mobile': 'smartphone',
        'design': 'palette',
        'development': 'code',
        'research': 'search',
        'marketing': 'megaphone',
        'sales': 'trending-up',
        'finance': 'dollar-sign',
        'education': 'graduation-cap',
        'health': 'heart',
        'game': 'gamepad-2',
        'api': 'plug',
        'database': 'database',
        'security': 'shield',
        'analytics': 'bar-chart',
        'blog': 'file-text',
        'ecommerce': 'shopping-cart',
        'social': 'users',
        'video': 'video',
        'music': 'music',
        'photo': 'image',
        'book': 'book-open',
        'event': 'calendar',
        'travel': 'plane',
        'food': 'utensils',
        'sport': 'trophy',
        'home': 'home',
        'garden': 'trees',
        'pet': 'heart',
        'car': 'car',
        'tech': 'cpu',
        'ai': 'brain',
        'ml': 'brain',
        'blockchain': 'link',
        'cloud': 'cloud',
        'iot': 'wifi',
        'robot': 'bot',
    }

    # Check for keywords in name and description
    for keyword, icon in icon_mapping.items():
        if keyword in name_lower or keyword in desc_lower:
            return icon

    # Default icons based on name characteristics
    if any(word in name_lower for word in ['todo', 'task', 'list']):
        return 'check-square'
    elif any(word in name_lower for word in ['plan', 'strategy', 'roadmap']):
        return 'map'
    elif any(word in name_lower for word in ['team', 'group', 'collab']):
        return 'users'
    elif any(word in name_lower for word in ['idea', 'concept', 'innovation']):
        return 'lightbulb'

    # Default fallback
    return 'folder'


def _generate_icon_colors(name: str) -> tuple[str, str]:
    """Generate icon and background colors based on project name."""
    # Simple hash-based color generation
    hash_value = sum(ord(char) for char in name)

    # Predefined color combinations
    color_combinations = [
        ('#000000', '#F3F4F6'),  # Black on light gray
        ('#1E40AF', '#DBEAFE'),  # Blue on light blue
        ('#166534', '#DCFCE7'),  # Green on light green
        ('#9333EA', '#F3E8FF'),  # Purple on light purple
        ('#DC2626', '#FEE2E2'),  # Red on light red
        ('#EA580C', '#FED7AA'),  # Orange on light orange
        ('#0891B2', '#CFFAFE'),  # Cyan on light cyan
        ('#7C3AED', '#EDE9FE'),  # Violet on light violet
        ('#BE123C', '#FCE7F3'),  # Pink on light pink
        ('#0F766E', '#CCFBF1'),  # Teal on light teal
    ]

    # Select color based on hash
    index = hash_value % len(color_combinations)
    return color_combinations[index]


# ============================================================================
# KANBAN TASKS ENDPOINTS
# ============================================================================

@router.post("/projects/{project_id}/tasks", response_model=KanbanTaskResponse)
async def create_kanban_task(
    project_id: str,
    task_data: KanbanTaskCreateRequest,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Create a new kanban task in a project."""
    logger.debug(f"Creating kanban task in project {project_id} for user: {user_id}")

    try:
        db = DBConnection()
        client = await db.client
        # Verify project exists and user has permission
        project = await client.table('kanban_projects').select("*").eq("id", project_id).eq("user_id", user_id).maybe_single().execute()

        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Get the next position for this status
        next_position = await _get_next_task_position(db, project_id, task_data.status)

        # Create task record
        task_record = {
            "title": task_data.title,
            "description": task_data.description,
            "project_id": project_id,
            "user_id": user_id,
            "status": task_data.status,
            "priority": task_data.priority,
            "position": task_data.position if task_data.position > 0 else next_position,
            "assigned_to": task_data.assigned_to,
            "due_date": task_data.due_date.isoformat() if task_data.due_date else None,
            "tags": task_data.tags,
            "metadata": task_data.metadata,
            "icon_name": task_data.icon_name,
            "icon_color": task_data.icon_color,
            "icon_background": task_data.icon_background
        }

        result = await client.table('kanban_tasks').insert(task_record).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create kanban task")

        task = result.data[0]

        logger.info(f"Kanban task created successfully: {task['id']} in project {project_id}")
        return KanbanTaskResponse(**task)

    except HTTPException:
            raise
    except Exception as e:
            logger.error(f"Error creating kanban task: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/tasks", response_model=KanbanTasksResponse)
async def get_kanban_tasks(
    project_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    assigned_to: Optional[str] = Query(None, description="Filter by assigned user"),
    search: Optional[str] = Query(None, description="Search term"),
    sort_by: Optional[str] = Query("position", description="Sort field"),
    sort_order: Optional[str] = Query("asc", description="Sort order: asc or desc"),
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Get kanban tasks for a project with pagination and filtering."""
    logger.debug(f"Getting kanban tasks for project {project_id}, user: {user_id}")

    try:
        db = DBConnection()
        client = await db.client
        # Verify project exists and user has permission
        project = await client.table('kanban_projects').select("*").eq("id", project_id).eq("user_id", user_id).maybe_single().execute()

        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Build query
        query = client.table('kanban_tasks').select("*").eq("project_id", project_id)

        # Apply filters
        if status:
            query = query.eq("status", status)

        if priority:
            query = query.eq("priority", priority)

        if assigned_to:
            query = query.eq("assigned_to", assigned_to)

        if search:
            query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")

        # Apply sorting (default: by position within status)
        if sort_by == "position":
            query = query.order("status").order("position")
        elif sort_order.lower() == "asc":
            query = query.order(sort_by)
        else:
            query = query.order(sort_by, desc=True)

        # Get total count
        count_query = client.table('kanban_tasks').select("id", count="exact").eq("project_id", project_id)

        if status:
            count_query = count_query.eq("status", status)

        if priority:
            count_query = count_query.eq("priority", priority)

        if assigned_to:
            count_query = count_query.eq("assigned_to", assigned_to)

        if search:
            count_query = count_query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")

        count_result = await count_query.execute()
        total_items = count_result.count or 0

        # Apply pagination
        offset = (page - 1) * per_page
        query = query.range(offset, offset + per_page - 1)

        result = await query.execute()

        if not result.data:
            return KanbanTasksResponse(
                tasks=[],
                pagination=PaginationInfo(
                    current_page=page,
                    page_size=per_page,
                    total_items=0,
                    total_pages=0,
                    has_next=False,
                    has_previous=False
                )
            )

        tasks = [KanbanTaskResponse(**task) for task in result.data]

        # Calculate pagination info
        total_pages = (total_items + per_page - 1) // per_page

        logger.info(f"Retrieved {len(tasks)} kanban tasks for project {project_id}")

        return KanbanTasksResponse(
            tasks=tasks,
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
            logger.error(f"Error getting kanban tasks: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/tasks/{task_id}", response_model=KanbanTaskResponse)
async def get_kanban_task(
    project_id: str,
    task_id: str,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Get a specific kanban task by ID."""
    logger.debug(f"Getting kanban task {task_id} from project {project_id} for user: {user_id}")

    try:
        db = DBConnection()
        client = await db.client
        # Verify project exists and user has permission
        project = await client.table('kanban_projects').select("*").eq("id", project_id).eq("user_id", user_id).maybe_single().execute()

        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Get task
        result = await client.table('kanban_tasks').select("*").eq("id", task_id).eq("project_id", project_id).maybe_single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Task not found")

        logger.info(f"Retrieved kanban task {task_id} for user {user_id}")
        return KanbanTaskResponse(**result.data)

    except HTTPException:
            raise
    except Exception as e:
            logger.error(f"Error getting kanban task {task_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))


@router.put("/projects/{project_id}/tasks/{task_id}", response_model=KanbanTaskResponse)
async def update_kanban_task(
    project_id: str,
    task_id: str,
    task_data: KanbanTaskUpdateRequest,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Update an existing kanban task."""
    logger.debug(f"Updating kanban task {task_id} in project {project_id} for user: {user_id}")

    try:
        db = DBConnection()
        client = await db.client
        # Verify project exists and user has permission
        project = await client.table('kanban_projects').select("*").eq("id", project_id).eq("user_id", user_id).maybe_single().execute()

        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Check if task exists
        existing = await client.table('kanban_tasks').select("*").eq("id", task_id).eq("project_id", project_id).maybe_single().execute()

        if not existing.data:
            raise HTTPException(status_code=404, detail="Task not found")

        existing_task = existing.data

        # Build update data with only non-None fields
        update_data = {}
        if task_data.title is not None:
            update_data["title"] = task_data.title
        if task_data.description is not None:
            update_data["description"] = task_data.description
        if task_data.status is not None:
            update_data["status"] = task_data.status
            # If status changed, get new position
            if task_data.status != existing_task["status"] and task_data.position is None:
                update_data["position"] = await _get_next_task_position(db, project_id, task_data.status)
        if task_data.priority is not None:
            update_data["priority"] = task_data.priority
        if task_data.position is not None:
            update_data["position"] = task_data.position
        if task_data.assigned_to is not None:
            update_data["assigned_to"] = task_data.assigned_to
        if task_data.due_date is not None:
            update_data["due_date"] = task_data.due_date.isoformat() if task_data.due_date else None
        if task_data.tags is not None:
            update_data["tags"] = task_data.tags
        if task_data.metadata is not None:
            update_data["metadata"] = task_data.metadata
        if task_data.icon_name is not None:
            update_data["icon_name"] = task_data.icon_name
        if task_data.icon_color is not None:
            update_data["icon_color"] = task_data.icon_color
        if task_data.icon_background is not None:
            update_data["icon_background"] = task_data.icon_background

        if not update_data:
            # No updates needed, return existing task
            return KanbanTaskResponse(**existing_task)

        # Update task
        result = await client.table('kanban_tasks').update(update_data).eq("id", task_id).eq("project_id", project_id).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update kanban task")

        task = result.data[0]

        logger.info(f"Kanban task {task_id} updated successfully for user {user_id}")
        return KanbanTaskResponse(**task)

    except HTTPException:
            raise
    except Exception as e:
            logger.error(f"Error updating kanban task {task_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))


@router.delete("/projects/{project_id}/tasks/{task_id}")
async def delete_kanban_task(
    project_id: str,
    task_id: str,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Delete a kanban task."""
    logger.debug(f"Deleting kanban task {task_id} from project {project_id} for user: {user_id}")

    try:
        db = DBConnection()
        client = await db.client
        # Verify project exists and user has permission
        project = await client.table('kanban_projects').select("*").eq("id", project_id).eq("user_id", user_id).maybe_single().execute()

        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Delete task
        await client.table('kanban_tasks').delete().eq("id", task_id).eq("project_id", project_id).execute()

        logger.info(f"Kanban task {task_id} deleted successfully for user {user_id}")
        return {"message": "Task deleted successfully"}

    except HTTPException:
            raise
    except Exception as e:
            logger.error(f"Error deleting kanban task {task_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/tasks/bulk-update", response_model=TaskBulkUpdateResponse)
async def bulk_update_kanban_tasks(
    project_id: str,
    bulk_request: TaskBulkUpdateRequest,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Bulk update multiple kanban tasks."""
    logger.debug(f"Bulk updating {len(bulk_request.task_ids)} tasks in project {project_id} for user: {user_id}")

    try:
        db = DBConnection()
        client = await db.client
        # Verify project exists and user has permission
        project = await client.table('kanban_projects').select("*").eq("id", project_id).eq("user_id", user_id).maybe_single().execute()

        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found")

        updated_count = 0
        failed_tasks = []

        # Build update data
        update_data = {}
        if bulk_request.updates.title is not None:
            update_data["title"] = bulk_request.updates.title
        if bulk_request.updates.description is not None:
            update_data["description"] = bulk_request.updates.description
        if bulk_request.updates.status is not None:
            update_data["status"] = bulk_request.updates.status
        if bulk_request.updates.priority is not None:
            update_data["priority"] = bulk_request.updates.priority
        if bulk_request.updates.assigned_to is not None:
            update_data["assigned_to"] = bulk_request.updates.assigned_to
        if bulk_request.updates.due_date is not None:
            update_data["due_date"] = bulk_request.updates.due_date.isoformat() if bulk_request.updates.due_date else None
        if bulk_request.updates.tags is not None:
            update_data["tags"] = bulk_request.updates.tags
        if bulk_request.updates.metadata is not None:
            update_data["metadata"] = bulk_request.updates.metadata

        # Update each task
        for task_id in bulk_request.task_ids:
            try:
                result = await client.table('kanban_tasks').update(update_data).eq("id", task_id).eq("project_id", project_id).execute()
                if result.data:
                    updated_count += 1
                else:
                    failed_tasks.append(task_id)
            except Exception:
                failed_tasks.append(task_id)

        failed_count = len(failed_tasks)

        logger.info(f"Bulk update completed: {updated_count} updated, {failed_count} failed")

        return TaskBulkUpdateResponse(
            updated_count=updated_count,
            failed_count=failed_count,
            failed_tasks=failed_tasks
        )

    except HTTPException:
            raise
    except Exception as e:
            logger.error(f"Error bulk updating kanban tasks: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))


async def _get_next_task_position(db, project_id: str, status: str) -> int:
    """Get the next position for a task in a specific status column."""
    try:
        client = await db.client
        result = await client.table('kanban_tasks').select("position").eq("project_id", project_id).eq("status", status).order("position", desc=True).limit(1).execute()

        if result.data and len(result.data) > 0:
            return result.data[0]["position"] + 1
        else:
            return 0
    except Exception as exc:
        logger.debug(f"Falling back to position=0 for project {project_id}, status {status}: {exc}")
        return 0

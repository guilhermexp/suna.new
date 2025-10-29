"""Project-related API models."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Import PaginationInfo directly to avoid forward reference issues
from .common import PaginationInfo


class ProjectCreateRequest(BaseModel):
    """Request model for creating a new project."""
    name: str = Field(..., min_length=1, max_length=255, description="Project name")
    description: Optional[str] = Field(None, description="Optional project description")
    icon_name: Optional[str] = Field("folder", description="Lucide React icon name")
    icon_color: Optional[str] = Field("#000000", description="Hex color code for icon")
    icon_background: Optional[str] = Field("#F3F4F6", description="Hex color code for icon background")
    is_public: Optional[bool] = Field(False, description="Whether project is publicly visible")
    settings: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional project settings")


class ProjectUpdateRequest(BaseModel):
    """Request model for updating an existing project."""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Project name")
    description: Optional[str] = Field(None, description="Optional project description")
    icon_name: Optional[str] = Field(None, description="Lucide React icon name")
    icon_color: Optional[str] = Field(None, description="Hex color code for icon")
    icon_background: Optional[str] = Field(None, description="Hex color code for icon background")
    is_archived: Optional[bool] = Field(None, description="Whether project is archived")
    is_public: Optional[bool] = Field(None, description="Whether project is publicly visible")
    settings: Optional[Dict[str, Any]] = Field(None, description="Additional project settings")


class ProjectResponse(BaseModel):
    """Response model for project information."""
    id: str
    name: str
    description: Optional[str]
    user_id: str
    created_at: datetime
    updated_at: datetime
    icon_name: str
    icon_color: str
    icon_background: str
    is_archived: bool
    is_public: bool
    settings: Dict[str, Any]
    task_count: Optional[int] = Field(None, description="Number of tasks in project")


class ProjectsResponse(BaseModel):
    """Response model for list of projects with pagination."""
    projects: List[ProjectResponse]
    pagination: PaginationInfo


class KanbanTaskCreateRequest(BaseModel):
    """Request model for creating a new kanban task."""
    title: str = Field(..., min_length=1, max_length=255, description="Task title")
    description: Optional[str] = Field(None, description="Optional task description")
    status: Optional[str] = Field("todo", description="Task status: todo, in_progress, review, done")
    priority: Optional[str] = Field("medium", description="Task priority: low, medium, high, urgent")
    position: Optional[int] = Field(0, description="Position for ordering within status column")
    assigned_to: Optional[str] = Field(None, description="User ID for task assignment")
    due_date: Optional[datetime] = Field(None, description="Optional due date")
    tags: Optional[List[str]] = Field(default_factory=list, description="Array of tags")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")
    icon_name: Optional[str] = Field(None, description="Optional Lucide React icon name")
    icon_color: Optional[str] = Field(None, description="Optional hex color code for icon")
    icon_background: Optional[str] = Field(None, description="Optional hex color code for icon background")


class KanbanTaskUpdateRequest(BaseModel):
    """Request model for updating an existing kanban task."""
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Task title")
    description: Optional[str] = Field(None, description="Optional task description")
    status: Optional[str] = Field(None, description="Task status: todo, in_progress, review, done")
    priority: Optional[str] = Field(None, description="Task priority: low, medium, high, urgent")
    position: Optional[int] = Field(None, description="Position for ordering within status column")
    assigned_to: Optional[str] = Field(None, description="User ID for task assignment")
    due_date: Optional[datetime] = Field(None, description="Optional due date")
    tags: Optional[List[str]] = Field(None, description="Array of tags")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    icon_name: Optional[str] = Field(None, description="Optional Lucide React icon name")
    icon_color: Optional[str] = Field(None, description="Optional hex color code for icon")
    icon_background: Optional[str] = Field(None, description="Optional hex color code for icon background")


class KanbanTaskResponse(BaseModel):
    """Response model for kanban task information."""
    id: str
    title: str
    description: Optional[str]
    project_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    status: str
    priority: str
    position: int
    assigned_to: Optional[str]
    due_date: Optional[datetime]
    completed_at: Optional[datetime]
    tags: List[str]
    metadata: Dict[str, Any]
    icon_name: Optional[str]
    icon_color: Optional[str]
    icon_background: Optional[str]


class KanbanTasksResponse(BaseModel):
    """Response model for list of kanban tasks with pagination."""
    tasks: List[KanbanTaskResponse]
    pagination: PaginationInfo


class ProjectIconGenerationRequest(BaseModel):
    """Request model for generating project icon and colors."""
    name: str
    description: Optional[str] = None


class ProjectIconGenerationResponse(BaseModel):
    """Response model for generated project icon and colors."""
    icon_name: str
    icon_color: str
    icon_background: str


class TaskBulkUpdateRequest(BaseModel):
    """Request model for bulk updating tasks."""
    task_ids: List[str] = Field(..., description="List of task IDs to update")
    updates: KanbanTaskUpdateRequest = Field(..., description="Updates to apply to all tasks")


class TaskBulkUpdateResponse(BaseModel):
    """Response model for bulk update results."""
    updated_count: int
    failed_count: int
    failed_tasks: List[str] = Field(default_factory=list, description="IDs of tasks that failed to update")
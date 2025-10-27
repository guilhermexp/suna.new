"""
Projects Management Tool

Allows agents to create, update, list, and delete projects and kanban tasks.
This provides programmatic access to the project management system.
"""

from typing import Optional, Dict, Any, List
from core.agentpress.tool import Tool, ToolResult, openapi_schema
from core.utils.logger import logger
from core.services.supabase import DBConnection


class ProjectsManagementTool(Tool):
    """Tool for managing projects and kanban tasks through agent interactions."""

    def __init__(self, db_connection: DBConnection, user_id: str):
        super().__init__()
        self.db = db_connection
        self.user_id = user_id

    # ============ PROJECT METHODS ============

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "create_project",
            "description": "Create a new project for organizing tasks and work. Projects serve as containers for kanban tasks.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The name of the project (required)"
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional description of the project's purpose and goals"
                    },
                    "icon_name": {
                        "type": "string",
                        "description": "Icon name for the project (default: 'folder'). Choose from common options like: folder, briefcase, target, star, rocket, layers, trello, etc.",
                        "default": "folder"
                    },
                    "icon_color": {
                        "type": "string",
                        "description": "Hex color code for the icon (default: '#000000')",
                        "default": "#000000"
                    },
                    "icon_background": {
                        "type": "string",
                        "description": "Hex color code for the icon background (default: '#F3F4F6')",
                        "default": "#F3F4F6"
                    },
                    "is_public": {
                        "type": "boolean",
                        "description": "Whether the project should be public (default: false)",
                        "default": False
                    }
                },
                "required": ["name"]
            }
        }
    })
    async def create_project(
        self,
        name: str,
        description: Optional[str] = None,
        icon_name: str = "folder",
        icon_color: str = "#000000",
        icon_background: str = "#F3F4F6",
        is_public: bool = False
    ) -> ToolResult:
        """Create a new project."""
        try:
            client = await self.db.client

            project_data = {
                "name": name,
                "description": description,
                "user_id": self.user_id,
                "icon_name": icon_name,
                "icon_color": icon_color,
                "icon_background": icon_background,
                "is_public": is_public,
                "is_archived": False,
                "settings": {}
            }

            result = await client.table('kanban_projects').insert(project_data).execute()

            if not result.data:
                return self.fail_response("Failed to create project")

            project = result.data[0]

            success_msg = f"✅ Successfully created project '{name}'!\n\n"
            success_msg += f"**Project Details:**\n"
            success_msg += f"- ID: {project['id']}\n"
            success_msg += f"- Name: {project['name']}\n"
            if description:
                success_msg += f"- Description: {description}\n"
            success_msg += f"- Icon: {icon_name} ({icon_color} on {icon_background})\n"
            success_msg += f"- Public: {'Yes' if is_public else 'No'}\n"
            success_msg += f"- Created: {project['created_at']}\n\n"
            success_msg += "You can now add tasks to this project using `create_kanban_task`."

            return self.success_response({
                "message": success_msg,
                "project": project
            })

        except Exception as e:
            logger.error(f"Failed to create project: {e}", exc_info=True)
            return self.fail_response(f"Failed to create project: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "list_projects",
            "description": "List all projects with optional filtering and pagination. Returns projects ordered by most recently updated first.",
            "parameters": {
                "type": "object",
                "properties": {
                    "search": {
                        "type": "string",
                        "description": "Search term to filter projects by name or description"
                    },
                    "is_archived": {
                        "type": "boolean",
                        "description": "Filter by archived status (true = archived only, false = active only, null = all)"
                    },
                    "is_public": {
                        "type": "boolean",
                        "description": "Filter by public status (true = public only, false = private only, null = all)"
                    },
                    "page": {
                        "type": "integer",
                        "description": "Page number for pagination (default: 1)",
                        "default": 1
                    },
                    "per_page": {
                        "type": "integer",
                        "description": "Number of items per page (default: 20, max: 100)",
                        "default": 20
                    }
                }
            }
        }
    })
    async def list_projects(
        self,
        search: Optional[str] = None,
        is_archived: Optional[bool] = None,
        is_public: Optional[bool] = None,
        page: int = 1,
        per_page: int = 20
    ) -> ToolResult:
        """List projects with filtering and pagination."""
        try:
            client = await self.db.client

            # Build query
            query = client.table('kanban_projects').select("*").eq("user_id", self.user_id)

            # Apply filters
            if is_archived is not None:
                query = query.eq("is_archived", is_archived)
            if is_public is not None:
                query = query.eq("is_public", is_public)
            if search:
                query = query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")

            # Apply pagination
            offset = (page - 1) * per_page
            query = query.order("updated_at", desc=True).range(offset, offset + per_page - 1)

            result = await query.execute()
            projects = result.data or []

            # Get total count
            count_query = client.table('kanban_projects').select("id", count='exact').eq("user_id", self.user_id)
            if is_archived is not None:
                count_query = count_query.eq("is_archived", is_archived)
            if is_public is not None:
                count_query = count_query.eq("is_public", is_public)
            if search:
                count_query = count_query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")

            count_result = await count_query.execute()
            total_items = count_result.count if count_result.count is not None else 0

            response_msg = f"## Projects ({len(projects)} of {total_items})\n\n"

            if not projects:
                response_msg += "No projects found matching your criteria.\n\n"
                response_msg += "Create a new project using `create_project`."
            else:
                for project in projects:
                    response_msg += f"**{project['name']}** (ID: {project['id']})\n"
                    if project.get('description'):
                        response_msg += f"  - Description: {project['description']}\n"
                    response_msg += f"  - Icon: {project['icon_name']}\n"
                    response_msg += f"  - Archived: {'Yes' if project['is_archived'] else 'No'}\n"
                    response_msg += f"  - Public: {'Yes' if project['is_public'] else 'No'}\n"
                    response_msg += f"  - Updated: {project['updated_at']}\n\n"

            return self.success_response({
                "message": response_msg,
                "projects": projects,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total_items": total_items,
                    "total_pages": (total_items + per_page - 1) // per_page
                }
            })

        except Exception as e:
            logger.error(f"Failed to list projects: {e}", exc_info=True)
            return self.fail_response(f"Failed to list projects: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "update_project",
            "description": "Update an existing project's details.",
            "parameters": {
                "type": "object",
                "properties": {
                    "project_id": {
                        "type": "string",
                        "description": "The ID of the project to update"
                    },
                    "name": {
                        "type": "string",
                        "description": "New name for the project"
                    },
                    "description": {
                        "type": "string",
                        "description": "New description for the project"
                    },
                    "icon_name": {
                        "type": "string",
                        "description": "New icon name"
                    },
                    "icon_color": {
                        "type": "string",
                        "description": "New icon color (hex code)"
                    },
                    "icon_background": {
                        "type": "string",
                        "description": "New icon background color (hex code)"
                    },
                    "is_archived": {
                        "type": "boolean",
                        "description": "Archive or unarchive the project"
                    },
                    "is_public": {
                        "type": "boolean",
                        "description": "Make project public or private"
                    }
                },
                "required": ["project_id"]
            }
        }
    })
    async def update_project(
        self,
        project_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        icon_name: Optional[str] = None,
        icon_color: Optional[str] = None,
        icon_background: Optional[str] = None,
        is_archived: Optional[bool] = None,
        is_public: Optional[bool] = None
    ) -> ToolResult:
        """Update an existing project."""
        try:
            client = await self.db.client

            # Verify project exists and belongs to user
            existing = await client.table('kanban_projects').select("*").eq("id", project_id).eq("user_id", self.user_id).execute()
            if not existing.data:
                return self.fail_response("Project not found or access denied")

            # Build update data
            update_data = {}
            updates_made = []

            if name is not None:
                update_data['name'] = name
                updates_made.append(f"Name: '{name}'")
            if description is not None:
                update_data['description'] = description
                updates_made.append("Description updated")
            if icon_name is not None:
                update_data['icon_name'] = icon_name
                updates_made.append(f"Icon: {icon_name}")
            if icon_color is not None:
                update_data['icon_color'] = icon_color
                updates_made.append("Icon color updated")
            if icon_background is not None:
                update_data['icon_background'] = icon_background
                updates_made.append("Icon background updated")
            if is_archived is not None:
                update_data['is_archived'] = is_archived
                updates_made.append(f"Archived: {'Yes' if is_archived else 'No'}")
            if is_public is not None:
                update_data['is_public'] = is_public
                updates_made.append(f"Public: {'Yes' if is_public else 'No'}")

            if not update_data:
                return self.fail_response("No updates provided")

            result = await client.table('kanban_projects').update(update_data).eq("id", project_id).eq("user_id", self.user_id).execute()

            if not result.data:
                return self.fail_response("Failed to update project")

            project = result.data[0]

            success_msg = f"✅ Successfully updated project '{project['name']}'!\n\n"
            success_msg += f"**Changes Made:**\n"
            for update in updates_made:
                success_msg += f"• {update}\n"

            return self.success_response({
                "message": success_msg,
                "project": project
            })

        except Exception as e:
            logger.error(f"Failed to update project: {e}", exc_info=True)
            return self.fail_response(f"Failed to update project: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "delete_project",
            "description": "Delete a project and all its associated tasks. This action cannot be undone.",
            "parameters": {
                "type": "object",
                "properties": {
                    "project_id": {
                        "type": "string",
                        "description": "The ID of the project to delete"
                    }
                },
                "required": ["project_id"]
            }
        }
    })
    async def delete_project(self, project_id: str) -> ToolResult:
        """Delete a project and all its tasks."""
        try:
            client = await self.db.client

            # Verify project exists and belongs to user
            existing = await client.table('kanban_projects').select("name").eq("id", project_id).eq("user_id", self.user_id).execute()
            if not existing.data:
                return self.fail_response("Project not found or access denied")

            project_name = existing.data[0]['name']

            # Delete the project (tasks will be cascade deleted)
            await client.table('kanban_projects').delete().eq("id", project_id).eq("user_id", self.user_id).execute()

            return self.success_response({
                "message": f"✅ Project '{project_name}' and all its tasks have been deleted successfully."
            })

        except Exception as e:
            logger.error(f"Failed to delete project: {e}", exc_info=True)
            return self.fail_response(f"Failed to delete project: {str(e)}")

    # ============ KANBAN TASK METHODS ============

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "create_kanban_task",
            "description": "Create a new task within a project. Tasks can have priorities, due dates, and custom tags.",
            "parameters": {
                "type": "object",
                "properties": {
                    "project_id": {
                        "type": "string",
                        "description": "The ID of the project to add the task to"
                    },
                    "title": {
                        "type": "string",
                        "description": "The title of the task"
                    },
                    "description": {
                        "type": "string",
                        "description": "Detailed description of the task"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["todo", "in_progress", "review", "done"],
                        "description": "Current status of the task (default: 'todo')",
                        "default": "todo"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "urgent"],
                        "description": "Priority level (default: 'medium')",
                        "default": "medium"
                    },
                    "due_date": {
                        "type": "string",
                        "description": "Due date in ISO format (e.g., '2024-12-31')"
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Array of tags for categorization (e.g., ['bug', 'frontend'])"
                    }
                },
                "required": ["project_id", "title"]
            }
        }
    })
    async def create_kanban_task(
        self,
        project_id: str,
        title: str,
        description: Optional[str] = None,
        status: str = "todo",
        priority: str = "medium",
        due_date: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> ToolResult:
        """Create a new kanban task in a project."""
        try:
            client = await self.db.client

            # Verify project exists and belongs to user
            project = await client.table('kanban_projects').select("name").eq("id", project_id).eq("user_id", self.user_id).execute()
            if not project.data:
                return self.fail_response("Project not found or access denied")

            project_name = project.data[0]['name']

            # Get next position in the status column
            max_pos = await client.table('kanban_tasks').select("position").eq("project_id", project_id).eq("status", status).order("position", desc=True).limit(1).execute()
            position = (max_pos.data[0]['position'] + 1) if max_pos.data else 0

            task_data = {
                "project_id": project_id,
                "user_id": self.user_id,
                "title": title,
                "description": description,
                "status": status,
                "priority": priority,
                "position": position,
                "due_date": due_date,
                "tags": tags or [],
                "metadata": {}
            }

            result = await client.table('kanban_tasks').insert(task_data).execute()

            if not result.data:
                return self.fail_response("Failed to create task")

            task = result.data[0]

            success_msg = f"✅ Successfully created task '{title}' in project '{project_name}'!\n\n"
            success_msg += f"**Task Details:**\n"
            success_msg += f"- ID: {task['id']}\n"
            success_msg += f"- Title: {task['title']}\n"
            if description:
                success_msg += f"- Description: {description}\n"
            success_msg += f"- Status: {status}\n"
            success_msg += f"- Priority: {priority}\n"
            if due_date:
                success_msg += f"- Due Date: {due_date}\n"
            if tags:
                success_msg += f"- Tags: {', '.join(tags)}\n"

            return self.success_response({
                "message": success_msg,
                "task": task
            })

        except Exception as e:
            logger.error(f"Failed to create task: {e}", exc_info=True)
            return self.fail_response(f"Failed to create task: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "list_kanban_tasks",
            "description": "List all tasks in a project with optional filtering.",
            "parameters": {
                "type": "object",
                "properties": {
                    "project_id": {
                        "type": "string",
                        "description": "The ID of the project to list tasks from"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["todo", "in_progress", "review", "done"],
                        "description": "Filter by status"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "urgent"],
                        "description": "Filter by priority"
                    },
                    "search": {
                        "type": "string",
                        "description": "Search term to filter tasks by title or description"
                    }
                },
                "required": ["project_id"]
            }
        }
    })
    async def list_kanban_tasks(
        self,
        project_id: str,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None
    ) -> ToolResult:
        """List tasks in a project."""
        try:
            client = await self.db.client

            # Verify project exists and belongs to user
            project = await client.table('kanban_projects').select("name").eq("id", project_id).eq("user_id", self.user_id).execute()
            if not project.data:
                return self.fail_response("Project not found or access denied")

            project_name = project.data[0]['name']

            # Build query
            query = client.table('kanban_tasks').select("*").eq("project_id", project_id)

            if status:
                query = query.eq("status", status)
            if priority:
                query = query.eq("priority", priority)
            if search:
                query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")

            query = query.order("position")

            result = await query.execute()
            tasks = result.data or []

            response_msg = f"## Tasks in '{project_name}' ({len(tasks)} tasks)\n\n"

            if not tasks:
                response_msg += "No tasks found matching your criteria.\n\n"
                response_msg += "Create a new task using `create_kanban_task`."
            else:
                # Group by status
                by_status = {}
                for task in tasks:
                    st = task['status']
                    if st not in by_status:
                        by_status[st] = []
                    by_status[st].append(task)

                for st in ["todo", "in_progress", "review", "done"]:
                    if st in by_status:
                        response_msg += f"### {st.replace('_', ' ').title()}\n\n"
                        for task in by_status[st]:
                            response_msg += f"**{task['title']}** (ID: {task['id']})\n"
                            if task.get('description'):
                                response_msg += f"  - Description: {task['description']}\n"
                            response_msg += f"  - Priority: {task['priority']}\n"
                            if task.get('due_date'):
                                response_msg += f"  - Due: {task['due_date']}\n"
                            if task.get('tags'):
                                response_msg += f"  - Tags: {', '.join(task['tags'])}\n"
                            response_msg += "\n"

            return self.success_response({
                "message": response_msg,
                "tasks": tasks,
                "project_name": project_name
            })

        except Exception as e:
            logger.error(f"Failed to list tasks: {e}", exc_info=True)
            return self.fail_response(f"Failed to list tasks: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "update_kanban_task",
            "description": "Update an existing kanban task.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "The ID of the task to update"
                    },
                    "title": {
                        "type": "string",
                        "description": "New title"
                    },
                    "description": {
                        "type": "string",
                        "description": "New description"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["todo", "in_progress", "review", "done"],
                        "description": "New status"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "urgent"],
                        "description": "New priority"
                    },
                    "due_date": {
                        "type": "string",
                        "description": "New due date (ISO format)"
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "New tags array"
                    }
                },
                "required": ["task_id"]
            }
        }
    })
    async def update_kanban_task(
        self,
        task_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        due_date: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> ToolResult:
        """Update an existing kanban task."""
        try:
            client = await self.db.client

            # Verify task exists and belongs to user
            existing = await client.table('kanban_tasks').select("*").eq("id", task_id).eq("user_id", self.user_id).execute()
            if not existing.data:
                return self.fail_response("Task not found or access denied")

            # Build update data
            update_data = {}
            updates_made = []

            if title is not None:
                update_data['title'] = title
                updates_made.append(f"Title: '{title}'")
            if description is not None:
                update_data['description'] = description
                updates_made.append("Description updated")
            if status is not None:
                update_data['status'] = status
                updates_made.append(f"Status: {status}")
                # If status changed, move to end of that column
                if status != existing.data[0]['status']:
                    max_pos = await client.table('kanban_tasks').select("position").eq("project_id", existing.data[0]['project_id']).eq("status", status).order("position", desc=True).limit(1).execute()
                    update_data['position'] = (max_pos.data[0]['position'] + 1) if max_pos.data else 0
            if priority is not None:
                update_data['priority'] = priority
                updates_made.append(f"Priority: {priority}")
            if due_date is not None:
                update_data['due_date'] = due_date
                updates_made.append(f"Due date: {due_date}")
            if tags is not None:
                update_data['tags'] = tags
                updates_made.append("Tags updated")

            if not update_data:
                return self.fail_response("No updates provided")

            # Mark as completed if moving to done
            if status == "done" and existing.data[0]['status'] != "done":
                from datetime import datetime, timezone
                update_data['completed_at'] = datetime.now(timezone.utc).isoformat()

            result = await client.table('kanban_tasks').update(update_data).eq("id", task_id).eq("user_id", self.user_id).execute()

            if not result.data:
                return self.fail_response("Failed to update task")

            task = result.data[0]

            success_msg = f"✅ Successfully updated task '{task['title']}'!\n\n"
            success_msg += f"**Changes Made:**\n"
            for update in updates_made:
                success_msg += f"• {update}\n"

            return self.success_response({
                "message": success_msg,
                "task": task
            })

        except Exception as e:
            logger.error(f"Failed to update task: {e}", exc_info=True)
            return self.fail_response(f"Failed to update task: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "delete_kanban_task",
            "description": "Delete a task from a project. This action cannot be undone.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "The ID of the task to delete"
                    }
                },
                "required": ["task_id"]
            }
        }
    })
    async def delete_kanban_task(self, task_id: str) -> ToolResult:
        """Delete a kanban task."""
        try:
            client = await self.db.client

            # Verify task exists and belongs to user
            existing = await client.table('kanban_tasks').select("title").eq("id", task_id).eq("user_id", self.user_id).execute()
            if not existing.data:
                return self.fail_response("Task not found or access denied")

            task_title = existing.data[0]['title']

            await client.table('kanban_tasks').delete().eq("id", task_id).eq("user_id", self.user_id).execute()

            return self.success_response({
                "message": f"✅ Task '{task_title}' has been deleted successfully."
            })

        except Exception as e:
            logger.error(f"Failed to delete task: {e}", exc_info=True)
            return self.fail_response(f"Failed to delete task: {str(e)}")

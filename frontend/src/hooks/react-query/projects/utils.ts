import { createClient } from "@/lib/supabase/client";
import {
  Project,
  KanbanTask,
  ProjectsResponse,
  KanbanTasksResponse,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  KanbanTaskCreateRequest,
  KanbanTaskUpdateRequest,
  ProjectsParams,
  KanbanTasksParams,
  ProjectIconGenerationRequest,
  ProjectIconGenerationResponse,
  TaskBulkUpdateRequest,
  TaskBulkUpdateResponse
} from "./types";

// Re-export types for other modules
export type {
  Project,
  KanbanTask,
  ProjectsResponse,
  KanbanTasksResponse,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  KanbanTaskCreateRequest,
  KanbanTaskUpdateRequest,
  ProjectsParams,
  KanbanTasksParams,
  ProjectIconGenerationRequest,
  ProjectIconGenerationResponse,
  TaskBulkUpdateRequest,
  TaskBulkUpdateResponse
};

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Helper function to get auth token
async function getAuthToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('No authentication token available');
  }

  return session.access_token;
}

// Generic API request function
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const url = `${API_URL}${endpoint}`;
  console.log('Making request to:', url);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ============ PROJECTS API ============

export async function getProjects(params: ProjectsParams = {}): Promise<ProjectsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append('page', params.page.toString());
  if (params.per_page) searchParams.append('per_page', params.per_page.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.is_archived !== undefined) searchParams.append('is_archived', params.is_archived.toString());
  if (params.is_public !== undefined) searchParams.append('is_public', params.is_public.toString());
  if (params.sort_by) searchParams.append('sort_by', params.sort_by);
  if (params.sort_order) searchParams.append('sort_order', params.sort_order);

  const query = searchParams.toString();
  return makeRequest<ProjectsResponse>(`/api/projects${query ? `?${query}` : ''}`);
}

export async function getProject(projectId: string): Promise<Project> {
  return makeRequest<Project>(`/api/projects/${projectId}`);
}

export async function createProject(data: ProjectCreateRequest): Promise<Project> {
  return makeRequest<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(projectId: string, data: ProjectUpdateRequest): Promise<Project> {
  return makeRequest<Project>(`/api/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(projectId: string): Promise<{ message: string }> {
  return makeRequest<{ message: string }>(`/api/projects/${projectId}`, {
    method: 'DELETE',
  });
}

export async function generateProjectIcon(data: ProjectIconGenerationRequest): Promise<ProjectIconGenerationResponse> {
  return makeRequest<ProjectIconGenerationResponse>('/api/projects/generate-icon', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============ KANBAN TASKS API ============

export async function getKanbanTasks(
  projectId: string,
  params: KanbanTasksParams = {}
): Promise<KanbanTasksResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append('page', params.page.toString());
  if (params.per_page) searchParams.append('per_page', params.per_page.toString());
  if (params.status) searchParams.append('status', params.status);
  if (params.priority) searchParams.append('priority', params.priority);
  if (params.assigned_to) searchParams.append('assigned_to', params.assigned_to);
  if (params.search) searchParams.append('search', params.search);
  if (params.sort_by) searchParams.append('sort_by', params.sort_by);
  if (params.sort_order) searchParams.append('sort_order', params.sort_order);

  const query = searchParams.toString();
  return makeRequest<KanbanTasksResponse>(`/api/projects/${projectId}/tasks${query ? `?${query}` : ''}`);
}

export async function getKanbanTask(projectId: string, taskId: string): Promise<KanbanTask> {
  return makeRequest<KanbanTask>(`/api/projects/${projectId}/tasks/${taskId}`);
}

export async function createKanbanTask(
  projectId: string,
  data: KanbanTaskCreateRequest
): Promise<KanbanTask> {
  return makeRequest<KanbanTask>(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateKanbanTask(
  projectId: string,
  taskId: string,
  data: KanbanTaskUpdateRequest
): Promise<KanbanTask> {
  return makeRequest<KanbanTask>(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteKanbanTask(projectId: string, taskId: string): Promise<{ message: string }> {
  return makeRequest<{ message: string }>(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

export async function bulkUpdateKanbanTasks(
  projectId: string,
  data: TaskBulkUpdateRequest
): Promise<TaskBulkUpdateResponse> {
  return makeRequest<TaskBulkUpdateResponse>(`/api/projects/${projectId}/tasks/bulk-update`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============ UTILITY FUNCTIONS ============

export function reorderTasks(
  tasks: KanbanTask[],
  sourceStatus: string,
  destinationStatus: string,
  sourceIndex: number,
  destinationIndex: number
): KanbanTask[] {
  const newTasks = [...tasks];
  const [removed] = newTasks.splice(sourceIndex, 1);

  // Update status if changed
  if (sourceStatus !== destinationStatus) {
    removed.status = destinationStatus as KanbanTask['status'];
  }

  // Insert at new position
  newTasks.splice(destinationIndex, 0, removed);

  // Recalculate positions for the affected status columns
  const tasksByStatus = newTasks.reduce((acc, task, index) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push({ task, index });
    return acc;
  }, {} as Record<string, Array<{ task: KanbanTask; index: number }>>);

  // Update positions
  Object.values(tasksByStatus).forEach((statusTasks) => {
    statusTasks.forEach(({ task, index }, position) => {
      newTasks[index].position = position;
    });
  });

  return newTasks;
}

export function filterTasks(tasks: KanbanTask[], filters: {
  status?: string;
  priority?: string;
  assigned_to?: string;
  search?: string;
}): KanbanTask[] {
  return tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.assigned_to && task.assigned_to !== filters.assigned_to) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower)) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });
}

export function sortTasks(tasks: KanbanTask[], sortBy: string, sortOrder: 'asc' | 'desc'): KanbanTask[] {
  return [...tasks].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'priority':
        const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      case 'due_date':
        aValue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        bValue = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'position':
        aValue = a.position;
        bValue = b.position;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}
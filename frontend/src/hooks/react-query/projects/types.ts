export type Project = {
  id: string;
  name: string;
  description?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  icon_name: string;
  icon_color: string;
  icon_background: string;
  is_archived: boolean;
  is_public: boolean;
  settings: Record<string, any>;
  task_count?: number;
};

export type KanbanTask = {
  id: string;
  title: string;
  description?: string | null;
  project_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  position: number;
  assigned_to?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  tags: string[];
  metadata: Record<string, any>;
  icon_name?: string | null;
  icon_color?: string | null;
  icon_background?: string | null;
};

export type PaginationInfo = {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
};

export type ProjectsResponse = {
  projects: Project[];
  pagination: PaginationInfo;
};

export type KanbanTasksResponse = {
  tasks: KanbanTask[];
  pagination: PaginationInfo;
};

export type ProjectCreateRequest = {
  name: string;
  description?: string;
  icon_name?: string;
  icon_color?: string;
  icon_background?: string;
  is_public?: boolean;
  settings?: Record<string, any>;
};

export type ProjectUpdateRequest = {
  name?: string;
  description?: string;
  icon_name?: string;
  icon_color?: string;
  icon_background?: string;
  is_archived?: boolean;
  is_public?: boolean;
  settings?: Record<string, any>;
};

export type KanbanTaskCreateRequest = {
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  position?: number;
  assigned_to?: string;
  due_date?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  icon_name?: string;
  icon_color?: string;
  icon_background?: string;
};

export type KanbanTaskUpdateRequest = {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  position?: number;
  assigned_to?: string;
  due_date?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  icon_name?: string;
  icon_color?: string;
  icon_background?: string;
};

export type ProjectsParams = {
  page?: number;
  per_page?: number;
  search?: string;
  is_archived?: boolean;
  is_public?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

export type KanbanTasksParams = {
  page?: number;
  per_page?: number;
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

export type ProjectIconGenerationRequest = {
  name: string;
  description?: string;
};

export type ProjectIconGenerationResponse = {
  icon_name: string;
  icon_color: string;
  icon_background: string;
};

export type TaskBulkUpdateRequest = {
  task_ids: string[];
  updates: KanbanTaskUpdateRequest;
};

export type TaskBulkUpdateResponse = {
  updated_count: number;
  failed_count: number;
  failed_tasks: string[];
};
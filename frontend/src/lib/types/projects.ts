export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  COMPLETED = 'completed',
}

export interface Project {
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
  completed_task_count?: number;
  completion_rate?: number;
  status?: 'active' | 'archived' | 'completed';
  account_id?: string; // Para compatibilidade com componentes existentes
}

export interface ProjectCreate {
  name: string;
  description?: string;
  icon_name?: string;
  icon_color?: string;
  icon_background?: string;
  is_public?: boolean;
  settings?: Record<string, any>;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  icon_name?: string;
  icon_color?: string;
  icon_background?: string;
  is_archived?: boolean;
  is_public?: boolean;
  settings?: Record<string, any>;
}

export interface KanbanTask {
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
  // Campos para compatibilidade com componentes existentes
  column_id?: TaskStatus; // Mapeado para status
  order?: number; // Mapeado para position
}

export interface KanbanTaskCreate {
  project_id: string;
  title: string;
  description?: string | null;
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  position?: number;
  assigned_to?: string;
  due_date?: string | null;
  tags?: string[];
  metadata?: Record<string, any>;
  icon_name?: string | null;
  icon_color?: string | null;
  icon_background?: string | null;
  // Para compatibilidade com componentes existentes
  column_id?: TaskStatus;
  order?: number;
}

export interface KanbanTaskUpdate {
  title?: string;
  description?: string | null;
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  position?: number;
  assigned_to?: string | null;
  due_date?: string | null;
  tags?: string[];
  metadata?: Record<string, any>;
  icon_name?: string | null;
  icon_color?: string | null;
  icon_background?: string | null;
  // Para compatibilidade com componentes existentes
  column_id?: TaskStatus;
  order?: number;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: KanbanTask[];
  taskCount: number;
}

export interface KanbanBoard {
  project_id: string;
  columns: KanbanColumn[];
  total_tasks: number;
}

export interface ProjectListResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface KanbanBoardResponse {
  board: KanbanBoard;
  project: Project;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  search?: string;
}

export interface TaskFilters {
  priority?: TaskPriority[];
  status?: TaskStatus[];
  search?: string;
  due_date?: {
    from?: string;
    to?: string;
  };
}

export interface ProjectError {
  error: string;
  message: string;
  status_code: number;
}

export const COLUMN_TITLES: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.REVIEW]: 'Review',
  [TaskStatus.DONE]: 'Done',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'bg-blue-500',
  [TaskPriority.MEDIUM]: 'bg-yellow-500',
  [TaskPriority.HIGH]: 'bg-orange-500',
  [TaskPriority.URGENT]: 'bg-red-500',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'Low',
  [TaskPriority.MEDIUM]: 'Medium',
  [TaskPriority.HIGH]: 'High',
  [TaskPriority.URGENT]: 'Urgent',
};

export const STATUS_ORDER: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.DONE,
];

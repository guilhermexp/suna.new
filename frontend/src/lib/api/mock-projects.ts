import {
  Project,
  ProjectCreate,
  ProjectUpdate,
  KanbanTask,
  KanbanTaskCreate,
  KanbanTaskUpdate,
  KanbanBoard,
  TaskStatus,
  COLUMN_TITLES,
  STATUS_ORDER,
} from '@/lib/types/projects';

const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    user_id: 'user-1',
    account_id: 'acc-1',
    name: 'Website Redesign',
    description: 'Complete overhaul of company website with modern design',
    icon_name: 'globe',
    icon_color: '#FFFFFF',
    icon_background: '#3B82F6',
    status: 'active',
    is_archived: false,
    is_public: false,
    settings: {},
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
    task_count: 12,
    completed_task_count: 5,
    completion_rate: 41.67,
  },
  {
    id: 'proj-2',
    user_id: 'user-1',
    account_id: 'acc-1',
    name: 'Mobile App Development',
    description: 'Build native mobile apps for iOS and Android',
    icon_name: 'smartphone',
    icon_color: '#FFFFFF',
    icon_background: '#10B981',
    status: 'active',
    is_archived: false,
    is_public: false,
    settings: {},
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-22T11:45:00Z',
    task_count: 18,
    completed_task_count: 8,
    completion_rate: 44.44,
  },
  {
    id: 'proj-3',
    user_id: 'user-1',
    account_id: 'acc-1',
    name: 'Marketing Campaign Q1',
    description: 'Social media and email marketing campaign for Q1 2024',
    icon_name: 'megaphone',
    icon_color: '#FFFFFF',
    icon_background: '#F97316',
    status: 'active',
    is_archived: false,
    is_public: false,
    settings: {},
    created_at: '2024-01-05T08:00:00Z',
    updated_at: '2024-01-25T14:20:00Z',
    task_count: 15,
    completed_task_count: 12,
    completion_rate: 80,
  },
  {
    id: 'proj-4',
    user_id: 'user-1',
    account_id: 'acc-1',
    name: 'API Integration',
    description: 'Integrate third-party APIs and build internal microservices',
    icon_name: 'plug',
    icon_color: '#FFFFFF',
    icon_background: '#EC4899',
    status: 'active',
    is_archived: false,
    is_public: false,
    settings: {},
    created_at: '2024-01-18T13:00:00Z',
    updated_at: '2024-01-23T16:10:00Z',
    task_count: 8,
    completed_task_count: 3,
    completion_rate: 37.5,
  },
  {
    id: 'proj-5',
    user_id: 'user-1',
    account_id: 'acc-1',
    name: 'Customer Portal',
    description: 'Self-service portal for customer support and account management',
    icon_name: 'users',
    icon_color: '#FFFFFF',
    icon_background: '#EAB308',
    status: 'active',
    is_archived: false,
    is_public: false,
    settings: {},
    created_at: '2024-01-12T11:30:00Z',
    updated_at: '2024-01-24T09:15:00Z',
    task_count: 10,
    completed_task_count: 4,
    completion_rate: 40,
  },
  {
    id: 'proj-6',
    user_id: 'user-1',
    account_id: 'acc-1',
    name: 'Database Migration',
    description: 'Migrate from MongoDB to PostgreSQL with zero downtime',
    icon_name: 'database',
    icon_color: '#FFFFFF',
    icon_background: '#6366F1',
    status: 'completed',
    is_archived: false,
    is_public: false,
    settings: {},
    created_at: '2023-12-01T10:00:00Z',
    updated_at: '2024-01-15T17:00:00Z',
    task_count: 6,
    completed_task_count: 6,
    completion_rate: 100,
  },
];

const MOCK_TASKS: KanbanTask[] = [
  {
    id: 'task-1',
    project_id: 'proj-1',
    title: 'Design new homepage mockups',
    description: 'Create high-fidelity mockups for the new homepage design',
    priority: 'high',
    status: 'in_progress',
    position: 0,
    user_id: 'user-1',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    due_date: '2024-02-01T23:59:59Z',
    tags: [],
    metadata: {},
  },
  {
    id: 'task-2',
    project_id: 'proj-1',
    title: 'Implement responsive navigation',
    description: 'Build mobile-friendly navigation with hamburger menu',
    priority: 'high',
    status: 'todo',
    position: 0,
    user_id: 'user-1',
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
    due_date: '2024-02-03T23:59:59Z',
    tags: [],
    metadata: {},
  },
  {
    id: 'task-3',
    project_id: 'proj-1',
    title: 'Optimize image loading',
    description: 'Implement lazy loading and WebP format for better performance',
    priority: 'medium',
    status: 'todo',
    position: 1,
    user_id: 'user-1',
    created_at: '2024-01-15T11:15:00Z',
    updated_at: '2024-01-15T11:15:00Z',
    tags: [],
    metadata: {},
  },
  {
    id: 'task-4',
    project_id: 'proj-1',
    title: 'Set up color scheme',
    description: 'Define primary, secondary, and accent colors',
    priority: 'high',
    status: 'done',
    position: 0,
    user_id: 'user-1',
    created_at: '2024-01-15T10:15:00Z',
    updated_at: '2024-01-16T14:20:00Z',
    completed_at: '2024-01-16T14:20:00Z',
    tags: [],
    metadata: {},
  },
  {
    id: 'task-5',
    project_id: 'proj-1',
    title: 'Choose typography',
    description: 'Select fonts for headings and body text',
    priority: 'medium',
    status: 'done',
    position: 1,
    user_id: 'user-1',
    created_at: '2024-01-15T10:20:00Z',
    updated_at: '2024-01-16T15:10:00Z',
    completed_at: '2024-01-16T15:10:00Z',
    tags: [],
    metadata: {},
  },
  {
    id: 'task-6',
    project_id: 'proj-1',
    title: 'User research interviews',
    description: 'Conduct interviews with 10 users about current website',
    priority: 'urgent',
    status: 'todo',
    position: 2,
    user_id: 'user-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    due_date: '2024-01-30T23:59:59Z',
    tags: [],
    metadata: {},
  },
  {
    id: 'task-7',
    project_id: 'proj-2',
    title: 'Set up React Native project',
    description: 'Initialize project with Expo and configure basic settings',
    priority: 'high',
    status: 'done',
    position: 0,
    user_id: 'user-1',
    created_at: '2024-01-10T09:30:00Z',
    updated_at: '2024-01-11T16:00:00Z',
    completed_at: '2024-01-11T16:00:00Z',
    tags: [],
    metadata: {},
  },
  {
    id: 'task-8',
    project_id: 'proj-2',
    title: 'Design app navigation flow',
    description: 'Create wireframes for main navigation structure',
    priority: 'high',
    status: 'in_progress',
    position: 0,
    user_id: 'user-1',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
    due_date: '2024-02-05T23:59:59Z',
    tags: [],
    metadata: {},
  },
  {
    id: 'task-9',
    project_id: 'proj-2',
    title: 'Implement authentication',
    description: 'Add user login/signup with Firebase Auth',
    priority: 'urgent',
    status: 'todo',
    position: 1,
    user_id: 'user-1',
    created_at: '2024-01-10T10:30:00Z',
    updated_at: '2024-01-10T10:30:00Z',
    due_date: '2024-02-02T23:59:59Z',
    tags: [],
    metadata: {},
  },
];

let mockProjects = [...MOCK_PROJECTS];
let mockTasks = [...MOCK_TASKS];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockProjectsApi = {
  async getProjects(params?: { search?: string }): Promise<{ projects: Project[] }> {
    await delay(500);
    
    let filtered = [...mockProjects];
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search)
      );
    }
    
    return { projects: filtered };
  },

  async getProject(id: string): Promise<Project> {
    await delay(300);
    const project = mockProjects.find((p) => p.id === id);
    if (!project) throw new Error('Project not found');
    return project;
  },

  async createProject(data: ProjectCreate): Promise<Project> {
    await delay(600);
    
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      user_id: 'user-1',
      account_id: 'acc-1',
      name: data.name,
      description: data.description || null,
      icon_name: data.icon_name || 'folder',
      icon_color: data.icon_color || '#000000',
      icon_background: data.icon_background || '#F3F4F6',
      status: 'active',
      is_archived: false,
      is_public: false,
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      task_count: 0,
      completed_task_count: 0,
      completion_rate: 0,
    };
    
    mockProjects.push(newProject);
    return newProject;
  },

  async updateProject(id: string, data: ProjectUpdate): Promise<Project> {
    await delay(500);
    
    const index = mockProjects.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Project not found');
    
    mockProjects[index] = {
      ...mockProjects[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    
    return mockProjects[index];
  },

  async deleteProject(id: string): Promise<void> {
    await delay(400);
    
    mockProjects = mockProjects.filter((p) => p.id !== id);
    mockTasks = mockTasks.filter((t) => t.project_id !== id);
  },

  async getKanbanBoard(projectId: string): Promise<KanbanBoard> {
    await delay(500);

    const projectTasks = mockTasks.filter((t) => t.project_id === projectId);

    const columns = STATUS_ORDER.map((status) => {
      const columnTasks = projectTasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.position - b.position);

      return {
        id: status,
        title: COLUMN_TITLES[status],
        tasks: columnTasks,
        taskCount: columnTasks.length,
      };
    });

    return {
      project_id: projectId,
      columns,
      total_tasks: projectTasks.length,
    };
  },

  async getTasks(projectId: string): Promise<KanbanTask[]> {
    await delay(400);
    return mockTasks.filter((t) => t.project_id === projectId);
  },

  async createTask(data: KanbanTaskCreate): Promise<KanbanTask> {
    await delay(500);

    const status = data.status || data.column_id || 'todo';
    const projectTasks = mockTasks.filter(
      (t) => t.project_id === data.project_id && t.status === status
    );
    const maxPosition = Math.max(...projectTasks.map((t) => t.position), -1);

    const newTask: KanbanTask = {
      id: `task-${Date.now()}`,
      title: data.title,
      description: data.description || null,
      project_id: data.project_id,
      user_id: 'user-1', // Mock user
      status: status as KanbanTask['status'],
      priority: data.priority || 'medium',
      position: data.position ?? data.order ?? maxPosition + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      due_date: data.due_date || null,
      tags: data.tags || [],
      metadata: data.metadata || {},
      // Compatibility fields
      column_id: status as TaskStatus,
      order: data.position ?? data.order ?? maxPosition + 1,
    };

    mockTasks.push(newTask);
    updateProjectStats(data.project_id);

    return newTask;
  },

  async updateTask(id: string, data: KanbanTaskUpdate): Promise<KanbanTask> {
    await delay(400);

    const index = mockTasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Task not found');

    const currentTask = mockTasks[index];
    const updatedTask: KanbanTask = {
      ...currentTask,
      ...data,
      // Update status if provided
      status: data.status || currentTask.status,
      // Update position if provided
      position: data.position ?? data.order ?? currentTask.position,
      updated_at: new Date().toISOString(),
      // Handle compatibility fields
      column_id: (data.status || data.column_id || currentTask.status) as TaskStatus,
      order: data.position ?? data.order ?? currentTask.position,
    };

    mockTasks[index] = updatedTask;
    updateProjectStats(updatedTask.project_id);

    return updatedTask;
  },

  async deleteTask(id: string): Promise<void> {
    await delay(300);
    
    const task = mockTasks.find((t) => t.id === id);
    if (!task) throw new Error('Task not found');
    
    mockTasks = mockTasks.filter((t) => t.id !== id);
    updateProjectStats(task.project_id);
  },

  async moveTask(taskId: string, newColumnId: TaskStatus, newOrder?: number): Promise<KanbanTask> {
    await delay(300);

    const taskIndex = mockTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');

    const task = mockTasks[taskIndex];
    const oldStatus = task.status;

    if (oldStatus === newColumnId && newOrder === undefined) {
      return task;
    }

    const updatedTask: KanbanTask = {
      ...task,
      status: newColumnId,
      position: newOrder ?? task.position,
      updated_at: new Date().toISOString(),
      // Compatibility fields
      column_id: newColumnId,
      order: newOrder ?? task.order,
    };

    mockTasks[taskIndex] = updatedTask;
    updateProjectStats(task.project_id);

    return updatedTask;
  },
};

function updateProjectStats(projectId: string) {
  const projectIndex = mockProjects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) return;

  const projectTasks = mockTasks.filter((t) => t.project_id === projectId);
  const completedTasks = projectTasks.filter((t) => t.status === TaskStatus.DONE);

  mockProjects[projectIndex] = {
    ...mockProjects[projectIndex],
    task_count: projectTasks.length,
    completed_task_count: completedTasks.length,
    completion_rate: projectTasks.length > 0
      ? (completedTasks.length / projectTasks.length) * 100
      : 0,
    updated_at: new Date().toISOString(),
  };
}

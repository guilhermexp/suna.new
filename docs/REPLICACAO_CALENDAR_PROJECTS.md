# Replicação das Páginas de Calendário e Projetos (Kanban) do deer-flow-New para Suna

Este documento detalha a arquitetura, componentes e implementação das páginas de **Calendário** e **Projetos (Kanban)** do deer-flow-New, fornecendo um guia completo para replicá-las no projeto Suna.

## Índice

1. [Visão Geral](#visão-geral)
2. [Página de Calendário](#página-de-calendário)
3. [Página de Projetos (Kanban)](#página-de-projetos-kanban)
4. [Backend - API REST](#backend---api-rest)
5. [Estrutura de Banco de Dados](#estrutura-de-banco-de-dados)
6. [Passo a Passo para Replicação](#passo-a-passo-para-replicação)

---

## Visão Geral

### Tecnologias Utilizadas

**Frontend:**
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS
- shadcn/ui (componentes UI)
- Lucide React (ícones)
- Dynamic imports para otimização

**Backend:**
- FastAPI (Python)
- REST API endpoints
- Mock data (sem persistência real no exemplo original)

### Arquitetura Geral

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                 │
│                                                      │
│  ┌──────────────┐           ┌──────────────┐        │
│  │  /calendar   │           │  /projects   │        │
│  │    page      │           │    page      │        │
│  └──────┬───────┘           └──────┬───────┘        │
│         │                          │                │
│         ▼                          ▼                │
│  ┌──────────────┐           ┌──────────────┐        │
│  │  Calendar    │           │   Kanban     │        │
│  │  Components  │           │  Components  │        │
│  └──────┬───────┘           └──────┬───────┘        │
│         │                          │                │
│         ▼                          ▼                │
│  ┌──────────────────────────────────────┐           │
│  │        API Service Layer             │           │
│  │  (calendar.ts, projects.ts)          │           │
│  └─────────────────┬────────────────────┘           │
└────────────────────┼─────────────────────────────────┘
                     │
                     │ HTTP/REST
                     │
┌────────────────────┼─────────────────────────────────┐
│                    ▼                                 │
│            BACKEND (FastAPI)                         │
│                                                      │
│  ┌──────────────────────────────────────┐           │
│  │       API Endpoints (app.py)         │           │
│  │                                      │           │
│  │  GET  /api/calendar/events           │           │
│  │  POST /api/calendar/events           │           │
│  │  GET  /api/projects                  │           │
│  │  POST /api/projects                  │           │
│  │  GET  /api/projects/:id/kanban       │           │
│  └─────────────────┬────────────────────┘           │
│                    │                                 │
│                    ▼                                 │
│  ┌──────────────────────────────────────┐           │
│  │     Database / Storage Layer         │           │
│  │    (Supabase/PostgreSQL no Suna)     │           │
│  └──────────────────────────────────────┘           │
└──────────────────────────────────────────────────────┘
```

---

## Página de Calendário

### 1. Estrutura de Arquivos

```
frontend/src/
├── app/
│   └── calendar/
│       └── page.tsx                          # Página principal do calendário
├── components/
│   └── deer-flow/
│       └── calendar/
│           ├── calendar-page.tsx             # Componente principal do calendário
│           ├── calendar-page-client.tsx      # Wrapper client-side
│           ├── hooks/
│           │   ├── use-calendar.ts           # Hook principal que orquestra tudo
│           │   ├── useCalendarEventsApi.ts   # Hook para chamadas API
│           │   ├── useCalendarDateNavigation.ts  # Hook para navegação de datas
│           │   ├── useCalendarDisplayLogic.ts    # Hook para lógica de exibição
│           │   └── useCalendarDialogs.ts     # Hook para controle de dialogs
│           ├── ui/
│           │   ├── calendar-header.tsx       # Cabeçalho com controles
│           │   ├── day-view.tsx              # Vista de dia
│           │   ├── week-view.tsx             # Vista de semana
│           │   ├── month-view.tsx            # Vista de mês
│           │   ├── event-card.tsx            # Cartão de evento
│           │   ├── add-event-dialog.tsx      # Dialog para adicionar evento
│           │   └── delete-event-dialog.tsx   # Dialog para deletar evento
│           └── lib/
│               ├── types.ts                  # Tipos TypeScript
│               └── constants.ts              # Constantes (cores, categorias)
└── services/
    └── api/
        └── calendar.ts                       # Serviço de API do calendário
```

### 2. Tipos de Dados (TypeScript)

```typescript
// CalendarEvent - Interface principal do evento
export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  date: string;                    // ISO 8601 format
  end_date: string | null;         // ISO 8601 format
  category: string | null;         // Meeting, Work, Personal, etc.
  color: string;                   // Hex color code
  location: string | null;
  is_all_day: boolean;
  created_at: string;
  updated_at: string;
}

// Para criar novos eventos
export interface CalendarEventCreate {
  title: string;
  description?: string | null;
  date: string;
  end_date?: string | null;
  category?: string | null;
  color?: string;
  location?: string | null;
  is_all_day?: boolean;
}

// Para atualizar eventos existentes
export interface CalendarEventUpdate {
  title?: string;
  description?: string | null;
  date?: string;
  end_date?: string | null;
  category?: string | null;
  color?: string;
  location?: string | null;
  is_all_day?: boolean;
}

// Modos de visualização
export type CalendarViewMode = "day" | "week" | "month";

// Filtros de categoria
export type CalendarFilter = "all" | "meeting" | "work" | "personal";
```

### 3. Serviço de API do Frontend

**Localização:** `frontend/src/services/api/calendar.ts`

```typescript
import { api } from "./http-client";

export const calendarApiService = {
  /**
   * Listar eventos do calendário
   */
  async list(params?: {
    start_date?: string;
    end_date?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<CalendarEvent[]> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append("start_date", params.start_date);
    if (params?.end_date) queryParams.append("end_date", params.end_date);
    if (params?.category) queryParams.append("category", params.category);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const query = queryParams.toString();
    const endpoint = query ? `/calendar/events?${query}` : "/calendar/events";

    return await api.get<CalendarEvent[]>(endpoint);
  },

  /**
   * Buscar evento por ID
   */
  async get(id: number): Promise<CalendarEvent | null> {
    return await api.get<CalendarEvent>(`/calendar/events/${id}`);
  },

  /**
   * Criar novo evento
   */
  async create(data: CalendarEventCreate): Promise<CalendarEvent> {
    return await api.post<CalendarEvent>("/calendar/events", data);
  },

  /**
   * Atualizar evento
   */
  async update(id: number, data: CalendarEventUpdate): Promise<CalendarEvent> {
    return await api.put<CalendarEvent>(`/calendar/events/${id}`, data);
  },

  /**
   * Deletar evento
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/calendar/events/${id}`);
  },

  /**
   * Buscar eventos de um mês específico
   */
  async getByMonth(year: number, month: number): Promise<CalendarEvent[]> {
    return await api.get<CalendarEvent[]>(
      `/calendar/events/month/${year}/${month}`
    );
  },
};
```

### 4. Hook Principal (use-calendar.ts)

O hook `useCalendar` é composto por 4 sub-hooks que gerenciam diferentes aspectos:

```typescript
export const useCalendar = () => {
  // 1. API e dados dos eventos
  const { events, addEvent, deleteEvent, isLoading } = useCalendarEventsApi();

  // 2. Navegação de datas (dia, semana, mês)
  const dateNavigation = useCalendarDateNavigation();

  // 3. Lógica de exibição (filtros, formatação)
  const displayLogic = useCalendarDisplayLogic(
    events,
    dateNavigation.currentDate,
    dateNavigation.monthDisplayDate,
    dateNavigation.startOfWeekDate
  );

  // 4. Controle de diálogos (adicionar/deletar)
  const dialogs = useCalendarDialogs();

  // Handlers combinados
  const handleAddNewEvent = useCallback(
    async (eventData: NewEventFormData) => {
      addEvent(eventData);
    },
    [addEvent]
  );

  const handleConfirmDelete = useCallback(() => {
    if (dialogs.confirmDeleteAction) {
      const eventIdToDelete = dialogs.confirmDeleteAction();
      if (eventIdToDelete) {
        deleteEvent(eventIdToDelete);
      }
    }
    dialogs.handleCloseDeleteDialog();
  }, [deleteEvent, dialogs]);

  // Retorna tudo consolidado
  return {
    // Dados
    allEvents: events,
    isLoading,
    currentDate: dateNavigation.currentDate,
    viewMode: displayLogic.viewMode,
    activeFilter: displayLogic.activeFilter,
    // ... outros retornos
    // Handlers
    handleAddNewEvent,
    handleConfirmDelete,
    setViewMode: displayLogic.setViewMode,
    navigateDay: dateNavigation.navigateDay,
    navigateWeek: dateNavigation.navigateWeek,
    navigateMonth: dateNavigation.navigateMonth,
    // ... outros handlers
  };
};
```

### 5. Componente Principal (calendar-page.tsx)

```tsx
export default function CalendarPage({ className }: { className?: string }) {
  const {
    viewMode,
    activeFilter,
    currentDate,
    monthDisplayDate,
    isAddEventDialogOpen,
    isDeleteConfirmOpen,
    eventToDelete,
    eventsForSelectedDayInDayView,
    // ... outros estados
    setViewMode,
    setActiveFilter,
    setIsAddEventDialogOpen,
    handleGoToToday,
    handleAddNewEvent,
    handleOpenDeleteDialog,
    handleConfirmDelete,
    navigateDay,
    navigateWeek,
    navigateMonth,
    // ... outros handlers
  } = useCalendar();

  const [addEventInitialDate, setAddEventInitialDate] = useState<Date | undefined>();

  return (
    <div className={cn("min-h-full", className)}>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col">
        {/* Header com controles de navegação e filtros */}
        <CalendarHeader
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onTodayClick={handleGoToToday}
          onNewEventClick={handleOpenAddEventDialogWithDate}
          onNavigate={(direction) => {
            if (viewMode === "day") navigateDay(direction);
            else if (viewMode === "week") navigateWeek(direction);
            else navigateMonth(direction);
          }}
          currentDate={currentDate}
          monthDisplayDate={monthDisplayDate}
        />

        {/* Main: Views dinâmicas */}
        <main className="flex-grow overflow-y-auto">
          {viewMode === "day" && (
            <DayView
              currentDate={currentDate}
              eventsForSelectedDay={eventsForSelectedDayInDayView}
              onDeleteEvent={handleOpenDeleteDialog}
              onAddEventClick={(date) => {
                setAddEventInitialDate(date);
                openDialog();
              }}
            />
          )}
          {viewMode === "week" && (
            <WeekView
              startOfWeek={startOfWeekDate}
              daysInWeek={daysInWeekViewArray}
              getEventsForDayOfWeek={getEventsForDayOfWeek}
              onDeleteEvent={handleOpenDeleteDialog}
              onAddEventClick={(date) => {
                setAddEventInitialDate(date);
                openDialog();
              }}
            />
          )}
          {viewMode === "month" && (
            <MonthView
              monthDisplayDate={monthDisplayDate}
              getDaysInMonth={() => getDaysForMonthView(monthDisplayDate)}
              getEventsForSpecificDate={getEventsForSpecificDate}
              onDeleteEvent={handleOpenDeleteDialog}
              onAddEventClick={(date) => {
                setAddEventInitialDate(date);
                openDialog();
              }}
            />
          )}
        </main>

        {/* Dialogs */}
        <AddEventDialog
          open={isAddEventDialogOpen}
          setOpen={setIsAddEventDialogOpen}
          onAddEvent={handleAddNewEvent}
          initialDate={addEventInitialDate}
        />

        <DeleteEventDialog
          isOpen={isDeleteConfirmOpen}
          onOpenChange={handleCloseDeleteDialog}
          onConfirmDelete={handleConfirmDelete}
          eventTitle={eventToDelete?.title}
        />
      </div>
    </div>
  );
}
```

### 6. Vistas do Calendário

#### Day View
- Exibe eventos de um único dia
- Timeline de 24 horas
- Indicador de hora atual (linha vermelha)
- Eventos posicionados por hora de início
- Click em horário vazio abre dialog de novo evento

#### Week View
- Exibe 7 dias da semana
- Grid de 7 colunas (uma por dia)
- Eventos distribuídos por dia e hora
- Navegação entre semanas

#### Month View
- Grid de 6 semanas x 7 dias
- Eventos mostrados como badges coloridos
- Dias do mês anterior/posterior em cor diferente
- Click em dia abre dialog de novo evento

---

## Página de Projetos (Kanban)

### 1. Estrutura de Arquivos

```
frontend/src/
├── app/
│   └── projects/
│       ├── page.tsx                          # Página principal de projetos
│       └── loading.tsx                       # Loading state
├── components/
│   └── deer-flow/
│       └── kanban/
│           ├── ui/
│           │   ├── kanban-desk-board.tsx     # Componente principal
│           │   ├── kanban-board-header.tsx   # Header com busca
│           │   ├── project-list-view.tsx     # Lista de projetos
│           │   ├── kanban-view.tsx           # Vista Kanban (colunas)
│           │   ├── kanban-week-view.tsx      # Vista semanal
│           │   ├── kanban-task-dialog.tsx    # Dialog de tarefa
│           │   ├── kanban-delete-dialog.tsx  # Dialog de confirmação delete
│           │   ├── create-project-dialog.tsx # Dialog criar projeto
│           │   ├── task-card.tsx             # Card de tarefa
│           │   └── column-container.tsx      # Container de coluna
│           ├── hooks/
│           │   └── use-kanban-board.ts       # Hook principal do Kanban
│           └── lib/
│               └── types.ts                  # Tipos TypeScript
└── services/
    └── api/
        ├── projects.ts                       # Serviço de API de projetos
        └── tasks.ts                          # Serviço de API de tarefas
```

### 2. Tipos de Dados (TypeScript)

```typescript
// Project - Projeto/Quadro Kanban
export interface Project {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  status: string;
  created_at: string;
  updated_at: string;
  task_count?: number;
  completed_task_count?: number;
}

export interface ProjectCreate {
  name: string;
  description?: string | null;
  color?: string;
  icon?: string;
  status?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string;
}

// Task - Tarefa do Kanban
export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  DONE = "done",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface KanbanTask {
  id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  order: number;
  created_at: string;
}

// Column - Coluna do Kanban
export interface KanbanColumn {
  id: string;                      // "backlog", "todo", "in_progress", "done"
  title: string;
  color: string;
  tasks: KanbanTask[];
}

// Board - Quadro Kanban completo
export interface KanbanBoard {
  project_id: number;
  project_name: string;
  columns: KanbanColumn[];
}

// Frontend adapter (compatibilidade)
export interface FrontendProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  isPriority?: boolean;
}
```

### 3. Serviço de API do Frontend

**Localização:** `frontend/src/services/api/projects.ts`

```typescript
export const projectsApiService = {
  /**
   * Listar todos os projetos do usuário
   */
  async list(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<FrontendProject[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const query = queryParams.toString();
    const endpoint = query ? `/projects?${query}` : "/projects";

    const apiProjects = await api.get<Project[]>(endpoint);
    return apiProjects.map(adaptProjectToFrontend);
  },

  /**
   * Buscar projeto por ID
   */
  async get(id: number): Promise<FrontendProject | null> {
    const project = await api.get<Project>(`/projects/${id}`);
    return adaptProjectToFrontend(project);
  },

  /**
   * Criar novo projeto
   */
  async create(data: ProjectCreate): Promise<FrontendProject> {
    const created = await api.post<Project>("/projects", data);
    return adaptProjectToFrontend(created);
  },

  /**
   * Atualizar projeto
   */
  async update(id: number, data: ProjectUpdate): Promise<FrontendProject> {
    const updated = await api.put<Project>(`/projects/${id}`, data);
    return adaptProjectToFrontend(updated);
  },

  /**
   * Deletar projeto
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  /**
   * Buscar quadro Kanban do projeto
   */
  async getKanban(projectId: number): Promise<KanbanBoard | null> {
    const board = await api.get<KanbanBoard>(`/projects/${projectId}/kanban`);
    return board;
  },

  // ... métodos adicionais para tarefas
};
```

### 4. Hook Principal (use-kanban-board.ts)

```typescript
export const useKanbanBoard = () => {
  // Estados locais
  const [projects, setProjects] = useState<FrontendProject[]>([]);
  const [currentProject, setCurrentProject] = useState<FrontendProject | null>(null);
  const [currentProjectTasks, setCurrentProjectTasks] = useState<KanbanTask[]>([]);
  const [activeTab, setActiveTab] = useState<"projectList" | "kanbanBoard" | "weekBoard">("projectList");
  const [searchQuery, setSearchQuery] = useState("");

  // Estados dos diálogos
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<KanbanTask | null>(null);

  // Estados do drag & drop
  const [draggedTask, setDraggedTask] = useState<KanbanTask | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Carregar projetos
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const data = await projectsApiService.list();
    setProjects(data);
  };

  // Handlers de projeto
  const handleSelectProject = (project: FrontendProject) => {
    setCurrentProject(project);
    setActiveTab("kanbanBoard");
    loadProjectTasks(Number(project.id));
  };

  const loadProjectTasks = async (projectId: number) => {
    const board = await projectsApiService.getKanban(projectId);
    if (board) {
      const tasks = board.columns.flatMap(col => col.tasks);
      setCurrentProjectTasks(tasks);
    }
  };

  // Handlers de tarefa
  const handleAddTaskToColumn = (columnId: TaskStatus, title: string) => {
    setTaskFormData({
      ...initialTaskFormData,
      status: columnId,
      title: title,
    });
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: KanbanTask) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: /* determine from task */,
      // ...
    });
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async () => {
    if (!currentProject) return;

    if (editingTask) {
      // Update existing task
      await projectsApiService.updateTask(editingTask.id, taskFormData);
    } else {
      // Create new task
      await projectsApiService.createTask(
        Number(currentProject.id),
        taskFormData,
        taskFormData.status
      );
    }

    // Reload tasks
    await loadProjectTasks(Number(currentProject.id));
    setIsTaskDialogOpen(false);
    setEditingTask(null);
  };

  // Drag & Drop handlers
  const handleDragStart = (task: KanbanTask) => {
    setDraggedTask(task);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
    setIsDragging(false);
  };

  const handleDragOver = (columnId: TaskStatus) => {
    setDragOverColumn(columnId);
  };

  const handleDrop = async (columnId: TaskStatus) => {
    if (!draggedTask || !currentProject) return;

    // Move task to new column
    await projectsApiService.moveTask(
      Number(currentProject.id),
      draggedTask.id,
      columnId,
      0 // order
    );

    // Reload tasks
    await loadProjectTasks(Number(currentProject.id));
    handleDragEnd();
  };

  return {
    // Estados
    projects,
    currentProject,
    currentProjectTasks,
    activeTab,
    searchQuery,
    isTaskDialogOpen,
    isDeleteDialogOpen,
    editingTask,
    deletingTask,
    draggedTask,
    dragOverColumn,
    isDragging,
    // Setters
    setActiveTab,
    setSearchQuery,
    setIsTaskDialogOpen,
    setIsDeleteDialogOpen,
    // Handlers
    handleSelectProject,
    handleAddTaskToColumn,
    handleEditTask,
    handleDeleteTask,
    handleSaveTask,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  };
};
```

### 5. Componente Principal (kanban-desk-board.tsx)

```tsx
export default function KanbanDeskBoard() {
  const {
    projects,
    currentProject,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    isTaskDialogOpen,
    setIsTaskDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    editingTask,
    deletingTask,
    currentProjectTasks,
    handleSelectProject,
    handleAddTaskToColumn,
    handleEditTask,
    handleDeleteTask,
    handleSaveTask,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    // ... outros
  } = useKanbanBoard();

  const [visibleDaysCount, setVisibleDaysCount] = useState(5);

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Header com busca */}
      <KanbanBoardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isProjectSelected={!!currentProject}
        onTriggerCreateProject={() => setIsCreateProjectDialogOpen(true)}
      />

      {/* Tabs: Project List | Kanban Board | Week Board */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="projectList">Meus Projetos</TabsTrigger>
          <TabsTrigger value="kanbanBoard" disabled={!currentProject}>
            Quadro Kanban
          </TabsTrigger>
          <TabsTrigger value="weekBoard" disabled={!currentProject}>
            Quadro Semanal
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Lista de Projetos */}
        <TabsContent value="projectList" className="h-full flex-1">
          <ProjectListView
            projects={projects}
            onSelectProject={handleSelectProject}
            onTriggerCreateProject={() => setIsCreateProjectDialogOpen(true)}
          />
        </TabsContent>

        {/* Tab 2: Vista Kanban (colunas) */}
        <TabsContent value="kanbanBoard" className="h-full flex-1">
          {currentProject ? (
            <KanbanView
              tasks={currentProjectTasks}
              searchQuery={searchQuery}
              onAddTask={handleAddTaskToColumn}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onDragStartTask={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              dragOverColumn={dragOverColumn}
              isDragging={isDragging}
              draggedTask={draggedTask}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p>Selecione um projeto</p>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Vista Semanal */}
        <TabsContent value="weekBoard" className="h-full flex-1">
          {currentProject ? (
            <KanbanWeekView
              tasks={currentProjectTasks}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              visibleDaysCount={visibleDaysCount}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p>Selecione um projeto</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateProjectDialog
        isOpen={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
        onSave={handleSaveNewProject}
      />

      {currentProject && (
        <KanbanTaskDialog
          isOpen={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          editingTask={editingTask}
          onSaveTask={handleSaveTask}
        />
      )}

      <KanbanDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        taskToDelete={deletingTask}
        onConfirmDelete={confirmDeleteTask}
      />
    </div>
  );
}
```

### 6. Vistas do Kanban

#### Kanban View (Colunas)
- Layout horizontal com 4 colunas: Backlog, To Do, In Progress, Done
- Cada coluna exibe tasks como cards
- Drag & drop entre colunas
- Filtro por busca
- Botão "+" em cada coluna para adicionar task

#### Week View
- Timeline semanal (dias da semana)
- Tasks distribuídas por dia
- Útil para planejamento semanal
- Configurável: 1-7 dias visíveis

---

## Backend - API REST

### 1. Estrutura de Rotas

**Localização:** `backend/src/server/app.py` (no deer-flow-New)
**Para Suna:** Criar em `backend/core/api_routes/` ou similar

### 2. Endpoints de Calendário

```python
from fastapi import FastAPI, HTTPException
from datetime import datetime, timezone
from typing import List, Optional

app = FastAPI()

# GET /api/calendar/events
@app.get("/api/calendar/events")
async def calendar_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    limit: Optional[int] = 100,
    offset: Optional[int] = 0,
):
    """
    Retorna eventos do calendário filtrados por data e categoria.

    Query Params:
    - start_date: ISO 8601 string (opcional)
    - end_date: ISO 8601 string (opcional)
    - category: string (opcional)
    - limit: int (default 100)
    - offset: int (default 0)

    Returns: List[CalendarEvent]
    """
    try:
        # Buscar eventos do banco de dados
        # Exemplo com Supabase:
        query = supabase.table("calendar_events").select("*")

        if start_date:
            query = query.gte("date", start_date)
        if end_date:
            query = query.lte("date", end_date)
        if category:
            query = query.eq("category", category)

        query = query.range(offset, offset + limit - 1)

        response = query.execute()
        return response.data
    except Exception as e:
        logger.exception(f"Error in calendar/events endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# POST /api/calendar/events
@app.post("/api/calendar/events")
async def create_calendar_event(event: dict):
    """
    Cria um novo evento no calendário.

    Body: CalendarEventCreate
    Returns: CalendarEvent
    """
    try:
        now_str = datetime.now(timezone.utc).isoformat()

        new_event = {
            "title": event.get("title", ""),
            "description": event.get("description"),
            "date": event.get("date", now_str),
            "end_date": event.get("end_date", now_str),
            "category": event.get("category", "Other"),
            "color": event.get("color", "#6b7280"),
            "location": event.get("location"),
            "is_all_day": event.get("is_all_day", False),
            "created_at": now_str,
            "updated_at": now_str,
        }

        # Inserir no banco
        response = supabase.table("calendar_events").insert(new_event).execute()

        logger.info(f"Created calendar event: {new_event['title']}")
        return response.data[0]
    except Exception as e:
        logger.exception(f"Error creating calendar event: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# GET /api/calendar/events/{event_id}
@app.get("/api/calendar/events/{event_id}")
async def get_calendar_event(event_id: int):
    """
    Busca um evento específico por ID.

    Path Param: event_id (int)
    Returns: CalendarEvent
    """
    try:
        response = supabase.table("calendar_events").select("*").eq("id", event_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Event not found")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting calendar event: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# PUT /api/calendar/events/{event_id}
@app.put("/api/calendar/events/{event_id}")
async def update_calendar_event(event_id: int, event: dict):
    """
    Atualiza um evento existente.

    Path Param: event_id (int)
    Body: CalendarEventUpdate
    Returns: CalendarEvent
    """
    try:
        now_str = datetime.now(timezone.utc).isoformat()
        event["updated_at"] = now_str

        response = supabase.table("calendar_events").update(event).eq("id", event_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Event not found")

        logger.info(f"Updated calendar event: {event_id}")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating calendar event: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# DELETE /api/calendar/events/{event_id}
@app.delete("/api/calendar/events/{event_id}")
async def delete_calendar_event(event_id: int):
    """
    Deleta um evento.

    Path Param: event_id (int)
    Returns: success message
    """
    try:
        response = supabase.table("calendar_events").delete().eq("id", event_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Event not found")

        logger.info(f"Deleted calendar event: {event_id}")
        return {"message": "Event deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error deleting calendar event: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# GET /api/calendar/events/month/{year}/{month}
@app.get("/api/calendar/events/month/{year}/{month}")
async def get_calendar_events_by_month(year: int, month: int):
    """
    Busca todos os eventos de um mês específico.

    Path Params:
    - year: int (e.g., 2025)
    - month: int (1-12)

    Returns: List[CalendarEvent]
    """
    try:
        from datetime import datetime
        from calendar import monthrange

        # Primeiro dia do mês
        start_date = datetime(year, month, 1).isoformat()

        # Último dia do mês
        last_day = monthrange(year, month)[1]
        end_date = datetime(year, month, last_day, 23, 59, 59).isoformat()

        response = supabase.table("calendar_events") \
            .select("*") \
            .gte("date", start_date) \
            .lte("date", end_date) \
            .execute()

        return response.data
    except Exception as e:
        logger.exception(f"Error getting calendar events by month: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
```

### 3. Endpoints de Projetos e Kanban

```python
# GET /api/projects
@app.get("/api/projects")
async def projects_list(
    status: Optional[str] = None,
    limit: Optional[int] = 100,
    offset: Optional[int] = 0,
):
    """
    Retorna lista de projetos do usuário.

    Query Params:
    - status: string (opcional) - "active", "completed", "archived"
    - limit: int (default 100)
    - offset: int (default 0)

    Returns: List[Project]
    """
    try:
        query = supabase.table("projects").select("*")

        if status:
            query = query.eq("status", status)

        query = query.range(offset, offset + limit - 1)

        response = query.execute()
        return response.data
    except Exception as e:
        logger.exception(f"Error in projects endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# POST /api/projects
@app.post("/api/projects")
async def create_project(project: dict):
    """
    Cria um novo projeto.

    Body: ProjectCreate
    Returns: Project
    """
    try:
        now_str = datetime.now(timezone.utc).isoformat()

        new_project = {
            "name": project.get("name", ""),
            "description": project.get("description", ""),
            "color": project.get("color", "#6b7280"),
            "icon": project.get("icon", "📁"),
            "status": project.get("status", "active"),
            "created_at": now_str,
            "updated_at": now_str,
        }

        response = supabase.table("projects").insert(new_project).execute()

        logger.info(f"Created project: {new_project['name']}")
        return response.data[0]
    except Exception as e:
        logger.exception(f"Error creating project: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# GET /api/projects/{project_id}
@app.get("/api/projects/{project_id}")
async def get_project(project_id: int):
    """
    Busca um projeto específico.

    Path Param: project_id (int)
    Returns: Project
    """
    try:
        response = supabase.table("projects").select("*").eq("id", project_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Project not found")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting project: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# PUT /api/projects/{project_id}
@app.put("/api/projects/{project_id}")
async def update_project(project_id: int, project: dict):
    """
    Atualiza um projeto.

    Path Param: project_id (int)
    Body: ProjectUpdate
    Returns: Project
    """
    try:
        now_str = datetime.now(timezone.utc).isoformat()
        project["updated_at"] = now_str

        response = supabase.table("projects").update(project).eq("id", project_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Project not found")

        logger.info(f"Updated project: {project_id}")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating project: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# DELETE /api/projects/{project_id}
@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: int):
    """
    Deleta um projeto e todas as suas tarefas.

    Path Param: project_id (int)
    Returns: success message
    """
    try:
        # Deletar tarefas associadas
        supabase.table("kanban_tasks").delete().eq("project_id", project_id).execute()

        # Deletar projeto
        response = supabase.table("projects").delete().eq("id", project_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Project not found")

        logger.info(f"Deleted project: {project_id}")
        return {"message": "Project deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error deleting project: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# GET /api/projects/{project_id}/kanban
@app.get("/api/projects/{project_id}/kanban")
async def get_project_kanban(project_id: int):
    """
    Retorna o quadro Kanban de um projeto (colunas e tarefas).

    Path Param: project_id (int)
    Returns: KanbanBoard
    """
    try:
        # Buscar projeto
        project_response = supabase.table("projects").select("*").eq("id", project_id).execute()

        if not project_response.data:
            raise HTTPException(status_code=404, detail="Project not found")

        project = project_response.data[0]

        # Buscar tarefas do projeto
        tasks_response = supabase.table("kanban_tasks") \
            .select("*") \
            .eq("project_id", project_id) \
            .order("order", desc=False) \
            .execute()

        tasks = tasks_response.data

        # Organizar tarefas por coluna
        columns = [
            {
                "id": "backlog",
                "title": "Backlog",
                "color": "#6b7280",
                "tasks": [t for t in tasks if t.get("column_id") == "backlog"],
            },
            {
                "id": "todo",
                "title": "To Do",
                "color": "#3b82f6",
                "tasks": [t for t in tasks if t.get("column_id") == "todo"],
            },
            {
                "id": "in_progress",
                "title": "In Progress",
                "color": "#f59e0b",
                "tasks": [t for t in tasks if t.get("column_id") == "in_progress"],
            },
            {
                "id": "done",
                "title": "Done",
                "color": "#10b981",
                "tasks": [t for t in tasks if t.get("column_id") == "done"],
            },
        ]

        kanban_board = {
            "project_id": project["id"],
            "project_name": project["name"],
            "columns": columns,
        }

        return kanban_board
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting kanban board: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# POST /api/projects/{project_id}/tasks
@app.post("/api/projects/{project_id}/tasks")
async def create_task(project_id: int, task: dict):
    """
    Cria uma nova tarefa em um projeto.

    Path Param: project_id (int)
    Body: {
        "title": string,
        "description": string (optional),
        "priority": "low" | "medium" | "high",
        "column_id": "backlog" | "todo" | "in_progress" | "done"
    }
    Returns: KanbanTask
    """
    try:
        now_str = datetime.now(timezone.utc).isoformat()

        # Buscar ordem atual da coluna
        tasks_in_column = supabase.table("kanban_tasks") \
            .select("order") \
            .eq("project_id", project_id) \
            .eq("column_id", task.get("column_id", "backlog")) \
            .order("order", desc=True) \
            .limit(1) \
            .execute()

        next_order = 0
        if tasks_in_column.data:
            next_order = tasks_in_column.data[0]["order"] + 1

        new_task = {
            "project_id": project_id,
            "title": task.get("title", ""),
            "description": task.get("description"),
            "priority": task.get("priority", "medium"),
            "column_id": task.get("column_id", "backlog"),
            "order": next_order,
            "created_at": now_str,
        }

        response = supabase.table("kanban_tasks").insert(new_task).execute()

        logger.info(f"Created task in project {project_id}: {new_task['title']}")
        return response.data[0]
    except Exception as e:
        logger.exception(f"Error creating task: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# PUT /api/projects/{project_id}/tasks/{task_id}/move
@app.put("/api/projects/{project_id}/tasks/{task_id}/move")
async def move_task(project_id: int, task_id: int, move_data: dict):
    """
    Move uma tarefa para outra coluna ou reordena.

    Path Params:
    - project_id: int
    - task_id: int

    Body: {
        "column_id": string,
        "order": int
    }

    Returns: KanbanTask
    """
    try:
        update_data = {
            "column_id": move_data.get("column_id"),
            "order": move_data.get("order"),
        }

        response = supabase.table("kanban_tasks") \
            .update(update_data) \
            .eq("id", task_id) \
            .eq("project_id", project_id) \
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Task not found")

        logger.info(f"Moved task {task_id} to column {move_data.get('column_id')}")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error moving task: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# PUT /api/tasks/{task_id}
@app.put("/api/tasks/{task_id}")
async def update_task(task_id: int, task: dict):
    """
    Atualiza uma tarefa.

    Path Param: task_id (int)
    Body: {
        "title": string (optional),
        "description": string (optional),
        "priority": string (optional)
    }
    Returns: KanbanTask
    """
    try:
        response = supabase.table("kanban_tasks").update(task).eq("id", task_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Task not found")

        logger.info(f"Updated task: {task_id}")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating task: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# DELETE /api/tasks/{task_id}
@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: int):
    """
    Deleta uma tarefa.

    Path Param: task_id (int)
    Returns: success message
    """
    try:
        response = supabase.table("kanban_tasks").delete().eq("id", task_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Task not found")

        logger.info(f"Deleted task: {task_id}")
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error deleting task: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
```

---

## Estrutura de Banco de Dados

### 1. Tabela: calendar_events

```sql
CREATE TABLE calendar_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    category VARCHAR(50),
    color VARCHAR(7) DEFAULT '#6b7280',
    location VARCHAR(255),
    is_all_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_date ON calendar_events(date);
CREATE INDEX idx_calendar_events_category ON calendar_events(category);

-- RLS (Row Level Security) para Supabase
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seus próprios eventos
CREATE POLICY "Users can view own calendar events"
    ON calendar_events FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Usuários podem inserir seus próprios eventos
CREATE POLICY "Users can insert own calendar events"
    ON calendar_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar seus próprios eventos
CREATE POLICY "Users can update own calendar events"
    ON calendar_events FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Usuários podem deletar seus próprios eventos
CREATE POLICY "Users can delete own calendar events"
    ON calendar_events FOR DELETE
    USING (auth.uid() = user_id);
```

### 2. Tabela: projects

```sql
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6b7280',
    icon VARCHAR(10) DEFAULT '📁',
    status VARCHAR(50) DEFAULT 'active',  -- active, completed, archived
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);
```

### 3. Tabela: kanban_tasks

```sql
CREATE TABLE kanban_tasks (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium',  -- low, medium, high
    column_id VARCHAR(50) NOT NULL,         -- backlog, todo, in_progress, done
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_kanban_tasks_project_id ON kanban_tasks(project_id);
CREATE INDEX idx_kanban_tasks_column_id ON kanban_tasks(column_id);
CREATE INDEX idx_kanban_tasks_order ON kanban_tasks("order");

-- RLS
ALTER TABLE kanban_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver tarefas de seus próprios projetos
CREATE POLICY "Users can view tasks of own projects"
    ON kanban_tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = kanban_tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Policy: Usuários podem inserir tarefas em seus próprios projetos
CREATE POLICY "Users can insert tasks in own projects"
    ON kanban_tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = kanban_tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Policy: Usuários podem atualizar tarefas de seus próprios projetos
CREATE POLICY "Users can update tasks of own projects"
    ON kanban_tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = kanban_tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Policy: Usuários podem deletar tarefas de seus próprios projetos
CREATE POLICY "Users can delete tasks of own projects"
    ON kanban_tasks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = kanban_tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );
```

---

## Passo a Passo para Replicação

### Fase 1: Setup do Banco de Dados (Supabase)

1. **Criar as tabelas no Supabase:**
   - Acessar Supabase Dashboard > SQL Editor
   - Executar os scripts SQL acima para criar:
     - `calendar_events`
     - `projects`
     - `kanban_tasks`
   - Verificar que as policies RLS estão ativas

2. **Testar inserção manual de dados:**
   - Inserir alguns eventos e projetos de teste
   - Verificar que as policies RLS funcionam corretamente

### Fase 2: Backend (FastAPI)

1. **Criar estrutura de rotas:**
   ```
   backend/core/
   ├── api_routes/
   │   ├── __init__.py
   │   ├── calendar.py      # Rotas de calendário
   │   ├── projects.py      # Rotas de projetos
   │   └── tasks.py         # Rotas de tarefas
   ```

2. **Implementar rotas de calendário em `calendar.py`:**
   - GET `/api/calendar/events`
   - POST `/api/calendar/events`
   - GET `/api/calendar/events/{event_id}`
   - PUT `/api/calendar/events/{event_id}`
   - DELETE `/api/calendar/events/{event_id}`
   - GET `/api/calendar/events/month/{year}/{month}`

3. **Implementar rotas de projetos em `projects.py`:**
   - GET `/api/projects`
   - POST `/api/projects`
   - GET `/api/projects/{project_id}`
   - PUT `/api/projects/{project_id}`
   - DELETE `/api/projects/{project_id}`
   - GET `/api/projects/{project_id}/kanban`

4. **Implementar rotas de tarefas em `tasks.py`:**
   - POST `/api/projects/{project_id}/tasks`
   - PUT `/api/projects/{project_id}/tasks/{task_id}/move`
   - PUT `/api/tasks/{task_id}`
   - DELETE `/api/tasks/{task_id}`

5. **Registrar rotas no FastAPI app principal:**
   ```python
   # backend/core/run.py
   from core.api_routes import calendar, projects, tasks

   app.include_router(calendar.router, prefix="/api", tags=["calendar"])
   app.include_router(projects.router, prefix="/api", tags=["projects"])
   app.include_router(tasks.router, prefix="/api", tags=["tasks"])
   ```

6. **Testar endpoints com Thunder Client ou Postman:**
   - Testar CRUD de eventos
   - Testar CRUD de projetos
   - Testar CRUD de tarefas
   - Testar move de tarefas entre colunas

### Fase 3: Frontend - Calendário

1. **Criar estrutura de arquivos:**
   ```
   frontend/src/
   ├── app/
   │   └── (dashboard)/
   │       └── calendar/
   │           └── page.tsx
   ├── components/
   │   └── calendar/
   │       ├── calendar-page.tsx
   │       ├── hooks/
   │       │   ├── use-calendar.ts
   │       │   ├── use-calendar-events-api.ts
   │       │   ├── use-calendar-date-navigation.ts
   │       │   ├── use-calendar-display-logic.ts
   │       │   └── use-calendar-dialogs.ts
   │       ├── ui/
   │       │   ├── calendar-header.tsx
   │       │   ├── day-view.tsx
   │       │   ├── week-view.tsx
   │       │   ├── month-view.tsx
   │       │   ├── event-card.tsx
   │       │   ├── add-event-dialog.tsx
   │       │   └── delete-event-dialog.tsx
   │       └── lib/
   │           ├── types.ts
   │           └── constants.ts
   └── services/
       └── api/
           └── calendar.ts
   ```

2. **Implementar tipos em `lib/types.ts`:**
   - Copiar interfaces `CalendarEvent`, `CalendarEventCreate`, etc.

3. **Implementar serviço de API em `services/api/calendar.ts`:**
   - Adaptar para usar o cliente HTTP do Suna
   - Implementar todos os métodos (list, get, create, update, delete, getByMonth)

4. **Implementar hooks:**
   - `use-calendar-events-api.ts`: Chamadas API
   - `use-calendar-date-navigation.ts`: Navegação de datas
   - `use-calendar-display-logic.ts`: Filtros e formatação
   - `use-calendar-dialogs.ts`: Controle de modais
   - `use-calendar.ts`: Hook principal que combina tudo

5. **Implementar componentes UI:**
   - `calendar-header.tsx`: Header com filtros e navegação
   - `day-view.tsx`: Vista de dia
   - `week-view.tsx`: Vista de semana
   - `month-view.tsx`: Vista de mês
   - `event-card.tsx`: Card individual de evento
   - `add-event-dialog.tsx`: Modal para adicionar evento
   - `delete-event-dialog.tsx`: Modal de confirmação de delete

6. **Implementar componente principal `calendar-page.tsx`:**
   - Usar hook `useCalendar()`
   - Renderizar header
   - Renderizar vista apropriada (day/week/month)
   - Renderizar dialogs

7. **Criar página em `app/(dashboard)/calendar/page.tsx`:**
   - Importar e renderizar `CalendarPage`

8. **Testar funcionamento:**
   - Criar eventos
   - Navegar entre datas
   - Alternar entre vistas (dia/semana/mês)
   - Editar eventos
   - Deletar eventos

### Fase 4: Frontend - Projetos (Kanban)

1. **Criar estrutura de arquivos:**
   ```
   frontend/src/
   ├── app/
   │   └── (dashboard)/
   │       └── projects/
   │           ├── page.tsx
   │           └── loading.tsx
   ├── components/
   │   └── kanban/
   │       ├── ui/
   │       │   ├── kanban-desk-board.tsx
   │       │   ├── kanban-board-header.tsx
   │       │   ├── project-list-view.tsx
   │       │   ├── kanban-view.tsx
   │       │   ├── kanban-week-view.tsx
   │       │   ├── task-card.tsx
   │       │   ├── column-container.tsx
   │       │   ├── kanban-task-dialog.tsx
   │       │   ├── kanban-delete-dialog.tsx
   │       │   └── create-project-dialog.tsx
   │       ├── hooks/
   │       │   └── use-kanban-board.ts
   │       └── lib/
   │           └── types.ts
   └── services/
       └── api/
           ├── projects.ts
           └── tasks.ts
   ```

2. **Implementar tipos em `lib/types.ts`:**
   - Copiar interfaces `Project`, `KanbanTask`, `KanbanBoard`, etc.

3. **Implementar serviços de API:**
   - `services/api/projects.ts`: CRUD de projetos, getKanban
   - `services/api/tasks.ts`: CRUD de tarefas, move

4. **Implementar hook `use-kanban-board.ts`:**
   - Estado dos projetos
   - Estado do projeto atual
   - Estado das tarefas
   - Handlers de CRUD
   - Handlers de drag & drop

5. **Implementar componentes UI:**
   - `kanban-board-header.tsx`: Header com busca
   - `project-list-view.tsx`: Lista de projetos
   - `kanban-view.tsx`: Vista Kanban (colunas)
   - `kanban-week-view.tsx`: Vista semanal
   - `task-card.tsx`: Card de tarefa (draggable)
   - `column-container.tsx`: Container de coluna (droppable)
   - `kanban-task-dialog.tsx`: Modal para criar/editar tarefa
   - `create-project-dialog.tsx`: Modal para criar projeto

6. **Implementar componente principal `kanban-desk-board.tsx`:**
   - Usar hook `useKanbanBoard()`
   - Implementar tabs (Project List | Kanban Board | Week Board)
   - Renderizar vista apropriada por tab
   - Renderizar dialogs

7. **Criar página em `app/(dashboard)/projects/page.tsx`:**
   - Dynamic import de `KanbanDeskBoard`
   - Loading state

8. **Testar funcionamento:**
   - Criar projetos
   - Selecionar projeto
   - Criar tarefas
   - Drag & drop de tarefas entre colunas
   - Editar tarefas
   - Deletar tarefas
   - Vista semanal

### Fase 5: Integração e Polimento

1. **Adicionar links de navegação:**
   - Adicionar links no menu lateral do Suna para:
     - Calendário
     - Projetos

2. **Temas e estilização:**
   - Adaptar cores para o tema do Suna
   - Garantir compatibilidade dark/light mode
   - Ajustar responsividade mobile

3. **Otimizações:**
   - Lazy loading de componentes pesados
   - React Query para cache de dados
   - Debounce em buscas
   - Skeleton loaders

4. **Testes:**
   - Testes de integração frontend-backend
   - Testes de permissões (RLS)
   - Testes de performance
   - Testes mobile

5. **Documentação:**
   - Adicionar comentários no código
   - Documentar APIs no Swagger/OpenAPI
   - Criar guia de uso para usuários

---

## Notas Importantes

### Autenticação e Segurança

- **Todas as rotas devem ser protegidas por autenticação**
- No Suna, usar o sistema de auth existente (Supabase Auth)
- Adicionar `user_id` nas queries de banco para garantir isolamento de dados
- RLS (Row Level Security) no Supabase é **essencial**

### Performance

- **Índices de banco de dados** são críticos para queries rápidas
- Usar **React Query** ou similar para cache de dados no frontend
- Implementar **pagination** em listas longas
- Dynamic imports para componentes pesados (day-view, week-view, month-view)

### Drag & Drop (Kanban)

- O deer-flow-New usa HTML5 Drag & Drop API nativo
- Alternativa: Usar biblioteca como `@dnd-kit/core` (mais robusta)
- Implementar feedback visual durante drag (opacity, outline)
- Persistir mudanças no backend após drop

### Sincronização Real-time (Opcional)

- Para colaboração multi-usuário, considerar:
  - Supabase Realtime
  - WebSockets
  - Server-Sent Events (SSE)
- Atualizar UI quando outros usuários modificam dados

### Internacionalização (i18n)

- Usar biblioteca como `next-intl` ou `react-i18next`
- Suportar múltiplos idiomas (PT-BR, EN, ES)
- Formatação de datas e horários por locale

---

## Recursos Adicionais

### Bibliotecas Úteis

- **Calendário:**
  - `date-fns` - Manipulação de datas
  - `@internationalized/date` - Datas com timezone
  - `react-day-picker` - Seletor de datas

- **Kanban:**
  - `@dnd-kit/core` - Drag & Drop robusto
  - `framer-motion` - Animações suaves
  - `react-beautiful-dnd` - Alternative drag & drop

- **UI:**
  - `shadcn/ui` - Componentes UI (já usado no Suna)
  - `lucide-react` - Ícones
  - `tailwind-merge` - Merge de classes Tailwind

### Referências de Código

- **deer-flow-New:** `~/Public/deer-flow-New`
  - Frontend: `web/src/components/deer-flow/`
  - Backend: `src/server/app.py`

- **Suna:**
  - Frontend: `frontend/src/`
  - Backend: `backend/core/`

---

## Conclusão

Este documento fornece uma visão completa da arquitetura e implementação das páginas de **Calendário** e **Projetos (Kanban)** do deer-flow-New.

Ao seguir o passo a passo de replicação, você terá:
- ✅ Sistema de calendário completo com 3 vistas (dia/semana/mês)
- ✅ Sistema Kanban com drag & drop
- ✅ Backend REST API completo
- ✅ Banco de dados estruturado com RLS
- ✅ Frontend modular e bem organizado
- ✅ Integração com Supabase

**Tempo estimado de implementação:** 2-3 semanas (1 dev fullstack)

**Prioridade sugerida:**
1. Backend + Banco de Dados (1 semana)
2. Frontend Calendário (3-4 dias)
3. Frontend Kanban (3-4 dias)
4. Polimento e testes (2-3 dias)

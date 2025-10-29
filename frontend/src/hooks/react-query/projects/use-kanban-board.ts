import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  KanbanBoard,
  KanbanTask,
  KanbanTaskCreate,
  KanbanTaskUpdate,
  TaskStatus,
} from '@/lib/types/projects';
import { mockProjectsApi } from '@/lib/api/mock-projects';
import { useProjects } from './use-projects';

export const KANBAN_BOARD_QUERY_KEY = 'kanban-board';
export const KANBAN_TASKS_QUERY_KEY = 'kanban-tasks';

export function useKanbanBoard(projectId?: string) {
  const router = useRouter();
  const { data: projectsData } = useProjects();
  const projects = projectsData?.projects || [];

  const selectedProject = projectId
    ? projects.find((p) => p.id === projectId)
    : projects[0];

  const { data: board, isLoading } = useQuery({
    queryKey: [KANBAN_BOARD_QUERY_KEY, selectedProject?.id],
    queryFn: () => mockProjectsApi.getKanbanBoard(selectedProject!.id),
    enabled: !!selectedProject,
  });

  const queryClient = useQueryClient();

  const handleTaskMove = async (taskId: string, newColumnId: TaskStatus) => {
    if (!selectedProject) return;

    try {
      await mockProjectsApi.moveTask(taskId, newColumnId);
      queryClient.invalidateQueries({
        queryKey: [KANBAN_BOARD_QUERY_KEY, selectedProject.id],
      });
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const handleProjectChange = (newProjectId: string) => {
    router.push(`/projects?projectId=${newProjectId}`);
  };

  return {
    board,
    projects,
    selectedProject,
    isLoading,
    handleTaskMove,
    handleProjectChange,
  };
}

export function useKanbanTasks(projectId: string) {
  return useQuery({
    queryKey: [KANBAN_TASKS_QUERY_KEY, projectId],
    queryFn: () => mockProjectsApi.getTasks(projectId),
    enabled: !!projectId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: KanbanTaskCreate) => mockProjectsApi.createTask(data),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({
        queryKey: [KANBAN_BOARD_QUERY_KEY, newTask.project_id],
      });
      queryClient.invalidateQueries({
        queryKey: [KANBAN_TASKS_QUERY_KEY, newTask.project_id],
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: KanbanTaskUpdate }) =>
      mockProjectsApi.updateTask(id, data),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({
        queryKey: [KANBAN_BOARD_QUERY_KEY, updatedTask.project_id],
      });
      queryClient.invalidateQueries({
        queryKey: [KANBAN_TASKS_QUERY_KEY, updatedTask.project_id],
      });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const allTasks = queryClient.getQueryData([KANBAN_TASKS_QUERY_KEY]) as KanbanTask[] | undefined;
      const task = allTasks?.find((t) => t.id === id);
      await mockProjectsApi.deleteTask(id);
      return task;
    },
    onSuccess: (deletedTask) => {
      if (deletedTask) {
        queryClient.invalidateQueries({
          queryKey: [KANBAN_BOARD_QUERY_KEY, deletedTask.project_id],
        });
        queryClient.invalidateQueries({
          queryKey: [KANBAN_TASKS_QUERY_KEY, deletedTask.project_id],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: [KANBAN_BOARD_QUERY_KEY] });
        queryClient.invalidateQueries({ queryKey: [KANBAN_TASKS_QUERY_KEY] });
      }
    },
  });
}

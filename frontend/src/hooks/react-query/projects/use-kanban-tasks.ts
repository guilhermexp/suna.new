import { createMutationHook, createQueryHook } from '@/hooks/use-query';
import { useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { kanbanTaskKeys } from './keys';
import {
  KanbanTask,
  KanbanTaskCreateRequest,
  KanbanTaskUpdateRequest,
  KanbanTasksParams,
  TaskBulkUpdateRequest,
  getKanbanTasks,
  getKanbanTask,
  createKanbanTask,
  updateKanbanTask,
  deleteKanbanTask,
  bulkUpdateKanbanTasks
} from './utils';

export const useKanbanTasks = (
  projectId: string,
  params: KanbanTasksParams = {},
  customOptions?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getKanbanTasks>>, Error, Awaited<ReturnType<typeof getKanbanTasks>>, ReturnType<typeof kanbanTaskKeys.list>>,
    'queryKey' | 'queryFn'
  >,
) => {
  return createQueryHook(
    kanbanTaskKeys.list(projectId, params),
    () => getKanbanTasks(projectId, params),
    {
      staleTime: 30 * 1000, // 30 seconds - tasks change frequently
      gcTime: 2 * 60 * 1000, // 2 minutes
      enabled: !!projectId,
    }
  )(customOptions);
};

export const useKanbanTask = (projectId: string, taskId: string) => {
  return createQueryHook(
    kanbanTaskKeys.detail(projectId, taskId),
    () => getKanbanTask(projectId, taskId),
    {
      enabled: !!projectId && !!taskId,
      staleTime: 30 * 1000,
      gcTime: 2 * 60 * 1000,
    }
  )();
};

export const useCreateKanbanTask = () => {
  const queryClient = useQueryClient();

  return createMutationHook(
    ({ projectId, ...data }: { projectId: string } & KanbanTaskCreateRequest) =>
      createKanbanTask(projectId, data),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: kanbanTaskKeys.lists() });
        queryClient.setQueryData(kanbanTaskKeys.detail(variables.projectId, data.id), data);
        toast.success('Task created successfully');
      },
      onError: (error) => {
        console.error('Error creating kanban task:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to create task');
      },
    }
  )();
};

export const useUpdateKanbanTask = () => {
  const queryClient = useQueryClient();

  return createMutationHook(
    ({ projectId, taskId, ...data }: { projectId: string; taskId: string } & KanbanTaskUpdateRequest) =>
      updateKanbanTask(projectId, taskId, data),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: kanbanTaskKeys.lists() });
        queryClient.setQueryData(kanbanTaskKeys.detail(variables.projectId, variables.taskId), data);
        toast.success('Task updated successfully');
      },
      onError: (error) => {
        console.error('Error updating kanban task:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to update task');
      },
    }
  )();
};

export const useDeleteKanbanTask = () => {
  const queryClient = useQueryClient();

  return createMutationHook(
    ({ projectId, taskId }: { projectId: string; taskId: string }) =>
      deleteKanbanTask(projectId, taskId),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: kanbanTaskKeys.lists() });
        queryClient.removeQueries({ queryKey: kanbanTaskKeys.detail(variables.projectId, variables.taskId) });
        toast.success('Task deleted successfully');
      },
      onError: (error) => {
        console.error('Error deleting kanban task:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete task');
      },
    }
  )();
};

export const useBulkUpdateKanbanTasks = () => {
  const queryClient = useQueryClient();

  return createMutationHook(
    ({ projectId, ...data }: { projectId: string } & TaskBulkUpdateRequest) =>
      bulkUpdateKanbanTasks(projectId, data),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: kanbanTaskKeys.lists() });

        if (data.updated_count > 0) {
          toast.success(`${data.updated_count} task${data.updated_count > 1 ? 's' : ''} updated successfully`);
        }

        if (data.failed_count > 0) {
          toast.error(`${data.failed_count} task${data.failed_count > 1 ? 's' : ''} failed to update`);
        }
      },
      onError: (error) => {
        console.error('Error bulk updating kanban tasks:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to update tasks');
      },
    }
  )();
};

// Specialized hook for drag and drop operations
export const useReorderKanbanTasks = () => {
  const queryClient = useQueryClient();

  return createMutationHook(
    async ({
      projectId,
      tasks
    }: {
      projectId: string;
      tasks: KanbanTask[];
    }) => {
      // Update each task with its new position and possibly status
      const updatePromises = tasks.map(task =>
        updateKanbanTask(projectId, task.id, {
          status: task.status,
          position: task.position
        })
      );

      await Promise.all(updatePromises);
      return tasks;
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: kanbanTaskKeys.lists() });
        // Don't show toast for drag and drop as it's too frequent
      },
      onError: (error) => {
        console.error('Error reordering kanban tasks:', error);
        toast.error('Failed to reorder tasks');
      },
    }
  )();
};

// Hook for creating a quick task (with minimal data)
export const useCreateQuickKanbanTask = () => {
  const createTaskMutation = useCreateKanbanTask();

  return createMutationHook(
    ({ projectId, title }: { projectId: string; title: string }) => {
      return createTaskMutation.mutateAsync({
        projectId,
        title,
        status: 'todo',
        priority: 'medium'
      });
    },
    {
      onError: (error) => {
        console.error('Error creating quick kanban task:', error);
        toast.error('Failed to create task');
      },
    }
  )();
};
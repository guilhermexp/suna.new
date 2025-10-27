export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: Record<string, any> = {}) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
} as const;

export const kanbanTaskKeys = {
  all: ['kanbanTasks'] as const,
  lists: () => [...kanbanTaskKeys.all, 'list'] as const,
  list: (projectId: string, params: Record<string, any> = {}) =>
    [...kanbanTaskKeys.lists(), projectId, params] as const,
  details: () => [...kanbanTaskKeys.all, 'detail'] as const,
  detail: (projectId: string, taskId: string) =>
    [...kanbanTaskKeys.details(), projectId, taskId] as const,
} as const;
import { createMutationHook, createQueryHook } from '@/hooks/use-query';
import { useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectKeys } from './keys';
import {
  Project,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectsParams,
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  generateProjectIcon,
  ProjectIconGenerationRequest
} from './utils';
import { useRouter } from 'next/navigation';

export const useProjects = (
  params: ProjectsParams = {},
  customOptions?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getProjects>>, Error, Awaited<ReturnType<typeof getProjects>>, ReturnType<typeof projectKeys.list>>,
    'queryKey' | 'queryFn'
  >,
) => {
  return createQueryHook(
    projectKeys.list(params),
    () => getProjects(params),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
    }
  )(customOptions);
};

export const useProject = (projectId: string) => {
  return createQueryHook(
    projectKeys.detail(projectId),
    () => getProject(projectId),
    {
      enabled: !!projectId,
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    }
  )();
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return createMutationHook(
    (data: ProjectCreateRequest) => createProject(data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        queryClient.setQueryData(projectKeys.detail(data.id), data);
        toast.success('Project created successfully');

        // Navigate to the new project
        router.push(`/projects/${data.id}`);
      },
      onError: (error) => {
        console.error('Error creating project:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to create project');
      },
    }
  )();
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return createMutationHook(
    ({ projectId, ...data }: { projectId: string } & ProjectUpdateRequest) =>
      updateProject(projectId, data),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        queryClient.setQueryData(projectKeys.detail(variables.projectId), data);
        toast.success('Project updated successfully');
      },
      onError: (error) => {
        console.error('Error updating project:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to update project');
      },
    }
  )();
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return createMutationHook(
    (projectId: string) => deleteProject(projectId),
    {
      onSuccess: (_, projectId) => {
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) });
        toast.success('Project deleted successfully');

        // Navigate back to projects list
        router.push('/projects');
      },
      onError: (error) => {
        console.error('Error deleting project:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete project');
      },
    }
  )();
};

export const useGenerateProjectIcon = () => {
  return createMutationHook(
    (data: ProjectIconGenerationRequest) => generateProjectIcon(data),
    {
      onError: (error) => {
        console.error('Error generating project icon:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to generate project icon');
      },
    }
  )();
};

// Hook for creating a new project with default values
export const useCreateNewProject = () => {
  const createProjectMutation = useCreateProject();
  const generateIconMutation = useGenerateProjectIcon();

  return createMutationHook(
    async (data: { name: string; description?: string }) => {
      // Generate icon for the project
      let iconData;
      try {
        iconData = await generateIconMutation.mutateAsync({
          name: data.name,
          description: data.description
        });
      } catch (error) {
        // Fall back to defaults if icon generation fails
        console.warn('Failed to generate icon, using defaults:', error);
        iconData = {
          icon_name: 'folder',
          icon_color: '#000000',
          icon_background: '#F3F4F6'
        };
      }

      // Create project with generated or default icon
      const projectData: ProjectCreateRequest = {
        name: data.name,
        description: data.description,
        icon_name: iconData.icon_name,
        icon_color: iconData.icon_color,
        icon_background: iconData.icon_background,
        is_public: false,
        settings: {}
      };

      return await createProjectMutation.mutateAsync(projectData);
    },
    {
      onError: (error) => {
        console.error('Error creating new project:', error);
        toast.error('Failed to create project. Please try again.');
      },
    }
  )();
};
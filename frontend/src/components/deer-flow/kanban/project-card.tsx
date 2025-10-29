'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, MoreVertical } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Project, ProjectStatus } from '@/lib/types/projects';
import { EditProjectDialog } from './edit-project-dialog';
import { useDeleteProject } from '@/hooks/react-query/projects/use-projects';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = React.memo(function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteProjectMutation = useDeleteProject();

  const completionRate = project.completion_rate || 0;
  const taskCount = project.task_count || 0;
  const completedTaskCount = project.completed_task_count || 0;

  const handleCardClick = () => {
    router.push(`/projects?projectId=${project.id}`);
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProjectMutation.mutateAsync(project.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return 'bg-emerald-500';
      case ProjectStatus.COMPLETED:
        return 'bg-sky-500';
      case ProjectStatus.ARCHIVED:
        return 'bg-muted-foreground';
      default:
        return 'bg-muted-foreground';
    }
  };

  const statusLabel = project.status
    ? project.status.charAt(0).toUpperCase() + project.status.slice(1)
    : 'Active';

  return (
    <>
      <Card
        className="group relative cursor-pointer gap-0 overflow-hidden border bg-card/95 p-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        onClick={handleCardClick}
      >
        <CardHeader className="border-b bg-muted/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-lg font-semibold text-white shadow-sm',
                  project.icon_background
                    ? ''
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                )}
                style={{
                  backgroundColor: project.icon_background || undefined,
                  color: project.icon_color || undefined,
                }}
              >
                {project.name.substring(0, 2).toUpperCase()}
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {project.name}
                  </CardTitle>
                  {taskCount > 0 && (
                    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {Math.round(completionRate)}%
                    </span>
                  )}
                </div>
                <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wide">
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      getStatusColor(project.status as ProjectStatus)
                    )}
                  />
                  {statusLabel}
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                onClick={(event) => event.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full p-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4}>
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowEditDialog(true);
                  }}
                >
                  Editar projeto
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(`/projects?projectId=${project.id}`);
                  }}
                >
                  Abrir Kanban
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                >
                  Excluir projeto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          {project.description ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Defina uma descrição para orientar sua equipe sobre metas e escopo.
            </p>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4" />
                <span>
                  {taskCount} tarefa{taskCount === 1 ? '' : 's'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {completedTaskCount} concluída
                  {completedTaskCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                style={{ width: `${Math.min(Math.max(completionRate, 0), 100)}%` }}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t bg-muted/30 p-4 text-xs text-muted-foreground">
          <span>ID: {project.id}</span>
          <span>Atualizado em {new Date(project.updated_at).toLocaleDateString()}</span>
        </CardFooter>
      </Card>

      <EditProjectDialog
        project={project}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project "{project.name}" and all its tasks.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

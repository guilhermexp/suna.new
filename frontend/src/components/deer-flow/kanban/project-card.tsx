'use client';

import React, { useState } from 'react';
import { MoreVertical, CheckCircle2, Circle } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
        return 'bg-green-500';
      case ProjectStatus.COMPLETED:
        return 'bg-blue-500';
      case ProjectStatus.ARCHIVED:
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <>
      <Card
        className="group relative overflow-hidden transition-all hover:shadow-md cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold text-lg flex-shrink-0',
                'bg-gradient-to-br from-blue-500 to-purple-600'
              )}
              style={{
                backgroundColor: project.icon_background || undefined,
              }}
            >
              {project.name.substring(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setShowEditDialog(true);
                    }}>
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/projects?projectId=${project.id}`);
                    }}>
                      View Kanban
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteDialog(true);
                      }}
                    >
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    'inline-block w-2 h-2 rounded-full',
                    getStatusColor(project.status as ProjectStatus)
                  )}
                />
                <span className="text-xs text-muted-foreground capitalize">
                  {project.status}
                </span>
              </div>
            </div>
          </div>

          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {project.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Circle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{taskCount} tasks</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">{completedTaskCount} done</span>
              </div>
            </div>
            {taskCount > 0 && (
              <span className="text-sm font-medium">{Math.round(completionRate)}%</span>
            )}
          </div>

          {taskCount > 0 && (
            <div className="mt-3 w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          )}
        </div>
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

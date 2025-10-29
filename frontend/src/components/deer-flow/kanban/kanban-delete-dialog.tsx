'use client';

import React from 'react';
import { toast } from 'sonner';
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
import { KanbanTask } from '@/lib/types/projects';
import { useDeleteTask } from '@/hooks/react-query/projects/use-kanban-board';

interface KanbanDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: KanbanTask;
}

export function KanbanDeleteDialog({
  open,
  onOpenChange,
  task,
}: KanbanDeleteDialogProps) {
  const deleteTaskMutation = useDeleteTask();

  const handleDelete = async () => {
    try {
      await deleteTaskMutation.mutateAsync(task.id);
      toast.success('Task deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete task');
      console.error('Delete task error:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Task</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{task.title}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

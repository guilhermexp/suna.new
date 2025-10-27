'use client';

import React, { useState } from 'react';
import { MoreVertical, Calendar as CalendarIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { KanbanTask, PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/types/projects';
import { KanbanTaskDialog } from './kanban-task-dialog';
import { KanbanDeleteDialog } from './kanban-delete-dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskCardProps {
  task: KanbanTask;
  isDragging?: boolean;
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <Card
        className={cn(
          'p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md',
          isDragging && 'opacity-50 rotate-3 shadow-lg'
        )}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm flex-1 line-clamp-2">{task.title}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <Badge
              variant="secondary"
              className={cn('text-xs', PRIORITY_COLORS[task.priority])}
            >
              {PRIORITY_LABELS[task.priority]}
            </Badge>

            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="h-3 w-3" />
                <span>{format(new Date(task.due_date), 'MMM d')}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <KanbanTaskDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        projectId={task.project_id}
        columnId={task.column_id}
        task={task}
      />

      <KanbanDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        task={task}
      />
    </>
  );
}

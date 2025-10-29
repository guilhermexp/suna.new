'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, MoreVertical } from 'lucide-react';
import {
  Card,
  CardContent,
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
import { Badge } from '@/components/ui/badge';
import {
  KanbanTask,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from '@/lib/types/projects';
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
          'group cursor-grab select-none gap-0 border bg-card/95 p-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing',
          isDragging && 'rotate-3 opacity-60 shadow-lg'
        )}
      >
        <CardHeader className="border-b p-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-semibold leading-tight text-foreground">
              {task.title}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                onClick={(event) => event.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full p-0 text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  Editar tarefa
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        {task.description && (
          <CardContent className="p-3 pt-2 text-xs text-muted-foreground">
            <p className="line-clamp-3 leading-relaxed">{task.description}</p>
          </CardContent>
        )}

        <CardFooter className="flex items-center justify-between gap-2 border-t p-3">
          <Badge
            variant="secondary"
            className={cn(
              'text-[11px] font-medium uppercase tracking-wide',
              PRIORITY_COLORS[task.priority],
            )}
          >
            {PRIORITY_LABELS[task.priority]}
          </Badge>

          {task.due_date ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>{format(new Date(task.due_date), "dd MMM")}</span>
            </div>
          ) : (
            <span className="text-[11px] uppercase text-muted-foreground/70">
              Sem prazo
            </span>
          )}
        </CardFooter>
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

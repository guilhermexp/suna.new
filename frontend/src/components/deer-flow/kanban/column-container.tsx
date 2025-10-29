'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SortableTaskCard } from './sortable-task-card';
import { KanbanTaskDialog } from './kanban-task-dialog';
import { KanbanColumn, COLUMN_TITLES } from '@/lib/types/projects';
import { cn } from '@/lib/utils';

interface ColumnContainerProps {
  column: KanbanColumn;
  projectId: string;
}

export function ColumnContainer({ column, projectId }: ColumnContainerProps) {
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const taskIds = column.tasks.map((task) => task.id);

  return (
    <>
      <Card
        ref={setNodeRef}
        className={cn(
          'gap-0 p-0 flex h-full flex-col overflow-hidden border bg-card shadow-sm transition-colors',
          isOver && 'border-primary/60 shadow-md'
        )}
      >
        <CardHeader className="border-b bg-muted/40">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold text-foreground">
                {COLUMN_TITLES[column.id]}
              </CardTitle>
              <CardDescription className="text-xs">
                Atualizado em tempo real
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {column.taskCount}
              </span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setShowTaskDialog(true)}
                className="h-8 w-8"
                aria-label="Adicionar tarefa"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 min-h-0 flex-col p-0">
          <div className="flex-1 space-y-3 overflow-auto p-4">
            <SortableContext
              items={taskIds}
              strategy={verticalListSortingStrategy}
            >
              {column.tasks.map((task) => (
                <SortableTaskCard key={task.id} task={task} />
              ))}
            </SortableContext>

            {column.tasks.length === 0 && (
              <div className="flex h-full min-h-[8rem] flex-col items-center justify-center rounded-md border border-dashed text-center text-sm text-muted-foreground">
                Nenhuma tarefa aqui ainda
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowTaskDialog(true)}
                  className="mt-3 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Criar tarefa
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <KanbanTaskDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        projectId={projectId}
        columnId={column.id}
      />
    </>
  );
}

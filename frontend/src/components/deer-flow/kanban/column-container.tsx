'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
          'flex flex-col h-full min-h-[500px] transition-colors',
          isOver && 'ring-2 ring-primary bg-accent/50'
        )}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{COLUMN_TITLES[column.id]}</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {column.taskCount}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowTaskDialog(true)}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 p-4 space-y-3 overflow-auto">
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {column.tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
          </SortableContext>

          {column.tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
              <p className="text-sm">No tasks yet</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTaskDialog(true)}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add task
              </Button>
            </div>
          )}
        </div>
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

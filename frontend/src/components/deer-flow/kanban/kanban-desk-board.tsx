'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColumnContainer } from './column-container';
import { TaskCard } from './task-card';
import { KanbanWeekView } from './kanban-week-view';
import { useKanbanBoard } from '@/hooks/react-query/projects/use-kanban-board';
import { KanbanTask, TaskStatus, STATUS_ORDER } from '@/lib/types/projects';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, LayoutGrid } from 'lucide-react';

export function KanbanDeskBoard() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [viewType, setViewType] = useState<'board' | 'week'>('board');

  const {
    board,
    projects,
    selectedProject,
    isLoading,
    handleTaskMove,
    handleProjectChange,
  } = useKanbanBoard(projectId || undefined);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = board?.columns
      .flatMap((col) => col.tasks)
      .find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !board) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const newColumnId = over.id as TaskStatus;

    if (STATUS_ORDER.includes(newColumnId)) {
      handleTaskMove(taskId, newColumnId);
    }

    setActiveTask(null);
  };

  if (isLoading) {
    return (
      <div className="px-4 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedProject || !board) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <h3 className="text-lg font-semibold mb-2">No project selected</h3>
        <p className="text-muted-foreground">
          Please select a project to view its Kanban board.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <Select value={selectedProject.id} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-semibold"
                      style={{
                        backgroundColor: project.icon_background || '#F3F4F6',
                        color: project.icon_color || '#000000'
                      }}
                    >
                      {project.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span>{project.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'board' | 'week')}>
            <TabsList>
              <TabsTrigger value="board" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Board
              </TabsTrigger>
              <TabsTrigger value="week" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Week
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="text-sm text-muted-foreground">
          {board.total_tasks} {board.total_tasks === 1 ? 'task' : 'tasks'}
        </div>
      </div>

      {viewType === 'board' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {board.columns.map((column) => (
              <ColumnContainer
                key={column.id}
                column={column}
                projectId={selectedProject.id}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <KanbanWeekView board={board} projectId={selectedProject.id} />
      )}
    </div>
  );
}

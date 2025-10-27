'use client';

import React, { useMemo } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Card } from '@/components/ui/card';
import { TaskCard } from './task-card';
import { KanbanBoard, KanbanTask } from '@/lib/types/projects';
import { cn } from '@/lib/utils';

interface KanbanWeekViewProps {
  board: KanbanBoard;
  projectId: string;
  visibleDays?: number;
}

export function KanbanWeekView({
  board,
  projectId,
  visibleDays = 7,
}: KanbanWeekViewProps) {
  const weekDays = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    return Array.from({ length: visibleDays }, (_, i) => addDays(weekStart, i));
  }, [visibleDays]);

  const allTasks = useMemo(() => {
    return board.columns.flatMap((col) => col.tasks);
  }, [board]);

  const getTasksForDay = (date: Date): KanbanTask[] => {
    return allTasks.filter((task) => {
      if (!task.due_date) return false;
      return isSameDay(new Date(task.due_date), date);
    });
  };

  const tasksWithoutDueDate = useMemo(() => {
    return allTasks.filter((task) => !task.due_date);
  }, [allTasks]);

  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const tasksForDay = getTasksForDay(day);
          const today = isToday(day);

          return (
            <Card
              key={day.toISOString()}
              className={cn(
                'flex flex-col min-h-[400px]',
                today && 'ring-2 ring-primary'
              )}
            >
              <div
                className={cn(
                  'p-4 border-b',
                  today && 'bg-primary text-primary-foreground'
                )}
              >
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {format(day, 'EEE')}
                  </div>
                  <div className={cn('text-2xl font-bold mt-1', today && 'text-primary-foreground')}>
                    {format(day, 'd')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(day, 'MMM yyyy')}
                  </div>
                </div>
                <div className="text-center mt-2">
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">
                    {tasksForDay.length} {tasksForDay.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-3 overflow-auto">
                {tasksForDay.length > 0 ? (
                  tasksForDay.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-32 text-center text-muted-foreground">
                    <p className="text-sm">No tasks</p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {tasksWithoutDueDate.length > 0 && (
        <Card className="p-4">
          <div className="mb-4">
            <h3 className="font-semibold text-lg">No Due Date</h3>
            <p className="text-sm text-muted-foreground">
              Tasks without a specific due date ({tasksWithoutDueDate.length})
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {tasksWithoutDueDate.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

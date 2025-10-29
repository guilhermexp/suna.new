'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from './task-card';
import { KanbanBoard, KanbanTask } from '@/lib/types/projects';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface KanbanWeekViewProps {
  board: KanbanBoard;
  projectId: string;
  visibleDays?: number;
  className?: string;
}

export function KanbanWeekView({
  board,
  projectId,
  visibleDays = 7,
  className,
}: KanbanWeekViewProps) {
  const weekDays = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: visibleDays }, (_, i) => addDays(weekStart, i));
  }, [visibleDays]);

  const windowLength = Math.min(3, weekDays.length || 3);
  const [windowStart, setWindowStart] = useState(0);

  const maxWindowStart = Math.max(0, weekDays.length - windowLength);
  const clampedWindowStart = Math.min(windowStart, maxWindowStart);

  useEffect(() => {
    if (windowStart !== clampedWindowStart) {
      setWindowStart(clampedWindowStart);
    }
  }, [clampedWindowStart, windowStart]);

  const visibleWindow = weekDays.slice(
    clampedWindowStart,
    clampedWindowStart + windowLength
  );

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
  const capitalize = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);

  const formatShortLabel = (date: Date) =>
    format(date, 'EEE', { locale: ptBR }).replace(/\.$/, '');

  return (
    <div className={cn('flex h-full flex-col gap-4', className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {visibleWindow.map((day) => {
            const shortLabel = formatShortLabel(day).toUpperCase();
            return (
              <span
                key={day.toISOString()}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide',
                  isToday(day)
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-border bg-muted text-muted-foreground'
                )}
              >
                <span className="uppercase">{shortLabel}</span>
                <span className="text-foreground">{format(day, 'dd/MM')}</span>
              </span>
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setWindowStart((prev) => Math.max(0, prev - 1))}
            disabled={clampedWindowStart === 0}
            aria-label="Mostrar dias anteriores"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              setWindowStart((prev) => Math.min(maxWindowStart, prev + 1))
            }
            disabled={clampedWindowStart >= maxWindowStart}
            aria-label="Mostrar próximos dias"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col gap-4">
        <div className="flex-1 min-h-0">
          <div
            className="grid h-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            style={{ gridAutoRows: 'minmax(0, 1fr)' }}
          >
            {visibleWindow.map((day) => {
              const tasksForDay = getTasksForDay(day);
              const today = isToday(day);
              const dayTitle = capitalize(format(day, 'EEEE', { locale: ptBR }));
              const dateLabel = capitalize(
                format(day, "d 'de' MMMM", { locale: ptBR })
              );

              return (
                <Card
                  key={day.toISOString()}
                  className={cn(
                    'flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-colors',
                    today && 'border-primary/50 shadow-md'
                  )}
                >
                  <CardHeader
                    className={cn(
                      'space-y-3 border-b bg-muted/40 p-4',
                      today && 'bg-primary/10'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-semibold capitalize text-foreground">
                          {dayTitle}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {dateLabel}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={today ? 'default' : 'secondary'}
                        className="text-[10px] uppercase"
                      >
                        {today ? 'Hoje' : format(day, 'dd/MM')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {tasksForDay.length}{' '}
                        {tasksForDay.length === 1 ? 'tarefa' : 'tarefas'}
                      </span>
                      {today && (
                        <span className="font-medium text-primary">
                          Priorize as entregas de hoje
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 min-h-0 flex-col p-0">
                    <div className="flex-1 min-h-0 space-y-3 overflow-auto p-4">
                      {tasksForDay.length > 0 ? (
                        tasksForDay.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))
                      ) : (
                        <div className="flex h-full min-h-[8rem] flex-col items-center justify-center rounded-md border border-dashed text-center text-sm text-muted-foreground">
                          Sem tarefas programadas
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {tasksWithoutDueDate.length > 0 && (
          <Card className="overflow-hidden border bg-card shadow-sm">
            <CardHeader className="space-y-1 border-b bg-muted/40 p-4">
              <CardTitle className="text-base font-semibold">
                Sem data definida
              </CardTitle>
              <CardDescription className="text-sm">
                Tarefas sem data específica ({tasksWithoutDueDate.length})
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tasksWithoutDueDate.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

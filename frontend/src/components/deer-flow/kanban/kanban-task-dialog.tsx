'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import {
  KanbanTask,
  KanbanTaskCreate,
  KanbanTaskUpdate,
  TaskStatus,
  COLUMN_TITLES,
} from '@/lib/types/projects';
import { useCreateKanbanTask, useUpdateKanbanTask } from '@/hooks/react-query/projects';
import { cn } from '@/lib/utils';

interface KanbanTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  columnId: TaskStatus;
  task?: KanbanTask;
}

export function KanbanTaskDialog({
  open,
  onOpenChange,
  projectId,
  columnId,
  task,
}: KanbanTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [status, setStatus] = useState<TaskStatus>(columnId);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  const createTaskMutation = useCreateKanbanTask();
  const updateTaskMutation = useUpdateKanbanTask();

  const isEdit = !!task;

  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority as 'low' | 'medium' | 'high' | 'urgent');
        setStatus(task.status as TaskStatus || task.column_id as TaskStatus);
        setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      } else {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setStatus(columnId);
        setDueDate(undefined);
      }
    }
  }, [open, task, columnId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      if (isEdit && task) {
        const updates: KanbanTaskUpdate = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          status,
          due_date: dueDate?.toISOString(),
        };
        await updateTaskMutation.mutateAsync({ projectId, taskId: task.id, ...updates });
        toast.success('Task updated successfully');
      } else {
        const taskData: KanbanTaskCreate = {
          project_id: projectId,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          status,
          due_date: dueDate?.toISOString(),
        };
        await createTaskMutation.mutateAsync({ projectId, ...taskData });
        toast.success('Task created successfully');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEdit ? 'Failed to update task' : 'Failed to create task');
      console.error('Task operation error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Update task details' : 'Add a new task to your project'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high' | 'urgent')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TaskStatus).map((s) => (
                      <SelectItem key={s} value={s}>
                        {COLUMN_TITLES[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
            >
              {createTaskMutation.isPending || updateTaskMutation.isPending
                ? 'Saving...'
                : isEdit
                ? 'Update Task'
                : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

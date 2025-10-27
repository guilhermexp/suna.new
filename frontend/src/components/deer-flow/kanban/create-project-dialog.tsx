'use client';

import React, { useState } from 'react';
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
import { ProjectCreate } from '@/lib/types/projects';
import { useCreateProject } from '@/hooks/react-query/projects/use-projects';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVATAR_COLORS = [
  'bg-gradient-to-br from-blue-500 to-purple-600',
  'bg-gradient-to-br from-green-500 to-teal-600',
  'bg-gradient-to-br from-orange-500 to-red-600',
  'bg-gradient-to-br from-pink-500 to-purple-600',
  'bg-gradient-to-br from-yellow-500 to-orange-600',
  'bg-gradient-to-br from-indigo-500 to-blue-600',
];

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIconBackground, setSelectedIconBackground] = useState('#F3F4F6');
  const [selectedIconColor, setSelectedIconColor] = useState('#000000');
  const createProjectMutation = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    const projectData: ProjectCreate = {
      name: name.trim(),
      description: description.trim() || undefined,
      icon_color: selectedIconColor,
      icon_background: selectedIconBackground,
      is_public: false,
    };

    try {
      await createProjectMutation.mutateAsync(projectData);
      toast.success('Project created successfully');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create project');
      console.error('Create project error:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedIconBackground('#F3F4F6');
    setSelectedIconColor('#000000');
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your tasks and workflows.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="Enter project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter project description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Project Color</Label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-10 h-10 rounded-lg ${color} transition-all ${
                      selectedIconBackground === '#F3F4F6' && color === 'bg-gradient-to-br from-blue-500 to-purple-600'
                        ? 'ring-2 ring-primary ring-offset-2 scale-110'
                        : 'hover:scale-105'
                    }`}
                    onClick={() => {
                      // Extract colors from gradient classes
                      const colorMap: Record<string, { bg: string; color: string }> = {
                        'bg-gradient-to-br from-blue-500 to-purple-600': { bg: '#3B82F6', color: '#FFFFFF' },
                        'bg-gradient-to-br from-green-500 to-teal-600': { bg: '#10B981', color: '#FFFFFF' },
                        'bg-gradient-to-br from-orange-500 to-red-600': { bg: '#F97316', color: '#FFFFFF' },
                        'bg-gradient-to-br from-pink-500 to-purple-600': { bg: '#EC4899', color: '#FFFFFF' },
                        'bg-gradient-to-br from-yellow-500 to-orange-600': { bg: '#EAB308', color: '#FFFFFF' },
                        'bg-gradient-to-br from-indigo-500 to-blue-600': { bg: '#6366F1', color: '#FFFFFF' },
                      };
                      const colors = colorMap[color] || { bg: '#3B82F6', color: '#FFFFFF' };
                      setSelectedIconBackground(colors.bg);
                      setSelectedIconColor(colors.color);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl"
                style={{
                  backgroundColor: selectedIconBackground,
                  color: selectedIconColor
                }}
              >
                {name.substring(0, 2).toUpperCase() || 'PR'}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createProjectMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createProjectMutation.isPending}>
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

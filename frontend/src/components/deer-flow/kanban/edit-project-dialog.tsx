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
import { Project, ProjectUpdate } from '@/lib/types/projects';
import { useUpdateProject, useDeleteProject } from '@/hooks/react-query/projects/use-projects';

interface EditProjectDialogProps {
  project: Project;
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

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
}: EditProjectDialogProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [isArchived, setIsArchived] = useState(project.is_archived);
  const [selectedIconBackground, setSelectedIconBackground] = useState(
    project.icon_background || '#F3F4F6'
  );
  const [selectedIconColor, setSelectedIconColor] = useState(
    project.icon_color || '#000000'
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  useEffect(() => {
    if (open) {
      setName(project.name);
      setDescription(project.description || '');
      setIsArchived(project.is_archived);
      setSelectedIconBackground(project.icon_background || '#F3F4F6');
      setSelectedIconColor(project.icon_color || '#000000');
    }
  }, [open, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    const updates: ProjectUpdate = {
      name: name.trim(),
      description: description.trim() || undefined,
      icon_color: selectedIconColor,
      icon_background: selectedIconBackground,
      is_archived: isArchived,
    };

    try {
      await updateProjectMutation.mutateAsync({ projectId: project.id, ...updates });
      toast.success('Project updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update project');
      console.error('Update project error:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProjectMutation.mutateAsync(project.id);
      toast.success('Project deleted successfully');
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete project');
      console.error('Delete project error:', error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update your project details and settings.
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
                        selectedIconColor === color
                          ? 'ring-2 ring-primary ring-offset-2 scale-110'
                          : 'hover:scale-105'
                      }`}
                      onClick={() => setSelectedIconColor(color)}
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

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={updateProjectMutation.isPending}
                className="sm:mr-auto"
              >
                Delete
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={updateProjectMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProjectMutation.isPending}>
                  {updateProjectMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project "{project.name}" and all its tasks.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

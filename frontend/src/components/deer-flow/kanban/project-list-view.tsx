'use client';

import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectCard } from './project-card';
import { CreateProjectDialog } from './create-project-dialog';
import { useProjects } from '@/hooks/react-query/projects/use-projects';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProjectListViewProps {
  searchQuery: string;
  showCreateDialog: boolean;
  onOpenCreateDialog: (open: boolean) => void;
}

export function ProjectListView({
  searchQuery,
  showCreateDialog,
  onOpenCreateDialog,
}: ProjectListViewProps) {
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { data: projectsData, isLoading } = useProjects({ search: debouncedSearch });

  const projects = useMemo(() => projectsData?.projects || [], [projectsData]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <div className="flex h-full flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
          {isLoading ? (
            <ProjectListSkeleton />
          ) : projects.length === 0 ? (
            <EmptyState
              hasSearch={Boolean(searchQuery)}
              onCreateProject={() => onOpenCreateDialog(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={onOpenCreateDialog}
      />
    </div>
  );
}

function ProjectListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="gap-0 p-0">
          <CardHeader className="space-y-3 border-b bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({
  hasSearch,
  onCreateProject,
}: {
  hasSearch: boolean;
  onCreateProject: () => void;
}) {
  return (
    <Card className="flex flex-1 flex-col items-center justify-center border-dashed bg-muted/40 text-center">
      <CardContent className="flex flex-col items-center gap-5 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {hasSearch ? 'Nenhum resultado encontrado' : 'Nenhum projeto cadastrado'}
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {hasSearch
              ? 'Verifique o termo informado ou limpe os filtros de pesquisa.'
              : 'Crie um novo projeto para começar a organizar as tarefas da sua equipe.'}
          </p>
        </div>
        <Button
          onClick={onCreateProject}
          variant={hasSearch ? 'outline' : 'default'}
          className={cn('gap-2', hasSearch && 'text-muted-foreground')}
        >
          <Plus className="h-4 w-4" />
          {hasSearch ? 'Novo projeto' : 'Criar primeiro projeto'}
        </Button>
      </CardContent>
    </Card>
  );
}

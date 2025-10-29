'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProjectListView } from '@/components/deer-flow/kanban/project-list-view';
import { KanbanDeskBoard } from '@/components/deer-flow/kanban/kanban-desk-board';
import { LayoutGrid, Kanban, Search, Plus } from 'lucide-react';

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'kanban'>('list');
  const [projectSearch, setProjectSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your projects and tasks
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as 'list' | 'kanban');
            setShowCreateDialog(false);
          }}
          className="h-full"
        >
          <div className="px-4 pt-4 md:px-6 lg:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <TabsList className="grid w-full max-w-xs grid-cols-2 md:w-[240px]">
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Projects
                </TabsTrigger>
                <TabsTrigger value="kanban" className="flex items-center gap-2">
                  <Kanban className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
              </TabsList>

              {activeTab === 'list' && (
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar projetos..."
                      value={projectSearch}
                      onChange={(event) => setProjectSearch(event.target.value)}
                      className="h-9 pl-9"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="gap-2 md:w-auto"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Novo projeto
                  </Button>
                </div>
              )}
            </div>
          </div>

          <TabsContent value="list" className="h-full mt-0 pt-4">
            <ProjectListView
              searchQuery={projectSearch}
              showCreateDialog={showCreateDialog}
              onOpenCreateDialog={setShowCreateDialog}
            />
          </TabsContent>

          <TabsContent value="kanban" className="h-full mt-0 pt-4">
            <KanbanDeskBoard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

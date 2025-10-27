'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectListView } from '@/components/deer-flow/kanban/project-list-view';
import { KanbanDeskBoard } from '@/components/deer-flow/kanban/kanban-desk-board';
import { LayoutGrid, Kanban } from 'lucide-react';

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'kanban'>('list');

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
          onValueChange={(value) => setActiveTab(value as 'list' | 'kanban')}
          className="h-full"
        >
          <div className="px-4 pt-4">
            <TabsList className="grid w-[240px] grid-cols-2">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <Kanban className="h-4 w-4" />
                Kanban
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="h-full mt-0 pt-4">
            <ProjectListView />
          </TabsContent>

          <TabsContent value="kanban" className="h-full mt-0 pt-4">
            <KanbanDeskBoard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

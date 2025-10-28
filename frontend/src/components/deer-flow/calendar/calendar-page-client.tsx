'use client'

import { useState } from 'react'
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar as CalendarIcon, List } from 'lucide-react'
import { CalendarViewMode, CalendarEventCategory } from '@/lib/types/calendar'
import { useCalendarEvents } from '@/hooks/react-query/calendar'
import { MonthView } from './views/month-view'

export function CalendarPageClient() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [categoryFilter, setCategoryFilter] = useState<CalendarEventCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate date range based on view mode
  const startDate = startOfMonth(currentDate)
  const endDate = endOfMonth(currentDate)

  // Fetch events
  const { data: events = [], isLoading, error } = useCalendarEvents(
    startDate,
    endDate,
    categoryFilter,
    searchQuery
  )

  // Navigation handlers
  const handlePreviousPeriod = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextPeriod = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your events and appointments
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as CalendarViewMode)}
          className="h-full"
        >
          <div className="px-4 pt-4">
            <TabsList className="grid w-[240px] grid-cols-2">
              <TabsTrigger value="month" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Month
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Month View Tab */}
          <TabsContent value="month" className="h-full mt-0 pt-4">
            <MonthView
              currentDate={currentDate}
              events={events}
              isLoading={isLoading}
              categoryFilter={categoryFilter}
              searchQuery={searchQuery}
              onPreviousPeriod={handlePreviousPeriod}
              onNextPeriod={handleNextPeriod}
              onToday={handleToday}
              onCategoryFilterChange={setCategoryFilter}
              onSearchChange={setSearchQuery}
            />
          </TabsContent>

          {/* List View Tab (Coming soon) */}
          <TabsContent value="list" className="h-full mt-0 pt-4">
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <List className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">List view coming soon</h3>
              <p className="text-muted-foreground max-w-sm">
                View all your events in a chronological list format
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

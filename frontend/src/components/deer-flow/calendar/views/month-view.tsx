'use client'

import { useState } from 'react'
import * as React from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from 'date-fns'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarEvent, CalendarEventCategory, isEventOnDate, CATEGORY_LABELS } from '@/lib/types/calendar'
import { EventDialog } from '../ui/event-dialog'
import { cn } from '@/lib/utils'

interface MonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  isLoading: boolean
  categoryFilter: CalendarEventCategory | 'all'
  searchQuery: string
  onPreviousPeriod: () => void
  onNextPeriod: () => void
  onToday: () => void
  onCategoryFilterChange: (category: CalendarEventCategory | 'all') => void
  onSearchChange: (query: string) => void
}

export function MonthView({
  currentDate,
  events,
  isLoading,
  categoryFilter,
  searchQuery,
  onPreviousPeriod,
  onNextPeriod,
  onToday,
  onCategoryFilterChange,
  onSearchChange,
}: MonthViewProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const todayRef = React.useRef<HTMLDivElement>(null)
  
  // Scroll to today when the button is clicked
  React.useEffect(() => {
    if (isToday(currentDate)) {
      todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentDate])
  
  // Calculate calendar grid days (7x6 = 42 days including padding)
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  })

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isEventOnDate(event, day))
  }

  // Weekday headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (isLoading) {
    return (
      <div className="px-4 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 flex-1 max-w-md" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
        <div className="rounded-lg border bg-card">
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {weekDays.map((day) => (
              <div key={day} className="py-2 text-center border-r last:border-r-0">
                <Skeleton className="h-4 w-12 mx-auto" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 grid-rows-6">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="min-h-[100px] border-b border-r last:border-r-0 p-2">
                <Skeleton className="h-6 w-6 rounded-full mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-4">
      {/* Navigation and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className="hidden sm:flex"
          >
            Today
          </Button>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPreviousPeriod}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNextPeriod}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <Select
          value={categoryFilter}
          onValueChange={(value) => onCategoryFilterChange(value as CalendarEventCategory | 'all')}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="meeting">{CATEGORY_LABELS.meeting}</SelectItem>
            <SelectItem value="work">{CATEGORY_LABELS.work}</SelectItem>
            <SelectItem value="personal">{CATEGORY_LABELS.personal}</SelectItem>
            <SelectItem value="other">{CATEGORY_LABELS.other}</SelectItem>
          </SelectContent>
        </Select>

        {/* Create Event Button */}
        <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-lg border bg-card">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {calendarDays.map((day, dayIdx) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isDayToday = isToday(day)

          return (
            <div
              key={day.toISOString()}
              ref={isDayToday ? todayRef : null}
              className={cn(
                'relative min-h-[80px] border-b border-r p-2',
                !isCurrentMonth && 'bg-muted/30',
                isDayToday && 'bg-primary/5',
                dayIdx % 7 === 6 && 'border-r-0'
              )}
            >
              {/* Date Number */}
              <button
                onClick={() => {
                  setSelectedDate(day)
                  setShowCreateDialog(true)
                }}
                className={cn(
                  'mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm hover:bg-muted',
                  isDayToday && 'bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary',
                  !isCurrentMonth && !isDayToday && 'text-muted-foreground'
                )}
              >
                {format(day, 'd')}
              </button>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Open event details dialog
                      console.log('Event clicked:', event)
                    }}
                    className={cn(
                      'w-full truncate rounded px-1.5 py-0.5 text-left text-xs hover:opacity-80',
                      'transition-opacity'
                    )}
                    style={{
                      backgroundColor: `${event.color}20`,
                      borderLeft: `3px solid ${event.color}`,
                    }}
                  >
                    {event.is_all_day ? (
                      <span className="font-medium">{event.title}</span>
                    ) : (
                      <>
                        <span className="text-muted-foreground">
                          {format(new Date(event.start_date), 'HH:mm')}
                        </span>{' '}
                        <span className="font-medium">{event.title}</span>
                      </>
                    )}
                  </button>
                ))}

                {/* More events indicator */}
                {dayEvents.length > 3 && (
                  <button
                    onClick={() => {
                      setSelectedDate(day)
                      // TODO: Open day view or show all events
                    }}
                    className="w-full truncate px-1.5 py-0.5 text-left text-xs text-muted-foreground hover:text-foreground"
                  >
                    +{dayEvents.length - 3} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
        </div>
      </div>

      {/* Create Event Dialog */}
      <EventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        mode="create"
        defaultDate={selectedDate || undefined}
      />
    </div>
  )
}

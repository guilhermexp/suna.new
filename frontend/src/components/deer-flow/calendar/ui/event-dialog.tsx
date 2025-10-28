'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateEvent, useUpdateEvent } from '@/hooks/react-query/calendar'
import {
  CalendarEvent,
  CalendarEventCreate,
  CalendarEventUpdate,
  CalendarEventCategory,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from '@/lib/types/calendar'
import { toast } from 'sonner'

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  event?: CalendarEvent
  defaultDate?: Date
}

export function EventDialog({
  open,
  onOpenChange,
  mode,
  event,
  defaultDate,
}: EventDialogProps) {
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [category, setCategory] = useState<CalendarEventCategory>('other')
  const [color, setColor] = useState(CATEGORY_COLORS.other)

  // Initialize form with event data or defaults
  useEffect(() => {
    if (mode === 'edit' && event) {
      setTitle(event.title)
      setDescription(event.description || '')
      setLocation(event.location || '')
      
      const start = new Date(event.start_date)
      setStartDate(format(start, 'yyyy-MM-dd'))
      setStartTime(format(start, 'HH:mm'))
      
      if (event.end_date) {
        const end = new Date(event.end_date)
        setEndDate(format(end, 'yyyy-MM-dd'))
        setEndTime(format(end, 'HH:mm'))
      }
      
      setIsAllDay(event.is_all_day)
      setCategory(event.category)
      setColor(event.color)
    } else if (mode === 'create') {
      // Reset form for new event
      const date = defaultDate || new Date()
      setTitle('')
      setDescription('')
      setLocation('')
      setStartDate(format(date, 'yyyy-MM-dd'))
      setStartTime('09:00')
      setEndDate(format(date, 'yyyy-MM-dd'))
      setEndTime('10:00')
      setIsAllDay(false)
      setCategory('other')
      setColor(CATEGORY_COLORS.other)
    }
  }, [mode, event, defaultDate, open])

  // Update color when category changes
  useEffect(() => {
    setColor(CATEGORY_COLORS[category])
  }, [category])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Please enter an event title')
      return
    }

    try {
      // Build start_date ISO string
      const startDateTime = isAllDay
        ? `${startDate}T00:00:00Z`
        : `${startDate}T${startTime}:00Z`

      // Build end_date ISO string
      let endDateTime: string | undefined
      if (endDate) {
        endDateTime = isAllDay
          ? `${endDate}T23:59:59Z`
          : `${endDate}T${endTime || startTime}:00Z`
      }

      if (mode === 'create') {
        const eventData: CalendarEventCreate = {
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          start_date: startDateTime,
          end_date: endDateTime,
          is_all_day: isAllDay,
          category,
          color,
        }

        await createEvent.mutateAsync(eventData)

        toast.success('Event created successfully')
      } else if (mode === 'edit' && event) {
        const eventData: CalendarEventUpdate = {
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          start_date: startDateTime,
          end_date: endDateTime,
          is_all_day: isAllDay,
          category,
          color,
        }

        await updateEvent.mutateAsync({ id: event.id, data: eventData })

        toast.success('Event updated successfully')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save event')
    }
  }

  const isLoading = createEvent.isPending || updateEvent.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Event' : 'Edit Event'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new event to your calendar'
              : 'Update event details'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description"
              rows={3}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Event location"
            />
          </div>

          {/* All Day Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isAllDay"
              checked={isAllDay}
              onCheckedChange={(checked) => setIsAllDay(checked as boolean)}
            />
            <Label htmlFor="isAllDay" className="cursor-pointer">
              All day event
            </Label>
          </div>

          {/* Date & Time Inputs */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            {/* Start Time */}
            {!isAllDay && (
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            )}

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* End Time */}
            {!isAllDay && (
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as CalendarEventCategory)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">{CATEGORY_LABELS.meeting}</SelectItem>
                <SelectItem value="work">{CATEGORY_LABELS.work}</SelectItem>
                <SelectItem value="personal">{CATEGORY_LABELS.personal}</SelectItem>
                <SelectItem value="other">{CATEGORY_LABELS.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color Preview */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div
              className="h-10 w-full rounded border"
              style={{ backgroundColor: color }}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Saving...'
                : mode === 'create'
                ? 'Create Event'
                : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

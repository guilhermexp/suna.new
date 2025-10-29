/**
 * React Query hooks for calendar events
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  CalendarEvent,
  CalendarEventCreate,
  CalendarEventUpdate,
  CalendarEventsResponse,
  CalendarEventCategory,
} from '@/lib/types/calendar'

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/calendar`

// Helper function to get auth token
async function getAuthToken(): Promise<string> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('No authentication token available')
  }

  return session.access_token
}

// Query keys
export const calendarKeys = {
  all: ['calendar-events'] as const,
  lists: () => [...calendarKeys.all, 'list'] as const,
  list: (startDate: string, endDate: string, category?: string, search?: string) =>
    [...calendarKeys.lists(), { startDate, endDate, category, search }] as const,
  details: () => [...calendarKeys.all, 'detail'] as const,
  detail: (id: string) => [...calendarKeys.details(), id] as const,
}

// Fetch events for date range
export function useCalendarEvents(
  startDate: Date,
  endDate: Date,
  category?: CalendarEventCategory | 'all',
  search?: string,
  page: number = 1,
  perPage: number = 100
) {
  const startDateStr = startDate.toISOString()
  const endDateStr = endDate.toISOString()

  return useQuery({
    queryKey: calendarKeys.list(startDateStr, endDateStr, category, search),
    queryFn: async (): Promise<CalendarEvent[]> => {
      const params = new URLSearchParams({
        start_date: startDateStr,
        end_date: endDateStr,
        page: page.toString(),
        per_page: perPage.toString(),
      })

      if (category && category !== 'all') {
        params.append('category', category)
      }

      if (search) {
        params.append('search', search)
      }

      const token = await getAuthToken()
      const response = await fetch(`${API_BASE}/events?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events')
      }

      const data: CalendarEventsResponse = await response.json()
      return data.events
    },
    staleTime: 30000, // 30 seconds
  })
}

// Fetch single event
export function useCalendarEvent(eventId: string | null) {
  return useQuery({
    queryKey: calendarKeys.detail(eventId || ''),
    queryFn: async (): Promise<CalendarEvent> => {
      if (!eventId) throw new Error('Event ID is required')

      const token = await getAuthToken()
      const response = await fetch(`${API_BASE}/events/${eventId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch calendar event')
      }

      return response.json()
    },
    enabled: !!eventId,
  })
}

// Create event mutation
export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (event: CalendarEventCreate): Promise<CalendarEvent> => {
      const token = await getAuthToken()
      const response = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(event),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create calendar event')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate all event lists
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
    },
  })
}

// Update event mutation
export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: CalendarEventUpdate
    }): Promise<CalendarEvent> => {
      const token = await getAuthToken()
      const response = await fetch(`${API_BASE}/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to update calendar event')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate all event lists and the specific event
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
      queryClient.invalidateQueries({ queryKey: calendarKeys.detail(data.id) })
    },
  })
}

// Delete event mutation
export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const token = await getAuthToken()
      const response = await fetch(`${API_BASE}/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to delete calendar event')
      }
    },
    onSuccess: (_, id) => {
      // Invalidate all event lists and remove the specific event from cache
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
      queryClient.removeQueries({ queryKey: calendarKeys.detail(id) })
    },
  })
}

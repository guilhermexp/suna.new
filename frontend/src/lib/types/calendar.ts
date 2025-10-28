/**
 * Calendar-related TypeScript types
 * Aligned with backend Pydantic models
 */

// Event Categories
export type CalendarEventCategory = 'meeting' | 'work' | 'personal' | 'other'

// View Modes
export type CalendarViewMode = 'month' | 'week' | 'day'

// Calendar Event Interface
export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  location?: string | null
  start_date: string  // ISO 8601 format
  end_date?: string | null  // ISO 8601 format
  is_all_day: boolean
  category: CalendarEventCategory
  color: string  // Hex color format (#RRGGBB)
  user_id: string
  created_at: string
  updated_at: string
}

// Create Event Request
export interface CalendarEventCreate {
  title: string
  description?: string
  location?: string
  start_date: string  // ISO 8601 format
  end_date?: string  // ISO 8601 format
  is_all_day: boolean
  category: CalendarEventCategory
  color?: string
}

// Update Event Request
export interface CalendarEventUpdate {
  title?: string
  description?: string
  location?: string
  start_date?: string
  end_date?: string
  is_all_day?: boolean
  category?: CalendarEventCategory
  color?: string
}

// Pagination Info
export interface PaginationInfo {
  current_page: number
  page_size: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

// API Response Types
export interface CalendarEventsResponse {
  events: CalendarEvent[]
  pagination: PaginationInfo
}

// Category Configuration
export interface CategoryConfig {
  label: string
  color: string
}

export const CATEGORY_COLORS: Record<CalendarEventCategory, string> = {
  meeting: '#3B82F6',    // blue-500
  work: '#10B981',       // emerald-500
  personal: '#F59E0B',   // amber-500
  other: '#6B7280',      // gray-500
}

export const CATEGORY_LABELS: Record<CalendarEventCategory, string> = {
  meeting: 'Meeting',
  work: 'Work',
  personal: 'Personal',
  other: 'Other',
}

// Helper function to get category config
export function getCategoryConfig(category: CalendarEventCategory): CategoryConfig {
  return {
    label: CATEGORY_LABELS[category],
    color: CATEGORY_COLORS[category],
  }
}

// Helper function to format event date range
export function formatEventDateRange(event: CalendarEvent): string {
  const start = new Date(event.start_date)
  const end = event.end_date ? new Date(event.end_date) : null
  
  if (event.is_all_day) {
    if (end) {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
    }
    return start.toLocaleDateString()
  }
  
  if (end) {
    return `${start.toLocaleString()} - ${end.toLocaleString()}`
  }
  return start.toLocaleString()
}

// Helper function to check if event is multi-day
export function isMultiDayEvent(event: CalendarEvent): boolean {
  if (!event.end_date) return false
  
  const start = new Date(event.start_date)
  const end = new Date(event.end_date)
  
  return start.toDateString() !== end.toDateString()
}

// Helper function to check if event is on a specific date
export function isEventOnDate(event: CalendarEvent, date: Date): boolean {
  const eventStart = new Date(event.start_date)
  const eventEnd = event.end_date ? new Date(event.end_date) : eventStart
  
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  
  const nextDay = new Date(targetDate)
  nextDay.setDate(nextDay.getDate() + 1)
  
  return eventStart < nextDay && eventEnd >= targetDate
}

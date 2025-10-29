# Design Document - Calendar Page

## Overview

Esta página de calendário será implementada seguindo os mesmos padrões da página de Projetos (Kanban) já criada, mantendo consistência visual e funcional com o sistema Suna.

## Architecture

### File Structure

```
frontend/src/
├── app/(dashboard)/
│   └── calendar/
│       ├── page.tsx                      # Main calendar page
│       └── loading.tsx                   # Loading state
├── components/deer-flow/calendar/
│   ├── calendar-header.tsx               # Header with navigation & controls
│   ├── calendar-page.tsx                 # Main calendar component
│   ├── calendar-page-client.tsx          # Client-side wrapper
│   ├── views/
│   │   ├── month-view.tsx                # Month grid view
│   │   ├── week-view.tsx                 # Week timeline view
│   │   └── day-view.tsx                  # Day detailed view
│   ├── ui/
│   │   ├── event-card.tsx                # Event display card
│   │   ├── add-event-dialog.tsx          # Create event dialog
│   │   ├── edit-event-dialog.tsx         # Edit event dialog
│   │   ├── delete-event-dialog.tsx       # Delete confirmation
│   │   └── event-details-dialog.tsx      # Event details modal
│   ├── hooks/
│   │   ├── use-calendar.ts               # Main calendar hook
│   │   ├── use-calendar-navigation.ts    # Date navigation
│   │   ├── use-calendar-views.ts         # View mode management
│   │   └── use-calendar-events.ts        # Event operations
│   └── lib/
│       └── types.ts                      # TypeScript types
├── hooks/react-query/calendar/
│   ├── use-calendar-events.ts            # Calendar events hooks
│   ├── use-calendar-filters.ts           # Filter management
│   └── index.ts                          # Exports
├── lib/api/
│   └── mock-calendar.ts                  # Mock API service
└── components/sidebar/
    └── sidebar-left.tsx                  # Updated with Calendar link
```

## Component Design

### Page Layout

```tsx
// app/(dashboard)/calendar/page.tsx
import { CalendarPageClient } from '@/components/deer-flow/calendar/calendar-page-client'

export default function CalendarPage() {
  return <CalendarPageClient />
}
```

### Main Calendar Component

```tsx
// components/deer-flow/calendar/calendar-page-client.tsx
'use client'

import { useState } from 'react'
import { useCalendar } from './hooks/use-calendar'
import { CalendarHeader } from './calendar-header'
import { MonthView } from './views/month-view'
import { WeekView } from './views/week-view'
import { DayView } from './views/day-view'

export function CalendarPageClient() {
  const {
    currentDate,
    viewMode,
    events,
    isLoading,
    error,
    setViewMode,
    setCurrentDate,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useCalendar()

  if (error) {
    return <div className="p-6">Error loading calendar: {error.message}</div>
  }

  return (
    <div className="h-full flex flex-col">
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onDateChange={setCurrentDate}
        onViewModeChange={setViewMode}
      />
      
      <div className="flex-1 overflow-hidden">
        {viewMode === 'month' && <MonthView events={events} currentDate={currentDate} />}
        {viewMode === 'week' && <WeekView events={events} currentDate={currentDate} />}
        {viewMode === 'day' && <DayView events={events} currentDate={currentDate} />}
      </div>
    </div>
  )
}
```

## Views Design

### Month View

- Grid 7x6 (dias da semana x semanas do mês)
- Cada célula representa um dia
- Eventos mostrados como dots coloridos ou texto resumido
- Clique na data navega para vista de dia
- Weekend destacado (sábados e domingos)

### Week View

- Timeline horizontal com 7 colunas
- Cada coluna representa um dia da semana
- Eventos mostrados como cards horizontais
- Visualização por horário (8h-18h por padrão)

### Day View

- Timeline vertical com horários do dia
- Eventos mostrados como cards posicionados por horário
- Suporte a eventos de dia inteiro
- Slot de 30min ou 1h

## Dialog Design

### Add/Edit Event Dialog

```tsx
// components/deer-flow/calendar/ui/add-event-dialog.tsx
interface EventFormData {
  title: string
  description?: string
  startDate: string
  endDate?: string
  startTime?: string
  endTime?: string
  category: string
  isAllDay: boolean
  location?: string
}
```

Campos:
- Título (obrigatório)
- Data de início (obrigatório)
- Data de fim (opcional)
- Horário início/fim (se não for dia inteiro)
- Checkbox "Evento de dia inteiro"
- Categoria (Meeting, Work, Personal, Other)
- Localização (opcional)
- Descrição (opcional)

### Delete Confirmation Dialog

- Confirmação com título do evento
- Botões Cancel/Delete
- Loading state durante exclusão

## Color Scheme

### Category Colors

```typescript
const categoryColors = {
  meeting: '#3B82F6',     // blue-500
  work: '#10B981',        // emerald-500
  personal: '#F59E0B',    // amber-500
  other: '#6B7280',       // gray-500
}
```

### Event Cards

- Background: cor da categoria (10% opacity)
- Border: cor da categoria (100% opacity)
- Text: texto escuro para contraste

## Navigation Design

### Header Controls

```tsx
// components/deer-flow/calendar/calendar-header.tsx
interface CalendarHeaderProps {
  currentDate: Date
  viewMode: 'month' | 'week' | 'day'
  onDateChange: (date: Date) => void
  onViewModeChange: (mode: 'month' | 'week' | 'day') => void
}
```

Elementos:
- Botão "Hoje"
- Navegação anterior/próximo (setas)
- Título do período atual
- Filtros de categoria
- Botão "Novo Evento"
- Toggle de vista (Month/Week/Day)

### Responsive Behavior

- Mobile: Vista Month por padrão, outros views com modal
- Tablet: Vista Week 默认
- Desktop: Todas as vistas disponíveis no header

## State Management

### useCalendar Hook

```typescript
export const useCalendar = () => {
  // State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  
  // Query
  const { data: events, isLoading, error } = useCalendarEvents({
    startDate: getDateRangeStart(currentDate, viewMode),
    endDate: getDateRangeEnd(currentDate, viewMode),
    category: activeFilter === 'all' ? undefined : activeFilter,
  })
  
  // Actions
  const handleCreateEvent = useCreateEvent()
  const handleUpdateEvent = useUpdateEvent()
  const handleDeleteEvent = useDeleteEvent()
  
  return {
    currentDate,
    viewMode,
    events,
    isLoading,
    error,
    selectedEvent,
    isCreateDialogOpen,
    activeFilter,
    setCurrentDate,
    setViewMode,
    setSelectedEvent,
    setIsCreateDialogOpen,
    setActiveFilter,
    createEvent: handleCreateEvent.mutate,
    updateEvent: handleUpdateEvent.mutate,
    deleteEvent: handleDeleteEvent.mutate,
  }
}
```

## Mock Data Design

### Sample Events

```typescript
// 10 eventos distribuídos pelo mês
const mockEvents: CalendarEvent[] = [
  {
    id: 1,
    title: 'Reunião de Equipe',
    description: 'Weekly team standup',
    date: '2024-01-15',
    endDate: '2024-01-15',
    category: 'meeting',
    color: '#3B82F6',
    location: 'Sala de Reuniões A',
    isAllDay: false,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z',
  },
  // ... mais 9 eventos
]
```

### Categories

- **Meeting**: Reuniões, apresentações, calls
- **Work**: Projetos, deadlines, tarefas de trabalho
- **Personal**: Compromissos pessoais, consultas médicas
- **Other**: Outros tipos de evento

## Performance Considerations

### Event Loading Strategy

- Only load events for visible date range
- Infinite scroll for events within day/week views
- Debounced search/filter
- Memoized event rendering

### Caching Strategy

- React Query caching for calendar events
- Optimistic updates for CRUD operations
- Background refetch for stale data

### Responsive Design

- Mobile-first approach
- Touch-friendly interactions
- Adaptive content density
- Optimized for mobile navigation

## Accessibility Features

- Keyboard navigation support
- ARIA labels for all interactive elements
- Screen reader friendly event descriptions
- High contrast mode support
- Focus management in dialogs

## Integration Points

### Sidebar Navigation

Adicionar item "Calendário" com ícone Calendar no sidebar-left.tsx

### URL State

- `/calendar` - month view, current month
- `/calendar?view=week` - week view
- `/calendar?date=2024-01-15` - specific date
- `/calendar?view=day&date=2024-01-15` - specific day

### Search Integration

Se houver sistema de busca global, integrar com filtro de eventos por título/descrição
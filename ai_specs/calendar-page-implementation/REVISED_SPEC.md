# Calendar Page - Revised Specification (Database Real)

## ⚠️ IMPORTANTE: Implementação com Banco de Dados Real

Esta especificação foi **completamente revisada** para usar **banco de dados real (Supabase)** em vez de mocks, seguindo o mesmo padrão da implementação do Projects Kanban.

## 📋 O que mudou da especificação anterior

### ❌ Especificação Antiga (Mock)
- Mock API (`mock-calendar.ts`)
- Dados em memória
- Sem persistência real

### ✅ Nova Especificação (Database Real)
- **Banco de dados Supabase** com migrations SQL
- **Backend FastAPI** completo com endpoints REST
- **Pydantic models** para validação
- **React Query** conectado à API real
- **Row Level Security (RLS)** para segurança
- **Persistência real** de dados

---

## 🎯 Estrutura Completa da Implementação

### Backend (Supabase + FastAPI)

```
backend/
├── supabase/migrations/
│   ├── YYYYMMDDHHMMSS_create_calendar_events_table.sql
│   └── YYYYMMDDHHMMSS_create_calendar_categories_table.sql (opcional)
├── core/
│   ├── calendar.py                      # FastAPI endpoints (CRUD completo)
│   └── api_models/
│       └── calendar.py                   # Pydantic models
└── api.py                                # Adicionar calendar router
```

### Frontend (Next.js + React Query)

```
frontend/src/
├── app/(dashboard)/calendar/
│   ├── page.tsx                          # Main calendar page
│   └── loading.tsx                       # Loading state
├── components/deer-flow/calendar/
│   ├── calendar-header.tsx               # Header with navigation
│   ├── calendar-page-client.tsx          # Client wrapper
│   ├── views/
│   │   ├── month-view.tsx                # Month grid view
│   │   ├── week-view.tsx                 # Week timeline view
│   │   └── day-view.tsx                  # Day detailed view
│   ├── ui/
│   │   ├── event-card.tsx                # Event card component
│   │   ├── event-dialog.tsx              # Create/Edit dialog
│   │   └── delete-event-dialog.tsx       # Delete confirmation
│   └── hooks/
│       └── use-calendar.ts               # Main calendar hook
├── hooks/react-query/calendar/
│   ├── use-calendar-events.ts            # React Query hooks
│   └── index.ts                          # Exports
├── lib/
│   └── types/
│       └── calendar.ts                   # TypeScript types
└── components/sidebar/
    └── sidebar-left.tsx                  # Add Calendar navigation
```

---

## 🗄️ Database Schema

### Tabela: `calendar_events`

```sql
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    
    -- Date/time
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    is_all_day BOOLEAN DEFAULT FALSE,
    
    -- Categorization
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    
    -- Visual
    color VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    
    -- Ownership
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT calendar_events_title_length CHECK (length(title) >= 1 AND length(title) <= 255),
    CONSTRAINT calendar_events_category_valid CHECK (category IN ('meeting', 'work', 'personal', 'other')),
    CONSTRAINT calendar_events_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT calendar_events_end_after_start CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Indexes
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_category ON calendar_events(category);
CREATE INDEX idx_calendar_events_created_at ON calendar_events(created_at);

-- RLS Policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events" ON calendar_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" ON calendar_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" ON calendar_events
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `title` | VARCHAR(255) | Título do evento (obrigatório) |
| `description` | TEXT | Descrição detalhada |
| `location` | VARCHAR(255) | Localização do evento |
| `start_date` | TIMESTAMP | Data/hora início (obrigatório) |
| `end_date` | TIMESTAMP | Data/hora fim (opcional) |
| `is_all_day` | BOOLEAN | Evento de dia inteiro |
| `category` | VARCHAR(50) | Categoria (meeting/work/personal/other) |
| `color` | VARCHAR(7) | Cor em hex (#RRGGBB) |
| `user_id` | UUID | Dono do evento |

---

## 🔌 Backend API (FastAPI)

### Endpoints REST

#### **GET /api/calendar/events**
Lista eventos com filtros e paginação

**Query Parameters:**
- `start_date` (required): ISO 8601 date
- `end_date` (required): ISO 8601 date
- `category` (optional): Filter by category
- `search` (optional): Search in title/description
- `page` (default: 1)
- `per_page` (default: 100)

**Response:**
```json
{
  "events": [...],
  "pagination": {
    "current_page": 1,
    "page_size": 100,
    "total_items": 50,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}
```

#### **GET /api/calendar/events/{event_id}**
Busca evento específico

**Response:**
```json
{
  "id": "uuid",
  "title": "Meeting",
  "description": "...",
  "start_date": "2024-01-15T10:00:00Z",
  "end_date": "2024-01-15T11:00:00Z",
  "is_all_day": false,
  "category": "meeting",
  "color": "#3B82F6",
  "location": "Room A",
  "user_id": "uuid",
  "created_at": "...",
  "updated_at": "..."
}
```

#### **POST /api/calendar/events**
Cria novo evento

**Request Body:**
```json
{
  "title": "New Meeting",
  "description": "Team standup",
  "start_date": "2024-01-15T10:00:00Z",
  "end_date": "2024-01-15T11:00:00Z",
  "is_all_day": false,
  "category": "meeting",
  "color": "#3B82F6",
  "location": "Room A"
}
```

#### **PUT /api/calendar/events/{event_id}**
Atualiza evento existente

#### **DELETE /api/calendar/events/{event_id}**
Deleta evento

---

## 📦 Pydantic Models

```python
# backend/core/api_models/calendar.py

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CalendarEventCreateRequest(BaseModel):
    """Request model for creating a calendar event."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)
    start_date: datetime
    end_date: Optional[datetime] = None
    is_all_day: bool = False
    category: str = Field("other", pattern="^(meeting|work|personal|other)$")
    color: str = Field("#6B7280", pattern="^#[0-9A-Fa-f]{6}$")

class CalendarEventUpdateRequest(BaseModel):
    """Request model for updating a calendar event."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_all_day: Optional[bool] = None
    category: Optional[str] = Field(None, pattern="^(meeting|work|personal|other)$")
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")

class CalendarEventResponse(BaseModel):
    """Response model for calendar event."""
    id: str
    title: str
    description: Optional[str]
    location: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]
    is_all_day: bool
    category: str
    color: str
    user_id: str
    created_at: datetime
    updated_at: datetime

class CalendarEventsResponse(BaseModel):
    """Response model for list of events with pagination."""
    events: list[CalendarEventResponse]
    pagination: PaginationInfo
```

---

## 🎨 Frontend Implementation

### React Query Hooks

```typescript
// hooks/react-query/calendar/use-calendar-events.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarEvent, CalendarEventCreate, CalendarEventUpdate } from '@/lib/types/calendar'

const API_BASE = '/api/calendar'

export function useCalendarEvents(startDate: Date, endDate: Date, category?: string) {
  return useQuery({
    queryKey: ['calendar-events', startDate.toISOString(), endDate.toISOString(), category],
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      })
      if (category && category !== 'all') {
        params.append('category', category)
      }
      
      const response = await fetch(`${API_BASE}/events?${params}`)
      if (!response.ok) throw new Error('Failed to fetch events')
      
      const data = await response.json()
      return data.events as CalendarEvent[]
    },
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (event: CalendarEventCreate) => {
      const response = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
      if (!response.ok) throw new Error('Failed to create event')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CalendarEventUpdate }) => {
      const response = await fetch(`${API_BASE}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update event')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/events/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete event')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}
```

### TypeScript Types

```typescript
// lib/types/calendar.ts

export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  location?: string | null
  start_date: string  // ISO 8601
  end_date?: string | null  // ISO 8601
  is_all_day: boolean
  category: 'meeting' | 'work' | 'personal' | 'other'
  color: string  // Hex color
  user_id: string
  created_at: string
  updated_at: string
}

export interface CalendarEventCreate {
  title: string
  description?: string
  location?: string
  start_date: string
  end_date?: string
  is_all_day: boolean
  category: 'meeting' | 'work' | 'personal' | 'other'
  color?: string
}

export interface CalendarEventUpdate {
  title?: string
  description?: string
  location?: string
  start_date?: string
  end_date?: string
  is_all_day?: boolean
  category?: 'meeting' | 'work' | 'personal' | 'other'
  color?: string
}

export type CalendarViewMode = 'month' | 'week' | 'day'

export const CATEGORY_COLORS = {
  meeting: '#3B82F6',    // blue-500
  work: '#10B981',       // emerald-500
  personal: '#F59E0B',   // amber-500
  other: '#6B7280',      // gray-500
} as const
```

---

## 🚀 Implementação em Fases

### Fase 1: Backend Foundation (2-3 horas)
1. ✅ Criar migration SQL `calendar_events` table
2. ✅ Criar `backend/core/api_models/calendar.py` (Pydantic models)
3. ✅ Criar `backend/core/calendar.py` (FastAPI endpoints)
4. ✅ Atualizar `backend/api.py` para incluir calendar router
5. ✅ Testar endpoints com curl/Postman

### Fase 2: Frontend Foundation (2 horas)
1. ✅ Criar TypeScript types (`lib/types/calendar.ts`)
2. ✅ Criar React Query hooks (`hooks/react-query/calendar/`)
3. ✅ Criar page structure (`app/(dashboard)/calendar/page.tsx`)
4. ✅ Criar calendar header component
5. ✅ Testar conexão com backend

### Fase 3: Views & UI (2-3 horas)
1. ✅ Implementar Month View
2. ✅ Implementar Week View
3. ✅ Implementar Day View
4. ✅ Criar Event Card component
5. ✅ Criar Event Dialog (Create/Edit)

### Fase 4: Integration & Polish (1-2 horas)
1. ✅ Integrar com sidebar navigation
2. ✅ Adicionar loading states
3. ✅ Adicionar error handling
4. ✅ Responsive design
5. ✅ Final testing

**Total Estimado:** 7-10 horas

---

## 🔒 Segurança (RLS Policies)

- ✅ Usuários só podem ver seus próprios eventos
- ✅ Usuários só podem criar eventos para si mesmos
- ✅ Usuários só podem editar/deletar seus eventos
- ✅ Autenticação via JWT (auth_utils.py)
- ✅ Validação de dados no backend (Pydantic)

---

## 📝 Diferenças da Especificação Antiga

| Aspecto | Antiga (Mock) | Nova (Real) |
|---------|---------------|-------------|
| **Data Storage** | In-memory mock | Supabase PostgreSQL |
| **API** | Mock functions | FastAPI REST endpoints |
| **Validation** | TypeScript only | Pydantic + TypeScript |
| **Security** | None | RLS + JWT auth |
| **State** | React Query cache only | Database + cache |
| **Persistence** | Lost on reload | Permanent |

---

## ✅ Checklist de Implementação

### Backend
- [ ] Migration SQL criada e aplicada
- [ ] Pydantic models definidos
- [ ] FastAPI endpoints implementados
- [ ] Router registrado em api.py
- [ ] RLS policies configuradas
- [ ] Testes de endpoints realizados

### Frontend
- [ ] TypeScript types definidos
- [ ] React Query hooks criados
- [ ] Page structure criada
- [ ] Calendar views implementadas
- [ ] Event dialogs criados
- [ ] Sidebar integration
- [ ] Loading/Error states
- [ ] Responsive design

### Integration
- [ ] Backend + Frontend conectados
- [ ] CRUD operations funcionando
- [ ] Authentication working
- [ ] RLS policies testadas
- [ ] Performance otimizada

---

## 🎯 Próximos Passos

1. **Revisar** este documento completo
2. **Criar** migrations SQL
3. **Implementar** backend (FastAPI + Pydantic)
4. **Implementar** frontend (React Query + Components)
5. **Testar** integração completa
6. **Deploy**

---

## 📚 Referências

- **Projects Implementation**: `/Users/guilhermevarela/Documents/Projetos/suna.new/backend/core/projects.py`
- **Projects Migration**: `/Users/guilhermevarela/Documents/Projetos/suna.new/backend/supabase/migrations/20251027090117_create_projects_table.sql`
- **API Models Pattern**: `/Users/guilhermevarela/Documents/Projetos/suna.new/backend/core/api_models/projects.py`

---

**Status**: ✅ READY FOR IMPLEMENTATION (Database Real)

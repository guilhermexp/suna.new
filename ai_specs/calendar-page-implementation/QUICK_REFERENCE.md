# Calendar Page - Quick Reference Card

## 🚀 TL;DR

**O que é:** Página de calendário com banco de dados real (Supabase)  
**Padrão:** Mesmo do Projects Kanban  
**Tempo:** 5-8 horas de implementação  
**Status:** Documentação completa, implementação pendente

---

## 📁 Arquivos que Você Vai Criar

### Backend (4 arquivos)
```
✅ backend/supabase/migrations/YYYYMMDD_create_calendar_events_table.sql
✅ backend/core/api_models/calendar.py
✅ backend/core/calendar.py
✅ backend/api.py (atualizar)
```

### Frontend (7 arquivos)
```
✅ frontend/src/lib/types/calendar.ts
✅ frontend/src/hooks/react-query/calendar/use-calendar-events.ts
✅ frontend/src/hooks/react-query/calendar/index.ts
✅ frontend/src/app/(dashboard)/calendar/page.tsx
✅ frontend/src/app/(dashboard)/calendar/loading.tsx
✅ frontend/src/components/deer-flow/calendar/... (múltiplos components)
✅ frontend/src/components/sidebar/sidebar-left.tsx (atualizar)
```

---

## 🗄️ Database Schema (Copy-Paste)

```sql
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    is_all_day BOOLEAN DEFAULT FALSE,
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    color VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT calendar_events_category_valid CHECK (category IN ('meeting', 'work', 'personal', 'other'))
);

CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
```

---

## 🔌 API Endpoints

### Base: `/api/calendar`

| Endpoint | Method | Auth | Descrição |
|----------|--------|------|-----------|
| `/events` | GET | ✅ | Lista eventos |
| `/events/{id}` | GET | ✅ | Busca evento |
| `/events` | POST | ✅ | Cria evento |
| `/events/{id}` | PUT | ✅ | Atualiza evento |
| `/events/{id}` | DELETE | ✅ | Deleta evento |

---

## 📦 Pydantic Models (Copy-Paste Template)

```python
# backend/core/api_models/calendar.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CalendarEventCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    location: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    is_all_day: bool = False
    category: str = Field("other")
    color: str = Field("#6B7280")

class CalendarEventResponse(BaseModel):
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
```

---

## 🎨 TypeScript Types (Copy-Paste Template)

```typescript
// lib/types/calendar.ts
export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  location?: string | null
  start_date: string  // ISO 8601
  end_date?: string | null
  is_all_day: boolean
  category: 'meeting' | 'work' | 'personal' | 'other'
  color: string
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
```

---

## 🪝 React Query Hooks (Copy-Paste Template)

```typescript
// hooks/react-query/calendar/use-calendar-events.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useCalendarEvents(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['calendar-events', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      })
      const response = await fetch(`/api/calendar/events?${params}`)
      if (!response.ok) throw new Error('Failed to fetch events')
      const data = await response.json()
      return data.events
    },
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (event: CalendarEventCreate) => {
      const response = await fetch('/api/calendar/events', {
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
```

---

## ⚡ FastAPI Endpoints (Template)

```python
# backend/core/calendar.py
from fastapi import APIRouter, HTTPException, Depends
from core.utils.auth_utils import verify_and_get_user_id_from_jwt
from .api_models.calendar import CalendarEventCreateRequest, CalendarEventResponse

router = APIRouter()

@router.post("/events", response_model=CalendarEventResponse)
async def create_event(
    event_data: CalendarEventCreateRequest,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Create a new calendar event."""
    # Implementar lógica aqui
    pass

@router.get("/events", response_model=list[CalendarEventResponse])
async def get_events(
    start_date: str,
    end_date: str,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Get calendar events for date range."""
    # Implementar lógica aqui
    pass
```

---

## 🔐 RLS Policies (Copy-Paste)

```sql
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events" ON calendar_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" ON calendar_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" ON calendar_events
    FOR DELETE USING (auth.uid() = user_id);
```

---

## 🎯 Categorias de Eventos

```typescript
export const CATEGORIES = {
  meeting: { label: 'Meeting', color: '#3B82F6' },    // blue
  work: { label: 'Work', color: '#10B981' },          // emerald
  personal: { label: 'Personal', color: '#F59E0B' },  // amber
  other: { label: 'Other', color: '#6B7280' },        // gray
}
```

---

## 🛠️ Comandos Rápidos

### Criar Migration
```bash
cd backend/supabase/migrations
touch $(date +%Y%m%d%H%M%S)_create_calendar_events_table.sql
```

### Aplicar Migration
```bash
supabase db push
```

### Testar Backend
```bash
cd backend
uvicorn core.run:app --reload

# Em outro terminal
curl http://localhost:8000/api/calendar/events?start_date=2024-01-01T00:00:00Z&end_date=2024-01-31T23:59:59Z
```

### Instalar Dependências Frontend
```bash
cd frontend
npm install date-fns
```

---

## 📋 Checklist Mínima

### Backend
- [ ] Migration SQL criada e aplicada
- [ ] Pydantic models criados
- [ ] Endpoints FastAPI implementados
- [ ] Router registrado em `api.py`
- [ ] Testado com curl

### Frontend
- [ ] TypeScript types criados
- [ ] React Query hooks criados
- [ ] Calendar page criado
- [ ] Components básicos (Month view mínimo)
- [ ] Sidebar atualizado

### Integration
- [ ] Backend rodando
- [ ] Frontend conecta com backend
- [ ] Criar evento funciona
- [ ] Listar eventos funciona
- [ ] RLS isolando usuários

---

## 🔥 Atalhos de Implementação

### Backend Mínimo Viável
```python
# 1. Migration SQL (5 min)
# 2. Pydantic models (10 min) 
# 3. FastAPI GET /events endpoint (20 min)
# 4. FastAPI POST /events endpoint (20 min)
# 5. Registrar router (5 min)
# Total: ~1 hora
```

### Frontend Mínimo Viável
```typescript
// 1. TypeScript types (10 min)
// 2. React Query hooks (20 min)
// 3. Calendar page básico (30 min)
// 4. Month view simples (30 min)
// 5. Event dialog básico (30 min)
// Total: ~2 horas
```

---

## 🚨 Erros Comuns

### "Column does not exist"
→ Migration não aplicada. Run: `supabase db push`

### "Permission denied for table"
→ RLS policies faltando. Adicione as 4 policies

### "Failed to fetch events"
→ Backend não está rodando ou URL errada

### "Invalid JWT token"
→ Fazer login novamente

---

## 📚 Referências Rápidas

### Ver implementação similar
```bash
# Projects implementation
cat backend/core/projects.py
cat backend/core/api_models/projects.py
cat backend/supabase/migrations/20251027090117_create_projects_table.sql
```

### Padrões Suna
- **Naming**: snake_case (backend), camelCase (frontend)
- **Auth**: JWT via `verify_and_get_user_id_from_jwt`
- **DB**: Supabase with RLS
- **State**: React Query
- **UI**: shadcn/ui

---

## 🎯 MVP em 3 Horas

**Objetivo:** Calendar funcionando com create e list

1. **Backend (1h)**
   - Migration + RLS
   - GET /events + POST /events
   
2. **Frontend (1.5h)**
   - Types + Hooks
   - Month view simples
   - Create dialog básico

3. **Testing (0.5h)**
   - Testar criar evento
   - Testar listar eventos
   - Validar RLS

---

## 📞 Ajuda

**Documentação completa:**
- README.md - Visão geral
- REVISED_SPEC.md - Especificação técnica
- MIGRATION_GUIDE.md - Passo-a-passo

**Referência:**
- Projects Kanban implementation
- `backend/core/projects.py`

---

**Quick Reference Version:** 1.0  
**Last Updated:** 2025-10-27

# Guia de Migração: Mock → Database Real

## 📋 Resumo Executivo

A especificação do Calendar Page foi **completamente revisada** de uma implementação com mock data para **banco de dados real (Supabase)**, seguindo o mesmo padrão bem-sucedido da implementação do Projects Kanban.

---

## 🎯 Por que a mudança?

### Problemas da Abordagem com Mock
1. ❌ **Dados não persistem** - perdidos ao recarregar página
2. ❌ **Sem segurança real** - qualquer usuário vê qualquer dado
3. ❌ **Não escalável** - difícil adicionar features complexas
4. ❌ **Inconsistente** - Projects usa banco real, Calendar usaria mock

### Vantagens da Abordagem Real
1. ✅ **Persistência permanente** - dados salvos no Supabase
2. ✅ **Segurança robusta** - RLS policies por usuário
3. ✅ **Escalabilidade** - suporta milhares de eventos
4. ✅ **Consistência** - mesma arquitetura do Projects
5. ✅ **Produção-ready** - não precisa refatorar depois

---

## 📊 Comparação de Arquiteturas

### Arquitetura Antiga (Mock)

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │
       ↓
┌─────────────────┐
│  mock-calendar  │ ← Dados em memória
│      .ts        │   (perdidos ao reload)
└─────────────────┘
```

### Nova Arquitetura (Real)

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │
       ↓ HTTP REST
┌─────────────────┐
│   FastAPI       │ ← Validação Pydantic
│   Endpoints     │   Autenticação JWT
└──────┬──────────┘
       │
       ↓ SQL
┌─────────────────┐
│   Supabase      │ ← PostgreSQL
│   (Database)    │   RLS Policies
└─────────────────┘
```

---

## 🗂️ Estrutura de Arquivos

### Arquivos REMOVIDOS
```
❌ frontend/src/lib/api/mock-calendar.ts
```

### Arquivos ADICIONADOS

#### Backend
```
✅ backend/supabase/migrations/YYYYMMDD_create_calendar_events_table.sql
✅ backend/core/calendar.py (FastAPI endpoints)
✅ backend/core/api_models/calendar.py (Pydantic models)
```

#### Frontend (atualizado)
```
✅ frontend/src/lib/types/calendar.ts
✅ frontend/src/hooks/react-query/calendar/use-calendar-events.ts
✅ frontend/src/hooks/react-query/calendar/index.ts
```

---

## 🔄 Mudanças na API

### Antes (Mock)

```typescript
// Mock API
import { mockCalendarApi } from '@/lib/api/mock-calendar'

const events = await mockCalendarApi.getEvents()
```

### Depois (Real)

```typescript
// React Query Hook
import { useCalendarEvents } from '@/hooks/react-query/calendar'

const { data: events, isLoading } = useCalendarEvents(startDate, endDate)
```

---

## 📝 Schema do Banco de Dados

### Tabela: `calendar_events`

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| id | UUID | Primary key | ✅ Auto |
| title | VARCHAR(255) | Título do evento | ✅ |
| description | TEXT | Descrição detalhada | ❌ |
| location | VARCHAR(255) | Localização | ❌ |
| start_date | TIMESTAMP | Data/hora início | ✅ |
| end_date | TIMESTAMP | Data/hora fim | ❌ |
| is_all_day | BOOLEAN | Evento dia inteiro | ✅ Default: false |
| category | VARCHAR(50) | meeting/work/personal/other | ✅ Default: other |
| color | VARCHAR(7) | Cor hex (#RRGGBB) | ✅ Default: #6B7280 |
| user_id | UUID | Dono (FK auth.users) | ✅ Auto |
| created_at | TIMESTAMP | Data criação | ✅ Auto |
| updated_at | TIMESTAMP | Data atualização | ✅ Auto |

### Constraints
- `title`: 1-255 caracteres
- `category`: valores fixos (enum)
- `color`: formato hex válido
- `end_date >= start_date`

### Indexes
- `user_id` - queries por usuário
- `start_date` - queries por período
- `category` - filtros por categoria
- `created_at` - ordenação

### RLS Policies
- Users can **SELECT** own events
- Users can **INSERT** own events
- Users can **UPDATE** own events
- Users can **DELETE** own events

---

## 🔌 Endpoints da API

### Base URL
```
/api/calendar
```

### Endpoints Disponíveis

| Method | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/events` | Lista eventos (com filtros) | ✅ |
| GET | `/events/{id}` | Busca evento específico | ✅ |
| POST | `/events` | Cria novo evento | ✅ |
| PUT | `/events/{id}` | Atualiza evento | ✅ |
| DELETE | `/events/{id}` | Deleta evento | ✅ |

### Exemplo: GET /events

**Request:**
```http
GET /api/calendar/events?start_date=2024-01-01T00:00:00Z&end_date=2024-01-31T23:59:59Z&category=meeting
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "events": [
    {
      "id": "uuid-here",
      "title": "Team Meeting",
      "description": "Weekly standup",
      "location": "Room A",
      "start_date": "2024-01-15T10:00:00Z",
      "end_date": "2024-01-15T11:00:00Z",
      "is_all_day": false,
      "category": "meeting",
      "color": "#3B82F6",
      "user_id": "user-uuid",
      "created_at": "2024-01-10T08:00:00Z",
      "updated_at": "2024-01-10T08:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "page_size": 100,
    "total_items": 1,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}
```

---

## 🚀 Plano de Implementação

### Fase 1: Backend (2-3 horas)

#### 1.1 Criar Migration SQL
```bash
cd backend/supabase/migrations
touch $(date +%Y%m%d%H%M%S)_create_calendar_events_table.sql
```

Conteúdo: Schema completo com RLS policies (ver REVISED_SPEC.md)

#### 1.2 Aplicar Migration
```bash
# Usando Supabase CLI
supabase db push

# OU manualmente via Supabase Dashboard
```

#### 1.3 Criar Pydantic Models
```bash
cd backend/core/api_models
touch calendar.py
```

Implementar:
- `CalendarEventCreateRequest`
- `CalendarEventUpdateRequest`
- `CalendarEventResponse`
- `CalendarEventsResponse`

#### 1.4 Criar FastAPI Endpoints
```bash
cd backend/core
touch calendar.py
```

Implementar:
- `GET /events` - List with filters
- `GET /events/{id}` - Get single event
- `POST /events` - Create event
- `PUT /events/{id}` - Update event
- `DELETE /events/{id}` - Delete event

#### 1.5 Registrar Router
```python
# backend/api.py
from core.calendar import router as calendar_router

app.include_router(calendar_router, prefix="/api/calendar", tags=["calendar"])
```

#### 1.6 Testar Endpoints
```bash
# Start backend
cd backend
uvicorn core.run:app --reload

# Test with curl
curl http://localhost:8000/api/calendar/events?start_date=2024-01-01T00:00:00Z&end_date=2024-01-31T23:59:59Z
```

---

### Fase 2: Frontend (2-3 horas)

#### 2.1 Criar TypeScript Types
```bash
cd frontend/src/lib/types
touch calendar.ts
```

Alinhar com Pydantic models do backend

#### 2.2 Criar React Query Hooks
```bash
cd frontend/src/hooks/react-query
mkdir calendar
cd calendar
touch use-calendar-events.ts index.ts
```

Implementar:
- `useCalendarEvents()` - Query events
- `useCreateEvent()` - Mutation create
- `useUpdateEvent()` - Mutation update
- `useDeleteEvent()` - Mutation delete

#### 2.3 Atualizar Componentes
Substituir chamadas mock por hooks React Query:

```typescript
// ANTES (Mock)
const events = await mockCalendarApi.getEvents()

// DEPOIS (Real)
const { data: events, isLoading, error } = useCalendarEvents(startDate, endDate)
```

#### 2.4 Adicionar Loading & Error States
```tsx
if (isLoading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />
```

---

### Fase 3: Integração & Testes (1-2 horas)

#### 3.1 Testar CRUD Completo
- [ ] Criar evento
- [ ] Listar eventos
- [ ] Editar evento
- [ ] Deletar evento
- [ ] Filtros (categoria, data)
- [ ] Paginação

#### 3.2 Testar Segurança
- [ ] RLS policies funcionando
- [ ] Usuário A não vê eventos do usuário B
- [ ] JWT authentication working

#### 3.3 Testar Performance
- [ ] Carregar 100+ eventos
- [ ] Navegação entre meses fluida
- [ ] React Query cache funcionando

#### 3.4 Testar Responsividade
- [ ] Mobile view
- [ ] Tablet view
- [ ] Desktop view

---

## ⚙️ Configuração Necessária

### Backend

1. **Supabase CLI** (para migrations)
```bash
brew install supabase/tap/supabase
supabase login
```

2. **Environment Variables**
```bash
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

3. **Python Dependencies** (já instaladas)
- FastAPI
- Pydantic
- Supabase client

### Frontend

1. **React Query** (já instalado)
2. **date-fns** (adicionar)
```bash
cd frontend
npm install date-fns
```

---

## 🐛 Troubleshooting

### Erro: "Column does not exist"
**Causa:** Migration não foi aplicada  
**Solução:** `supabase db push` ou aplicar manualmente

### Erro: "Permission denied for table"
**Causa:** RLS policies não configuradas corretamente  
**Solução:** Verificar policies no Supabase Dashboard

### Erro: "Failed to fetch events"
**Causa:** Backend não está rodando ou URL incorreta  
**Solução:** Verificar backend running e URL no frontend

### Erro: "Invalid JWT token"
**Causa:** Token expirado ou inválido  
**Solução:** Fazer login novamente

---

## 📚 Referências

### Documentação
- **Projects Implementation**: `backend/core/projects.py`
- **Projects Migration**: `backend/supabase/migrations/20251027090117_create_projects_table.sql`
- **API Models Pattern**: `backend/core/api_models/projects.py`

### Padrões a Seguir
1. **Naming**: Seguir convenções do Projects (snake_case no backend, camelCase no frontend)
2. **Error Handling**: Usar HTTPException no backend, try/catch no frontend
3. **Validation**: Pydantic no backend, TypeScript no frontend
4. **Security**: RLS policies + JWT authentication
5. **Performance**: Indexes no banco, React Query cache no frontend

---

## ✅ Checklist de Validação

Antes de considerar a implementação completa:

### Backend
- [ ] Migration aplicada no Supabase
- [ ] Tabela `calendar_events` criada
- [ ] RLS policies ativas
- [ ] Pydantic models definidos
- [ ] Todos os endpoints implementados
- [ ] Router registrado em `api.py`
- [ ] Testes com curl/Postman passando

### Frontend
- [ ] TypeScript types alinhados com backend
- [ ] React Query hooks criados
- [ ] Mock API removido
- [ ] Componentes usando hooks reais
- [ ] Loading states implementados
- [ ] Error handling implementado
- [ ] Testes manuais passando

### Integração
- [ ] Frontend conecta com backend
- [ ] Autenticação funcionando
- [ ] RLS isolando usuários
- [ ] CRUD completo funcionando
- [ ] Performance aceitável
- [ ] Responsivo em todos os dispositivos

---

## 🎯 Resultado Final

Após completar este guia, você terá:

1. ✅ **Calendar Page completo** com banco de dados real
2. ✅ **Backend robusto** com FastAPI + Supabase
3. ✅ **Frontend moderno** com React Query
4. ✅ **Segurança** com RLS + JWT
5. ✅ **Arquitetura consistente** com o resto do Suna
6. ✅ **Produção-ready** sem necessidade de refatoração

---

**Status:** ✅ GUIDE COMPLETO - PRONTO PARA IMPLEMENTAÇÃO

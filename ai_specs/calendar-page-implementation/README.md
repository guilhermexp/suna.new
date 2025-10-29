# Calendar Page Implementation - Status & Guide

## 📍 Onde Estamos

A especificação inicial do Calendar estava usando **mock data** (dados em memória), mas o projeto Suna usa **banco de dados real (Supabase)** para persistência.

**Status Atual:**
- ❌ Especificação antiga (mock) - **DESCARTADA**
- ✅ Nova especificação (database real) - **COMPLETA**
- ❌ Implementação - **NÃO INICIADA**

---

## 📚 Documentação Disponível

### 1. **REVISED_SPEC.md** ⭐ PRINCIPAL
Especificação técnica completa com:
- Schema do banco de dados (SQL)
- Estrutura de endpoints (FastAPI)
- Modelos Pydantic
- React Query hooks
- TypeScript types
- Plano de implementação em fases

### 2. **MIGRATION_GUIDE.md** ⭐ GUIA PRÁTICO
Guia passo-a-passo para implementação:
- Por que mudamos de mock para database real
- Comparação de arquiteturas
- Comandos específicos para cada fase
- Troubleshooting
- Checklist de validação

### 3. **requirements.md**
User stories e acceptance criteria (necessita pequenos ajustes)

### 4. **design.md**
Design de componentes (necessita ajustes para remover referências a mock)

### 5. **tasks.md**
Tarefas de implementação (necessita atualização)

---

## 🎯 O que Precisa Ser Feito

### Implementação Completa

#### **Fase 1: Backend** (2-3 horas)
1. Criar migration SQL (`calendar_events` table)
2. Criar `backend/core/api_models/calendar.py` (Pydantic models)
3. Criar `backend/core/calendar.py` (FastAPI endpoints)
4. Atualizar `backend/api.py` (registrar router)
5. Testar endpoints

#### **Fase 2: Frontend** (2-3 horas)
1. Criar `lib/types/calendar.ts` (TypeScript types)
2. Criar `hooks/react-query/calendar/` (React Query hooks)
3. Criar components (Calendar views, dialogs, etc.)
4. Atualizar sidebar navigation
5. Testar interface

#### **Fase 3: Integração** (1-2 horas)
1. Conectar frontend com backend
2. Testar CRUD completo
3. Validar segurança (RLS)
4. Testar responsividade
5. Polish final

**Total Estimado:** 5-8 horas

---

## 🚀 Como Começar

### 1. Ler Documentação
```bash
# Leia na ordem:
1. README.md (este arquivo)
2. REVISED_SPEC.md (especificação técnica)
3. MIGRATION_GUIDE.md (guia de implementação)
```

### 2. Setup Environment
```bash
# Backend
cd backend
# Verificar Supabase configurado

# Frontend
cd frontend
npm install date-fns  # Se ainda não instalado
```

### 3. Implementar Backend
```bash
# Seguir Fase 1 do MIGRATION_GUIDE.md
cd backend/supabase/migrations
# Criar migration SQL
# Aplicar migration
# Implementar endpoints
```

### 4. Implementar Frontend
```bash
# Seguir Fase 2 do MIGRATION_GUIDE.md
cd frontend/src
# Criar types
# Criar hooks
# Criar components
```

---

## 🏗️ Arquitetura

### Padrão Seguido: Projects Kanban

O Calendar segue **exatamente o mesmo padrão** da implementação do Projects:

```
┌─────────────────────────────────────────┐
│           Frontend (Next.js)            │
│  - React Query hooks                    │
│  - TypeScript types                     │
│  - Calendar components                  │
└───────────────┬─────────────────────────┘
                │
                │ HTTP REST API
                │
┌───────────────▼─────────────────────────┐
│         Backend (FastAPI)               │
│  - Pydantic models                      │
│  - CRUD endpoints                       │
│  - JWT authentication                   │
└───────────────┬─────────────────────────┘
                │
                │ SQL Queries
                │
┌───────────────▼─────────────────────────┐
│         Database (Supabase)             │
│  - calendar_events table                │
│  - RLS policies                         │
│  - Indexes                              │
└─────────────────────────────────────────┘
```

---

## 📊 Tabela do Banco

### `calendar_events`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Primary key |
| title | VARCHAR(255) | Título do evento |
| description | TEXT | Descrição (opcional) |
| location | VARCHAR(255) | Local (opcional) |
| start_date | TIMESTAMP | Data/hora início |
| end_date | TIMESTAMP | Data/hora fim (opcional) |
| is_all_day | BOOLEAN | Evento de dia inteiro |
| category | VARCHAR(50) | meeting/work/personal/other |
| color | VARCHAR(7) | Cor hex (#RRGGBB) |
| user_id | UUID | Dono do evento |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

**RLS Policies:**
- Users can only see/edit/delete their own events

---

## 🔌 API Endpoints

### Base: `/api/calendar`

| Method | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/events` | Lista eventos (com filtros e paginação) |
| GET | `/events/{id}` | Busca evento específico |
| POST | `/events` | Cria novo evento |
| PUT | `/events/{id}` | Atualiza evento |
| DELETE | `/events/{id}` | Deleta evento |

### Query Parameters (GET /events)
- `start_date` (required): ISO 8601
- `end_date` (required): ISO 8601
- `category` (optional): Filter by category
- `search` (optional): Search in title/description
- `page` (default: 1)
- `per_page` (default: 100)

---

## 🎨 Componentes Frontend

### Structure

```
app/(dashboard)/calendar/
├── page.tsx                          # Route page
└── loading.tsx                       # Loading state

components/deer-flow/calendar/
├── calendar-page-client.tsx          # Main component
├── calendar-header.tsx               # Header with controls
├── views/
│   ├── month-view.tsx                # Month grid
│   ├── week-view.tsx                 # Week timeline
│   └── day-view.tsx                  # Day timeline
├── ui/
│   ├── event-card.tsx                # Event card
│   ├── event-dialog.tsx              # Create/Edit dialog
│   └── delete-event-dialog.tsx       # Delete confirmation
└── hooks/
    └── use-calendar.ts               # Main calendar hook

hooks/react-query/calendar/
├── use-calendar-events.ts            # React Query hooks
└── index.ts

lib/types/
└── calendar.ts                       # TypeScript types
```

---

## 🔒 Segurança

### Row Level Security (RLS)

```sql
-- Users can only view their own events
CREATE POLICY "Users can view own events" ON calendar_events
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only create events for themselves
CREATE POLICY "Users can create own events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own events
CREATE POLICY "Users can update own events" ON calendar_events
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own events
CREATE POLICY "Users can delete own events" ON calendar_events
    FOR DELETE USING (auth.uid() = user_id);
```

---

## ✅ Checklist de Implementação

### Backend
- [ ] Migration SQL criada
- [ ] Migration aplicada no Supabase
- [ ] Pydantic models implementados
- [ ] FastAPI endpoints implementados
- [ ] Router registrado
- [ ] RLS policies configuradas
- [ ] Testes de endpoints realizados

### Frontend
- [ ] TypeScript types definidos
- [ ] React Query hooks criados
- [ ] Calendar page criado
- [ ] Calendar views implementadas
- [ ] Event dialogs implementados
- [ ] Sidebar navigation atualizada
- [ ] Loading/Error states
- [ ] Responsive design

### Integration
- [ ] Backend + Frontend conectados
- [ ] CRUD operations funcionando
- [ ] Authentication working
- [ ] RLS policies testadas
- [ ] Performance otimizada
- [ ] Testes completos realizados

---

## 📝 Próximos Passos

1. **Leia a documentação completa**
   - REVISED_SPEC.md (especificação técnica)
   - MIGRATION_GUIDE.md (guia de implementação)

2. **Comece pelo Backend**
   - Crie a migration SQL
   - Implemente os endpoints FastAPI
   - Teste com curl/Postman

3. **Implemente o Frontend**
   - Crie types e hooks
   - Implemente components
   - Conecte com backend

4. **Teste e Valide**
   - Teste CRUD completo
   - Valide segurança (RLS)
   - Teste responsividade

---

## 🆘 Precisa de Ajuda?

### Referências
- **Projects Implementation**: `backend/core/projects.py`
- **Projects Migration**: `backend/supabase/migrations/20251027090117_create_projects_table.sql`
- **API Models**: `backend/core/api_models/projects.py`

### Padrões
- Seguir convenções do Projects Kanban
- Usar mesma estrutura de código
- Manter consistência visual

---

## 📊 Progresso

**Documentação:** ✅ 100% completa  
**Backend:** ⏳ 0% - aguardando implementação  
**Frontend:** ⏳ 0% - aguardando implementação  
**Integração:** ⏳ 0% - aguardando implementação

**Status Geral:** 📝 Pronto para começar implementação

---

**Última Atualização:** 2025-10-27  
**Estimativa Total:** 5-8 horas de implementação

# Railway API Prefix Fix - 30 de Outubro de 2025

## 📋 Índice
- [Resumo Executivo](#resumo-executivo)
- [Problemas Identificados](#problemas-identificados)
- [Soluções Aplicadas](#soluções-aplicadas)
- [Como Prevenir no Futuro](#como-prevenir-no-futuro)
- [Checklist para PRs e Merges](#checklist-para-prs-e-merges)

---

## 🎯 Resumo Executivo

**Data:** 30 de Outubro de 2025
**Ambiente:** Railway Production
**Impacto:** Alto - Usuários não conseguiam carregar dados
**Tempo de Resolução:** ~3 horas
**Status:** ✅ Resolvido

### Problemas Principais:
1. **Race Condition de Autenticação** - CustomAgentsSection renderizava antes do AuthProvider terminar de configurar a sessão
2. **Contas não criadas automaticamente** - Trigger SQL não executou para alguns usuários
3. **Endpoints sem prefixo `/api`** - Múltiplos endpoints faltando o prefixo obrigatório

---

## 🔥 Problemas Identificados

### **1. Race Condition de Autenticação**

#### Sintoma:
```
Dashboard exibia skeleton loaders infinitos
Nenhuma requisição API era feita ao backend
Console mostrava: hasUser: false
```

#### Causa Raiz:
O componente `DashboardContent` renderizava `CustomAgentsSection` **imediatamente**, mas o `AuthProvider` ainda não havia terminado de configurar a sessão no Supabase client.

**Código Problemático:**
```typescript
// frontend/src/components/dashboard/dashboard-content.tsx (linha 92)
const { user } = useAuth(); // ❌ Não verificava isLoading

// Linha 399 - Renderizava imediatamente
{enabledEnvironment && (
  <CustomAgentsSection onAgentSelect={setSelectedAgent} />
)}
```

**Fluxo do Problema:**
```
1. Página carrega → AuthProvider inicia
2. DashboardContent renderiza → CustomAgentsSection renderiza
3. CustomAgentsSection chama useKortixTeamTemplates()
4. Hook tenta: const { data: { session } } = await supabase.auth.getSession()
5. ❌ Session ainda não está disponível → queries ficam pendentes
6. Resultado: Loading infinito
```

#### Solução:
```typescript
// frontend/src/components/dashboard/dashboard-content.tsx
const { user, isLoading: isAuthLoading } = useAuth(); // ✅ Pega isLoading

// Só renderiza depois que auth carregou
{enabledEnvironment && !isAuthLoading && (
  <CustomAgentsSection onAgentSelect={setSelectedAgent} />
)}
```

**Commit:** `e32db2c4` - "fix: Wait for auth to load before rendering CustomAgentsSection"

---

### **2. Usuários sem Conta no Basejump**

#### Sintoma:
```javascript
// Console logs mostravam:
userId: 'f74eb556-f48b-4a61-9db7-5d4486ac4a46' // Existe em auth.users
hasUser: false // ❌ Mas não encontra account

// Queries retornavam vazio:
GET /rest/v1/projects?account_id=eq.f74eb556... → []
GET /rest/v1/threads?account_id=eq.f74eb556... → []
```

#### Causa Raiz:
O usuário foi criado em `auth.users`, mas o trigger SQL `on_auth_user_created` (que deveria criar automaticamente uma entrada em `basejump.accounts`) **não executou** para alguns usuários.

**Trigger Esperado:**
```sql
-- backend/supabase/migrations/20240414161947_basejump-accounts.sql (linha 232-236)
create trigger on_auth_user_created
    after insert
    on auth.users
    for each row
execute procedure basejump.run_new_user_setup();
```

**Função que deveria executar:**
```sql
-- Linha 201-229
create or replace function basejump.run_new_user_setup()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
as
$$
declare
    first_account_id    uuid;
    generated_user_name text;
begin
    -- Cria conta pessoal
    insert into basejump.accounts (name, primary_owner_user_id, personal_account, id)
    values (generated_user_name, NEW.id, true, NEW.id)
    returning id into first_account_id;

    -- Adiciona à tabela account_user
    insert into basejump.account_user (account_id, user_id, account_role)
    values (first_account_id, NEW.id, 'owner');

    return NEW;
end;
$$;
```

#### Solução Imediata:
Executar SQL manualmente no Supabase Dashboard:

```sql
DO $$
DECLARE
    target_user_id uuid := 'f74eb556-f48b-4a61-9db7-5d4486ac4a46';
    user_email text;
    generated_name text;
BEGIN
    -- Verifica se conta já existe
    IF EXISTS (SELECT 1 FROM basejump.accounts WHERE id = target_user_id) THEN
        RAISE NOTICE 'Conta já existe';
        RETURN;
    END IF;

    -- Pega email do usuário
    SELECT email INTO user_email FROM auth.users WHERE id = target_user_id;
    generated_name := COALESCE(split_part(user_email, '@', 1), 'User');

    -- Cria conta
    INSERT INTO basejump.accounts (id, name, primary_owner_user_id, personal_account, created_at, updated_at)
    VALUES (target_user_id, generated_name, target_user_id, true, NOW(), NOW());

    -- Cria account_user
    INSERT INTO basejump.account_user (user_id, account_id, account_role)
    VALUES (target_user_id, target_user_id, 'owner');

    RAISE NOTICE 'Conta criada com sucesso';
END $$;
```

#### Solução Permanente:
**TODO:** Investigar por que o trigger não está executando para alguns usuários e implementar fallback no código.

---

### **3. Endpoints sem Prefixo `/api`**

#### Sintoma:
```
❌ 404 Not Found:
- /composio/toolkits/slack/icon
- /composio/toolkits/notion/icon
- /composio/toolkits/googledrive/icon
- /billing/subscription
- /billing/balance
```

#### Causa Raiz:
O backend FastAPI tem **TODOS** os endpoints sob o prefixo `/api`:

```python
# backend/api.py (linha 250)
app.include_router(api_router, prefix="/api")
```

Mas o frontend estava chamando os endpoints **sem** o prefixo `/api`.

#### Arquivos Corrigidos:

**1. Composio Icon Endpoint**
```typescript
// frontend/src/hooks/react-query/composio/utils.ts (linha 335)
// ANTES:
const response = await backendApi.get(`/composio/toolkits/${toolkitSlug}/icon`);

// DEPOIS:
const response = await backendApi.get(`/api/composio/toolkits/${toolkitSlug}/icon`);
```

**2. Todos os Billing Endpoints**
```typescript
// frontend/src/lib/api/billing-v2.ts
// ANTES:
await backendApi.get<SubscriptionInfo>('/billing/subscription');
await backendApi.get<CreditBalance>('/billing/balance');
await backendApi.post<BillingStatus>('/billing/check');
// ... (15+ endpoints)

// DEPOIS:
await backendApi.get<SubscriptionInfo>('/api/billing/subscription');
await backendApi.get<CreditBalance>('/api/billing/balance');
await backendApi.post<BillingStatus>('/api/billing/check');
// ... (todos com /api)
```

**3. Subscription Page**
```typescript
// frontend/src/app/subscription/page.tsx (linha 31)
// ANTES:
const response = await backendApi.get('/billing/subscription');

// DEPOIS:
const response = await backendApi.get('/api/billing/subscription');
```

**4. Composio Test Page**
```typescript
// frontend/src/app/(dashboard)/composio-test/page.tsx
// ANTES:
await backendApi.post('/composio/test-authentication', {...});
await backendApi.get('/composio/health');

// DEPOIS:
await backendApi.post('/api/composio/test-authentication', {...});
await backendApi.get('/api/composio/health');
```

**5. Composio Triggers**
```typescript
// frontend/src/hooks/react-query/composio/use-composio-triggers.ts
// ANTES:
await backendApi.get<ComposioAppsWithTriggersResponse>('/composio/triggers/apps');
await backendApi.post('/composio/triggers/create', payload);

// DEPOIS:
await backendApi.get<ComposioAppsWithTriggersResponse>('/api/composio/triggers/apps');
await backendApi.post('/api/composio/triggers/create', payload);
```

**6. Todas as rotas do Composio Utils**
```typescript
// frontend/src/hooks/react-query/composio/utils.ts
// CORRIGIDO:
'/api/composio/categories'
'/api/composio/toolkits'
'/api/composio/profiles'
'/api/composio/toolkits/${toolkitSlug}/details'
'/api/composio/tools/list'
// ... (todos os endpoints)
```

#### Comando Usado para Correção em Massa:
```bash
# Billing endpoints
sed -i '' "s|'/billing/|'/api/billing/|g" src/lib/api/billing-v2.ts

# Composio endpoints
sed -i '' "s|'/composio/|'/api/composio/|g" src/app/(dashboard)/composio-test/page.tsx
sed -i '' "s|'/composio/|'/api/composio/|g" src/hooks/react-query/composio/use-composio-triggers.ts
sed -i '' "s|'/composio/|'/api/composio/|g" src/hooks/react-query/composio/utils.ts
```

**Commit:** `b4a07b9c` - "fix: Add missing /api prefix to composio and billing endpoints"

---

## ✅ Soluções Aplicadas

### Timeline de Resolução:

```
[20:58] 🔍 Problema reportado: Skeleton loaders infinitos
[21:15] 🔍 Diagnóstico inicial: Verificação de logs do backend
[21:30] 🎯 Causa 1 identificada: Race condition de auth
[21:45] ✅ Fix 1 aplicado: Adicionar isLoading check
[22:00] 🔍 Problema persiste: Usuário sem conta no Basejump
[22:30] 🎯 Causa 2 identificada: Trigger SQL não executou
[22:45] ✅ Fix 2 aplicado: SQL manual no Supabase Dashboard
[23:00] 🔍 Problema persiste: Erros 404 em múltiplos endpoints
[23:15] 🎯 Causa 3 identificada: Endpoints sem prefixo /api
[23:45] ✅ Fix 3 aplicado: Adicionar /api em todos os endpoints
[00:15] ✅ Deploy completo no Railway
[00:30] ✅ Verificação: Todos os erros resolvidos
```

### Commits Aplicados:

1. **Auth Race Condition Fix**
   - Commit: `e32db2c4`
   - Arquivo: `frontend/src/components/dashboard/dashboard-content.tsx`
   - Mudança: Adicionar `isLoading` check antes de renderizar CustomAgentsSection

2. **API Prefix Fix**
   - Commit: `b4a07b9c`
   - Arquivos: 7 arquivos modificados
   - Mudança: Adicionar `/api` prefix em 50+ endpoints

### Verificação Pós-Deploy:

```bash
# Teste dos endpoints corrigidos:
curl https://backend-production-bda1.up.railway.app/api/composio/toolkits/slack/icon
# ✅ Status: 200 OK

curl https://backend-production-bda1.up.railway.app/api/billing/subscription
# ✅ Status: 401 (Unauthorized - esperado sem token, endpoint existe)

curl https://backend-production-bda1.up.railway.app/api/health
# ✅ Status: 200 OK
```

---

## 🛡️ Como Prevenir no Futuro

### 1. Pre-Commit Hooks

Adicionar validação automática antes de commits:

```bash
# .husky/pre-commit ou equivalente
#!/bin/sh

# Verificar se há endpoints sem /api prefix no frontend
echo "🔍 Verificando endpoints sem prefixo /api..."

# Buscar padrões problemáticos
PROBLEMATIC_PATTERNS=(
  "backendApi\.get\(['\"]\/(?!api\/)[a-z]"
  "backendApi\.post\(['\"]\/(?!api\/)[a-z]"
  "backendApi\.put\(['\"]\/(?!api\/)[a-z]"
  "backendApi\.delete\(['\"]\/(?!api\/)[a-z]"
)

FOUND_ISSUES=0

for pattern in "${PROBLEMATIC_PATTERNS[@]}"; do
  if grep -rE "$pattern" frontend/src --include="*.ts" --include="*.tsx" | grep -v "node_modules"; then
    echo "❌ Encontrado endpoint sem /api prefix!"
    FOUND_ISSUES=1
  fi
done

if [ $FOUND_ISSUES -eq 1 ]; then
  echo ""
  echo "⚠️  ATENÇÃO: Endpoints devem começar com /api/"
  echo "Exemplo: backendApi.get('/api/billing/subscription')"
  echo ""
  exit 1
fi

echo "✅ Verificação de endpoints OK!"
```

### 2. Linting Rules

Adicionar regra ESLint customizada:

```javascript
// .eslintrc.js ou eslint.config.js
module.exports = {
  rules: {
    // Regra customizada para verificar /api prefix
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.object.name="backendApi"] Literal[value=/^\\/(?!api\\/)/]',
        message: 'Backend API calls must start with /api/ prefix. Example: backendApi.get("/api/endpoint")'
      }
    ]
  }
};
```

### 3. TypeScript Strict Typing

Criar tipos seguros para endpoints:

```typescript
// frontend/src/lib/api-routes.ts
type ApiRoute = `/api/${string}`;

export const backendApi = {
  get: <T = any>(endpoint: ApiRoute, options?: ApiClientOptions) =>
    apiClient.get<T>(`${API_URL}${endpoint}`, options),

  post: <T = any>(endpoint: ApiRoute, data?: any, options?: ApiClientOptions) =>
    apiClient.post<T>(`${API_URL}${endpoint}`, data, options),

  // ... outros métodos
};

// Uso:
backendApi.get('/api/billing/subscription'); // ✅ OK
backendApi.get('/billing/subscription');     // ❌ Erro de tipo!
```

### 4. Testes de Integração

Adicionar teste que verifica todos os endpoints:

```typescript
// frontend/__tests__/api-endpoints.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('API Endpoints Validation', () => {
  it('should have /api prefix in all backendApi calls', () => {
    const srcDir = path.join(__dirname, '../src');
    const files = getAllTsFiles(srcDir);

    const invalidEndpoints: string[] = [];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.matchAll(/backendApi\.(get|post|put|delete)\(['"](\/)(?!api\/)[^'"]+['"]/g);

      for (const match of matches) {
        invalidEndpoints.push(`${file}: ${match[0]}`);
      }
    });

    expect(invalidEndpoints).toHaveLength(0);
  });
});
```

### 5. Auth Loading Guard Pattern

**SEMPRE** verificar `isLoading` antes de renderizar componentes que dependem de autenticação:

```typescript
// ✅ PADRÃO CORRETO:
const MyComponent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <DataComponent />; // Só renderiza quando auth está pronto
};

// ❌ PADRÃO INCORRETO:
const MyComponent = () => {
  const { user } = useAuth(); // Falta isLoading!

  return <DataComponent />; // Pode causar race condition
};
```

### 6. Supabase Trigger Monitoring

Adicionar monitoring para verificar se triggers estão executando:

```sql
-- Criar tabela de audit
CREATE TABLE IF NOT EXISTS public.trigger_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_name text NOT NULL,
  table_name text NOT NULL,
  user_id uuid NOT NULL,
  executed_at timestamptz DEFAULT now(),
  success boolean DEFAULT true,
  error_message text
);

-- Modificar trigger para logar execução
CREATE OR REPLACE FUNCTION basejump.run_new_user_setup()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
DECLARE
    first_account_id uuid;
    generated_user_name text;
BEGIN
    -- Log início
    INSERT INTO public.trigger_audit (trigger_name, table_name, user_id, success)
    VALUES ('on_auth_user_created', 'auth.users', NEW.id, true);

    -- Lógica original...
    IF new.email IS NOT NULL THEN
        generated_user_name := split_part(new.email, '@', 1);
    END IF;

    INSERT INTO basejump.accounts (name, primary_owner_user_id, personal_account, id)
    VALUES (generated_user_name, NEW.id, true, NEW.id)
    RETURNING id INTO first_account_id;

    INSERT INTO basejump.account_user (account_id, user_id, account_role)
    VALUES (first_account_id, NEW.id, 'owner');

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log erro
    INSERT INTO public.trigger_audit (trigger_name, table_name, user_id, success, error_message)
    VALUES ('on_auth_user_created', 'auth.users', NEW.id, false, SQLERRM);

    RAISE;
END;
$$;
```

Então criar um endpoint de monitoring:

```python
# backend/app/api/v1/endpoints/monitoring.py
@router.get("/monitoring/trigger-failures")
async def get_trigger_failures(
    hours: int = 24,
    current_user: str = Depends(verify_admin_user)
):
    """Retorna triggers que falharam nas últimas X horas"""
    supabase = await get_supabase_admin()

    result = supabase.table("trigger_audit")\
        .select("*")\
        .eq("success", False)\
        .gte("executed_at", f"now() - interval '{hours} hours'")\
        .execute()

    return {"failures": result.data}
```

---

## 📋 Checklist para PRs e Merges

### Antes de Criar um PR:

- [ ] **Verificar endpoints do frontend:**
  ```bash
  # Buscar endpoints sem /api prefix
  grep -rE "backendApi\.(get|post|put|delete)\(['\"]\/(?!api\/)" frontend/src --include="*.ts" --include="*.tsx"
  ```

- [ ] **Verificar race conditions de auth:**
  ```bash
  # Buscar uso de useAuth sem verificar isLoading
  grep -rE "const \{ user \} = useAuth\(\)" frontend/src --include="*.tsx"
  ```

- [ ] **Testar localmente com auth real:**
  - [ ] Fazer logout completo
  - [ ] Criar nova conta
  - [ ] Verificar se dados carregam imediatamente
  - [ ] Verificar console do browser (F12) para erros

- [ ] **Verificar migrations do Supabase:**
  - [ ] Todos os triggers estão ativos
  - [ ] Migrations aplicadas em ordem correta
  - [ ] Rollback testado

- [ ] **Rodar linter e testes:**
  ```bash
  npm run lint
  npm run test
  npm run type-check
  ```

### Durante Code Review:

- [ ] **Verificar padrões de API calls:**
  - Todos os endpoints começam com `/api/`
  - Nenhum endpoint duplicado (ex: `/api/api/...`)
  - Headers de autenticação estão corretos

- [ ] **Verificar auth guards:**
  - Componentes verificam `isLoading` antes de renderizar
  - Redirects funcionam corretamente para usuários não autenticados
  - Não há race conditions em hooks

- [ ] **Verificar SQL/Migrations:**
  - Triggers têm error handling
  - Constraints não vão quebrar dados existentes
  - Índices apropriados para queries

### Após Merge para Main:

- [ ] **Monitorar Railway deployment:**
  - Build completa sem erros
  - Deploy bem-sucedido
  - Health check passa

- [ ] **Teste de Smoke em Production:**
  ```bash
  # Health check
  curl https://backend-production-bda1.up.railway.app/api/health

  # Frontend loading
  curl https://frontend-production-410a.up.railway.app
  ```

- [ ] **Verificar Sentry/Logging:**
  - Nenhum erro 404 novo
  - Nenhum erro de autenticação
  - Response times normais

- [ ] **Teste com usuário real:**
  - [ ] Login funciona
  - [ ] Dashboard carrega dados
  - [ ] Nenhum skeleton loader infinito

### Em Caso de Rollback:

```bash
# 1. Identificar último commit bom
git log --oneline

# 2. Reverter commit problemático
git revert <commit-hash>
git push origin main

# 3. Ou fazer rollback no Railway
# Railway > Deployments > Click no deployment anterior > "Redeploy"

# 4. Notificar equipe
echo "🚨 Rollback realizado: <motivo>"
```

---

## 🔍 Comandos de Debug Úteis

### Frontend (Browser DevTools):

```javascript
// No Console do Browser (F12):

// 1. Verificar estado do auth
const auth = JSON.parse(localStorage.getItem('supabase.auth.token'));
console.log('Auth token:', auth);

// 2. Verificar se AuthProvider está pronto
window.__DEBUG_AUTH__ = true; // Adicionar no AuthProvider

// 3. Ver todas as requisições de API
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('backend-production'))
  .forEach(r => console.log(r.name, r.responseStatus));
```

### Backend (Railway):

```bash
# Ver logs em tempo real
railway logs --service backend -f

# Ver logs de um deployment específico
railway logs --service backend --deployment <deployment-id>

# Verificar variáveis de ambiente
railway variables --service backend

# SSH no container (se necessário)
railway shell --service backend
```

### Supabase:

```sql
-- Verificar se usuário tem conta
SELECT
  u.id as user_id,
  u.email,
  a.id as account_id,
  a.name as account_name,
  au.account_role
FROM auth.users u
LEFT JOIN basejump.accounts a ON a.id = u.id
LEFT JOIN basejump.account_user au ON au.user_id = u.id
WHERE u.email = 'usuario@example.com';

-- Verificar triggers ativos
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%auth%';

-- Ver últimas execuções de triggers (se audit table existir)
SELECT * FROM public.trigger_audit
ORDER BY executed_at DESC
LIMIT 50;
```

### Testes de Endpoint:

```bash
# Com autenticação
TOKEN="seu-token-jwt-aqui"
curl -H "Authorization: Bearer $TOKEN" \
     https://backend-production-bda1.up.railway.app/api/billing/subscription

# Verificar todos os endpoints críticos
ENDPOINTS=(
  "/api/health"
  "/api/composio/health"
  "/api/agents"
  "/api/projects"
  "/api/billing/subscription"
)

for endpoint in "${ENDPOINTS[@]}"; do
  echo "Testing $endpoint..."
  curl -I "https://backend-production-bda1.up.railway.app$endpoint"
done
```

---

## 📚 Documentos Relacionados

- `RAILWAY_AUTH_FIX_REPORT.md` - Fix anterior de login loop
- `RAILWAY_LOGIN_FIX.md` - Implementação de session bridge API
- `RAILWAY_WORKER_FIX.md` - Fix de ENV_MODE do worker
- `RAILWAY_DEPLOYMENT.md` - Configuração geral do Railway

---

## 📝 Notas Finais

### O que funcionou bem:
✅ Diagnóstico sistemático dos erros
✅ Uso de logs detalhados para identificar problemas
✅ Correções em massa com sed para múltiplos arquivos
✅ Teste de endpoints após deploy

### O que pode melhorar:
⚠️ Adicionar testes automatizados para endpoints
⚠️ Implementar pre-commit hooks para validação
⚠️ Criar monitoring para triggers do Supabase
⚠️ Documentar padrões de API call no README

### Ações Pendentes:
- [ ] Investigar por que trigger SQL não executou para alguns usuários
- [ ] Implementar fallback para criação de conta no código
- [ ] Adicionar monitoring de triggers no Supabase
- [ ] Criar dashboard de health checks
- [ ] Adicionar testes E2E para fluxo de signup

---

**Autor:** Claude Code
**Data:** 30 de Outubro de 2025
**Status:** ✅ Completo e Verificado

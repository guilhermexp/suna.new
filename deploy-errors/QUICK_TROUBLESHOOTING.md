# 🚨 Guia Rápido de Troubleshooting

## 🎯 Diagnóstico Rápido por Sintoma

### 1. "Dashboard com skeleton loaders infinitos"

**Sintomas:**
- Página carrega mas mostra loading infinito
- Nenhum dado aparece
- Console sem erros óbvios

**Diagnóstico:**
```javascript
// No console do browser (F12):
localStorage.getItem('supabase.auth.token')

// Se retornar null ou undefined:
// → Problema de autenticação
// Vá para seção "Problemas de Auth" abaixo

// Se retornar um token:
// → Possível race condition
// Vá para seção "Race Conditions" abaixo
```

**Fix Rápido:**
```bash
# 1. Limpar cache do browser
# Chrome: Ctrl+Shift+Delete → Limpar tudo

# 2. Fazer logout completo
# 3. Fazer login novamente

# Se persistir → verificar logs do backend
railway logs --service backend -f
```

---

### 2. "Erro 404 em múltiplos endpoints"

**Sintomas:**
```
❌ GET /billing/subscription → 404
❌ GET /composio/toolkits/slack/icon → 404
❌ POST /agents → 404
```

**Causa:** Endpoint sem prefixo `/api`

**Fix Rápido:**
```bash
# Encontrar todos os endpoints problemáticos:
grep -rE "backendApi\.(get|post|put|delete)\(['\"]\/(?!api\/)" frontend/src --include="*.ts" --include="*.tsx"

# Corrigir automaticamente:
find frontend/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s|backendApi\.get('/|backendApi.get('/api/|g"
find frontend/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s|backendApi\.post('/|backendApi.post('/api/|g"
find frontend/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s|backendApi\.put('/|backendApi.put('/api/|g"
find frontend/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s|backendApi\.delete('/|backendApi.delete('/api/|g"

# ATENÇÃO: Verificar se não criou /api/api/
grep -r "/api/api/" frontend/src

# Commit e deploy:
git add -A
git commit -m "fix: Add /api prefix to endpoints"
git push
```

---

### 3. "Erro: hasUser: false mas usuário está logado"

**Sintomas:**
```javascript
// Console mostra:
{
  userId: 'f74eb556-f48b-4a61-9db7-5d4486ac4a46',
  hasUser: false  // ❌ Deveria ser true
}
```

**Causa:** Usuário existe em `auth.users` mas não tem registro em `basejump.accounts`

**Fix IMEDIATO (5 minutos):**

1. Acessar Supabase Dashboard: https://supabase.com/dashboard
2. Ir em "SQL Editor"
3. Executar este SQL (substituir `USER_ID`):

```sql
DO $$
DECLARE
    target_user_id uuid := 'f74eb556-f48b-4a61-9db7-5d4486ac4a46'; -- ← SUBSTITUIR
    user_email text;
    generated_name text;
BEGIN
    -- Verificar se conta já existe
    IF EXISTS (SELECT 1 FROM basejump.accounts WHERE id = target_user_id) THEN
        RAISE NOTICE 'Conta já existe';
        RETURN;
    END IF;

    -- Pegar email do usuário
    SELECT email INTO user_email FROM auth.users WHERE id = target_user_id;
    generated_name := COALESCE(split_part(user_email, '@', 1), 'User');

    -- Criar conta
    INSERT INTO basejump.accounts (id, name, primary_owner_user_id, personal_account, created_at, updated_at)
    VALUES (target_user_id, generated_name, target_user_id, true, NOW(), NOW());

    -- Criar account_user
    INSERT INTO basejump.account_user (user_id, account_id, account_role)
    VALUES (target_user_id, target_user_id, 'owner');

    RAISE NOTICE 'Conta criada com sucesso!';
END $$;
```

4. Recarregar a página no browser

**Verificar se funcionou:**
```sql
-- No SQL Editor do Supabase:
SELECT
  u.id as user_id,
  u.email,
  a.id as account_id,
  a.name as account_name,
  au.account_role
FROM auth.users u
LEFT JOIN basejump.accounts a ON a.id = u.id
LEFT JOIN basejump.account_user au ON au.user_id = u.id
WHERE u.id = 'f74eb556-f48b-4a61-9db7-5d4486ac4a46';  -- ← SUBSTITUIR

-- Deve retornar UMA linha com account_id preenchido
```

---

### 4. "Deployment failing no Railway"

**Sintomas:**
- Build falha com erro
- Deploy fica vermelho
- Aplicação não atualiza

**Diagnóstico:**
```bash
# Ver logs do deployment
railway logs --service frontend --deployment <deployment-id>

# Ou no Railway Dashboard:
# https://railway.app → Project → Deployments → Click no deployment → Ver logs
```

**Erros Comuns:**

#### a) TypeScript errors
```
Error: Type '...' is not assignable to type '...'
```

**Fix:**
```bash
# Rodar localmente primeiro:
npm run type-check

# Corrigir os erros
# Depois:
git add .
git commit -m "fix: TypeScript errors"
git push
```

#### b) Build timeout
```
Error: Build exceeded 10 minute timeout
```

**Fix:**
```bash
# Aumentar timeout no Railway ou otimizar build:
# 1. Verificar se .next está no .dockerignore
# 2. Verificar se node_modules está no .dockerignore
# 3. Usar cache de build do Docker
```

#### c) Environment variables missing
```
Error: NEXT_PUBLIC_BACKEND_URL is not defined
```

**Fix:**
```bash
# No Railway Dashboard:
# 1. Ir em Variables
# 2. Adicionar variável faltando
# 3. Redeploy
```

---

### 5. "Backend retorna 500 Internal Server Error"

**Sintomas:**
```
POST /api/agents → 500
Response: {"detail": "Internal Server Error"}
```

**Diagnóstico:**
```bash
# Ver logs do backend em tempo real:
railway logs --service backend -f

# Procurar por:
# - Traceback (Python)
# - ERROR
# - Exception
```

**Erros Comuns:**

#### a) Supabase connection error
```
Error: Could not connect to Supabase
```

**Fix:**
```bash
# Verificar env vars no Railway:
railway variables --service backend

# Deve ter:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY

# Se faltando, adicionar no Railway Dashboard
```

#### b) Database constraint violation
```
ERROR: duplicate key value violates unique constraint
```

**Fix:**
```sql
-- No Supabase SQL Editor:
-- Encontrar o registro duplicado
SELECT * FROM <table_name> WHERE <unique_column> = '<valor>';

-- Remover duplicata ou ajustar código
```

---

## 🔍 Fluxo de Diagnóstico Sistemático

### Passo 1: Identificar Camada do Problema

```
┌─────────────────────┐
│   Frontend Load?    │
└──────┬──────────────┘
       │
       ├─ SIM ──┐
       │        │
       │   ┌────▼────────────┐
       │   │ Auth Working?   │
       │   └────┬────────────┘
       │        │
       │        ├─ SIM ──┐
       │        │        │
       │        │   ┌────▼──────────────┐
       │        │   │ API Calls 404?    │
       │        │   └────┬──────────────┘
       │        │        │
       │        │        ├─ SIM → Problema: /api prefix
       │        │        └─ NÃO → Problema: Race condition
       │        │
       │        └─ NÃO → Problema: Auth/Session
       │
       └─ NÃO → Problema: Build/Deploy
```

### Passo 2: Coletar Informações

```bash
# 1. Frontend logs (Browser F12):
# - Console errors
# - Network tab (ver requests falhando)
# - Application tab (ver localStorage)

# 2. Backend logs:
railway logs --service backend --lines 100 > backend-logs.txt

# 3. Deployment status:
railway status

# 4. Recent commits:
git log --oneline -10
```

### Passo 3: Teste de Isolamento

```bash
# Teste 1: Health check do backend
curl https://backend-production-bda1.up.railway.app/api/health

# Teste 2: Frontend SSR
curl https://frontend-production-410a.up.railway.app/

# Teste 3: API com auth
TOKEN="<seu-token>"
curl -H "Authorization: Bearer $TOKEN" \
     https://backend-production-bda1.up.railway.app/api/agents

# Teste 4: Supabase direto
curl "https://qupamuozvmiewijkvxws.supabase.co/rest/v1/agents?select=*" \
     -H "apikey: <anon-key>" \
     -H "Authorization: Bearer <token>"
```

---

## 📊 Matriz de Problemas Comuns

| Sintoma | Causa Provável | Fix Rápido | Tempo |
|---------|---------------|------------|-------|
| Loading infinito | Race condition | Adicionar `isLoading` check | 5 min |
| 404 em endpoints | Falta `/api` prefix | Adicionar `/api` nos endpoints | 10 min |
| hasUser: false | Conta não criada | Executar SQL no Supabase | 5 min |
| Build failing | TypeScript error | `npm run type-check` e corrigir | 15 min |
| 500 errors | Backend exception | Ver logs e corrigir bug | 30+ min |
| CORS error | Railway URL não configurado | Adicionar URL no backend CORS | 5 min |
| Auth loop | Session bridge faltando | Ver `RAILWAY_LOGIN_FIX.md` | 30 min |

---

## 🛠️ Comandos de Emergência

### Rollback Rápido (2 minutos)
```bash
# Opção 1: Git revert
git revert HEAD
git push

# Opção 2: Railway Dashboard
# 1. Ir em Deployments
# 2. Clicar no último que funcionava
# 3. "Redeploy"
```

### Restart Serviços (1 minuto)
```bash
# Restart backend
railway restart --service backend

# Restart frontend
railway restart --service frontend

# Restart all
railway restart
```

### Ver Logs em Tempo Real (útil durante debug)
```bash
# Terminal 1: Backend logs
railway logs --service backend -f

# Terminal 2: Frontend logs
railway logs --service frontend -f

# Terminal 3: Worker logs (se tiver)
railway logs --service worker -f
```

### Verificar Health de Todos os Serviços
```bash
#!/bin/bash
echo "🔍 Verificando health dos serviços..."

# Backend
echo "Backend:"
curl -s https://backend-production-bda1.up.railway.app/api/health | jq

# Frontend
echo "Frontend:"
curl -I https://frontend-production-410a.up.railway.app/ | grep HTTP

# Database (Supabase)
echo "Database:"
curl -s "https://qupamuozvmiewijkvxws.supabase.co/rest/v1/?apikey=<key>" | jq
```

---

## 📞 Quando Pedir Ajuda

### Antes de Escalar:

✅ **Checklist de Auto-Debug:**
- [ ] Li os logs completamente
- [ ] Testei os endpoints manualmente
- [ ] Verifiquei commits recentes
- [ ] Tentei rollback
- [ ] Consultei documentação anterior (`deploy-errors/`)

### Informações para Incluir ao Pedir Ajuda:

```markdown
## 🚨 Problema no Deploy

**Sintoma:**
[Descrever o que está acontecendo]

**Como Reproduzir:**
1. [Passo 1]
2. [Passo 2]
3. [Ver erro]

**Logs Relevantes:**
```
[Colar logs aqui]
```

**Já Tentei:**
- [x] Rollback → [resultado]
- [x] Restart serviços → [resultado]
- [ ] ...

**Commits Recentes:**
```
abc1234 - feat: Nova feature
def5678 - fix: Correção de bug
```

**Environment:**
- Service: Backend/Frontend/Worker
- Railway Project: suna-kortix
- Branch: main
- Deploy ID: abc123
```

---

**Última Atualização:** 30 de Outubro de 2025
**Versão:** 1.0

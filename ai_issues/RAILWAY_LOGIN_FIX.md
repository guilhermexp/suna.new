# Correção de Login e Self-Hosted Mode - suna.new Railway

**Data:** 11 de Janeiro de 2025
**Projeto:** suna.new (Railway Deployment)
**Problema:** Login não funcionando em produção + Modo production mostrando paywalls

---

## 1. Problema Inicial

### Sintomas Reportados
- Login funcionando localmente mas falhando no Railway
- Aplicação similar (supermemory) teve problema parecido que foi resolvido
- Após correção inicial, descoberto segundo problema: versão self-hosted mostrando prompts de upgrade/paywall

### Credenciais de Teste
- Email: `guilherme-varela@hotmail.com`
- Senha: `adoado01`

---

## 2. Arquitetura do Sistema

### Frontend
- Next.js (App Router)
- Supabase Auth (`@supabase/ssr`) com cookies httpOnly
- Railway deployment com variáveis `NEXT_PUBLIC_*`

### Backend
- FastAPI (Python)
- CORS middleware para controle de origem
- Supabase como database

### Autenticação
- Supabase SSR com cookies httpOnly para segurança
- Server-side session management
- Middleware protegendo rotas privadas

---

## 3. Diagnóstico Inicial

### Comparação com supermemory
- **supermemory:** Usava custom auth, problema era cross-domain cookies
- **suna.new:** Usa Supabase Auth - arquitetura completamente diferente
- Conclusão: Não era o mesmo problema

### Problema Real Identificado
1. **Código forçando httpOnly: false** - quebrando SSR do Supabase
2. **Dockerfile não passando variáveis** - NEXT_PUBLIC_* com valores placeholder
3. **CORS bloqueando Railway frontend** - Backend só aceitava suna.so
4. **ENV_MODE=PRODUCTION** - Ativando features de billing/paywall

---

## 4. Correções Aplicadas

### 4.1 Restaurar httpOnly Padrão do Supabase

**Arquivo:** `frontend/src/lib/supabase/server.ts`
**Linha:** 20

```typescript
// ANTES (ERRADO)
cookieStore.set(name, value, { ...options, httpOnly: false })

// DEPOIS (CORRETO)
cookieStore.set(name, value, options)
```

**Arquivo:** `frontend/src/middleware.ts`
**Linha:** 55

```typescript
// ANTES (ERRADO)
supabaseResponse.cookies.set(name, value, { ...options, httpOnly: false });

// DEPOIS (CORRETO)
supabaseResponse.cookies.set(name, value, options);
```

**Motivo:** Supabase SSR requer httpOnly: true para segurança. Forçar false quebra a autenticação server-side.

---

### 4.2 Criar API Bridge para Sessão

**Arquivo Criado:** `frontend/src/app/api/auth/session/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return NextResponse.json({ session: null, user: null }, { status: 200 });
    }

    return NextResponse.json({
      session: session ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: session.user,
      } : null,
      user: session?.user ?? null,
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in session API:', error);
    return NextResponse.json({ session: null, user: null }, { status: 500 });
  }
}
```

**Motivo:** Client-side não consegue ler cookies httpOnly. Esta API faz a ponte entre server (que lê os cookies) e client.

---

### 4.3 Atualizar AuthProvider para Usar API Bridge

**Arquivo:** `frontend/src/components/AuthProvider.tsx`
**Linhas:** 32-56

```typescript
useEffect(() => {
  const getInitialSession = async () => {
    try {
      // Call server-side API to get session (handles httpOnly cookies)
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      setSession(data.session);
      setUser(data.user);

      // If we have a session, set it in the Supabase client for subsequent requests
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }
    } catch (error) {
      console.error('Error getting session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  getInitialSession();
  // ... rest of auth listener
```

**Motivo:** AuthProvider agora busca a sessão via API server-side ao invés de tentar ler cookies httpOnly diretamente.

---

### 4.4 Corrigir Dockerfile - Passar Variáveis de Ambiente

**Arquivo:** `frontend/Dockerfile`
**Linhas:** 34-57

```dockerfile
# ---- Builder Stage ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Declare build arguments for NEXT_PUBLIC_* variables (passed from Railway)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_ENV_MODE

# Set as environment variables for Next.js build (embedded in JS bundles)
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_ENV_MODE=$NEXT_PUBLIC_ENV_MODE

# Next.js collects completely anonymous telemetry data about general usage.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_OUTPUT=standalone

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi
```

**Problema:** Variáveis `NEXT_PUBLIC_*` são embedadas no build do Next.js. Sem os `ARG` e `ENV`, o build usava valores placeholder.

**Sintoma:** Network requests para `placeholder.supabase.co` com ERR_NAME_NOT_RESOLVED

---

### 4.5 Adicionar Suporte CORS para Railway Frontend

**Arquivo:** `backend/api.py`
**Linhas:** 1-4, 133-151

```python
# Adicionar import
import os

# ...

# Define allowed origins based on environment
allowed_origins = ["https://www.suna.so", "https://suna.so"]
allow_origin_regex = None

# Add Railway frontend URL if running on Railway
railway_frontend_url = os.getenv("RAILWAY_SERVICE_FRONTEND_URL")
if railway_frontend_url:
    allowed_origins.append(f"https://{railway_frontend_url}")
    logger.debug(f"Added Railway frontend URL to CORS: https://{railway_frontend_url}")

# Add staging-specific origins
if config.ENV_MODE == EnvMode.LOCAL:
    allowed_origins.append("http://localhost:3000")

# Add staging-specific origins
if config.ENV_MODE == EnvMode.STAGING:
    allowed_origins.append("https://staging.suna.so")
    allowed_origins.append("http://localhost:3000")
    allow_origin_regex = r"https://suna-.*-prjcts\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Project-Id", "X-MCP-URL", "X-MCP-Type", "X-MCP-Headers", "X-Refresh-Token", "X-API-Key"],
)
```

**Problema:** Backend só aceitava requests de suna.so, mas Railway usa URL tipo `suna-production.up.railway.app`

**Sintoma:** Todas chamadas backend retornando `net::ERR_FAILED` com erros CORS no console

---

### 4.6 Alterar ENV_MODE para Self-Hosted

**Railway Frontend - Variável de Ambiente:**

```
NEXT_PUBLIC_ENV_MODE=LOCAL
```

**Antes:** `PRODUCTION`
**Depois:** `LOCAL`

**Problema:** `ENV_MODE=PRODUCTION` ativa features SaaS incluindo:
- Billing/subscription checks
- "Upgrade now" prompts
- "Unlock all models + higher limits" messages
- Limitações de recursos

**Solução:** `ENV_MODE=LOCAL` desabilita todos os paywalls, funcionando igual versão local self-hosted

---

### 4.7 Corrigir ENV_MODE do Backend para Retornar Modelos

**Problema Identificado:**
Após corrigir frontend, descoberto que **nenhum provider de IA estava aparecendo** no seletor de modelos. O campo estava vazio.

**Causa Raiz:**
O endpoint `/billing/available-models` do backend verifica `config.ENV_MODE == EnvMode.LOCAL` para retornar todos os modelos sem restrições. Com `ENV_MODE=production` no backend, ele tentava verificar subscription tier, mas como é self-hosted, não retornava modelos corretamente.

**Arquivo:** `backend/core/billing/api.py`
**Linhas:** 806-817

```python
@router.get("/available-models")
async def get_available_models(
    account_id: str = Depends(verify_and_get_user_id_from_jwt)
) -> Dict:
    try:
        from core.ai_models import model_manager
        from core.services.supabase import DBConnection

        if config.ENV_MODE == EnvMode.LOCAL:
            logger.debug("Running in local development mode - all models available")
            all_models = model_manager.list_available_models(include_disabled=False)
            # ... retorna todos os modelos sem verificar subscription
```

**Railway Backend - Variável de Ambiente:**

```
ENV_MODE=local
```

**Antes:** `production`
**Depois:** `local`

**Resultado:** Backend agora retorna lista completa de providers/modelos de IA, permitindo que o frontend popule o seletor corretamente.

---

## 5. Deploys Realizados

### Commit para Corrigir httpOnly e Criar API Bridge
```bash
git add frontend/src/lib/supabase/server.ts
git add frontend/src/middleware.ts
git add frontend/src/app/api/auth/session/route.ts
git add frontend/src/components/AuthProvider.tsx
git commit -m "fix: Restore Supabase SSR httpOnly defaults and add session API bridge"
git push
```

### Commit para Corrigir Dockerfile
```bash
git add frontend/Dockerfile
git commit -m "fix: Add NEXT_PUBLIC_* build args to Dockerfile for proper env var embedding"
git push
```

### Commit para Adicionar CORS do Railway
```bash
git add backend/api.py
git commit -m "fix: Add Railway frontend URL to CORS allowed origins"
git push
```

### Railway Environment Variables
- Frontend: Alterado `NEXT_PUBLIC_ENV_MODE` de `PRODUCTION` para `LOCAL`
- Backend: Alterado `ENV_MODE` de `production` para `local`
- Backend: `RAILWAY_SERVICE_FRONTEND_URL` (automático do Railway)

---

## 6. Verificações Realizadas

### Login
✅ Consegui entrar com credenciais fornecidas
✅ Dashboard carregou com dados do usuário
✅ Middleware logs mostram `hasUser: true`

### Paywalls
✅ Script JavaScript não encontrou palavras-chave: "upgrade", "unlock", "premium", "billing"
✅ Nenhum botão com texto de upgrade encontrado
✅ Seleção de modelos acessível sem restrições

### Funcionalidades
✅ Agents (droid, New.Suna, Suna) todos acessíveis
✅ Tasks carregando (95 this week, 1 yesterday)
✅ Integrations disponíveis (Google Drive, Slack, Notion)
✅ Knowledge, Instructions, Triggers acessíveis

---

## 7. Status Atual

Segundo verificação via DevTools:
- ✅ Login funcionando
- ✅ Dashboard acessível
- ✅ Sem prompts de paywall detectados via script
- ✅ Todas funcionalidades visíveis

**Porém:** Usuário reporta que ainda não está funcionando.

---

## 8. Arquivos Modificados

### Frontend
1. `frontend/src/lib/supabase/server.ts` - Restaurar httpOnly padrão
2. `frontend/src/middleware.ts` - Restaurar httpOnly padrão
3. `frontend/src/app/api/auth/session/route.ts` - **NOVO** - API bridge
4. `frontend/src/components/AuthProvider.tsx` - Usar API bridge
5. `frontend/Dockerfile` - Adicionar ARG/ENV para NEXT_PUBLIC_*

### Backend
1. `backend/api.py` - Adicionar Railway URL ao CORS

### Railway Config
1. Frontend service: `NEXT_PUBLIC_ENV_MODE=LOCAL`
2. Backend service: `ENV_MODE=local`

---

## 9. Conceitos Técnicos Importantes

### httpOnly Cookies
- Cookies com flag httpOnly não podem ser lidos por JavaScript client-side
- Supabase SSR usa httpOnly para segurança
- Server-side pode ler, client-side não
- Solução: API bridge server-side

### Next.js Build-Time Variables
- Variáveis `NEXT_PUBLIC_*` são embedadas no build
- Dockerfile precisa receber via `ARG` e passar via `ENV` no builder stage
- Se não passar, build usa valores do .env.local ou placeholder

### CORS (Cross-Origin Resource Sharing)
- Backend precisa explicitamente permitir origem do frontend
- Railway gera URLs dinâmicas tipo `app-production.up.railway.app`
- Variável `RAILWAY_SERVICE_FRONTEND_URL` contém o hostname

### ENV_MODE
- `PRODUCTION`: Ativa features SaaS (billing, limits, paywalls)
- `LOCAL`: Modo self-hosted, tudo desbloqueado
- `STAGING`: Modo de staging com algumas features de dev

---

## 10. Próximos Passos de Diagnóstico

### Se ainda não funciona, verificar:

1. **Logs do Railway Frontend:**
   - Verificar se build usou variáveis corretas
   - Checar erros de runtime

2. **Logs do Railway Backend:**
   - Verificar se CORS está aceitando requests
   - Checar erros de autenticação

3. **Browser DevTools:**
   - Network tab: Verificar requests falhando
   - Console: Verificar erros JavaScript
   - Application > Cookies: Verificar cookies Supabase

4. **Testar manualmente:**
   - Limpar cookies/localStorage
   - Tentar login novamente
   - Verificar redirect após login

---

## 11. Comandos Úteis

### Ver logs Railway (via CLI)
```bash
# Frontend
railway logs --service=frontend

# Backend
railway logs --service=backend
```

### Forçar rebuild
```bash
# Empty commit para trigger rebuild
git commit --allow-empty -m "chore: Force Railway rebuild"
git push
```

### Verificar variáveis de ambiente
```bash
railway variables
```

---

## 12. Links Relevantes

- **Frontend URL:** [verificar no Railway dashboard]
- **Backend URL:** [verificar no Railway dashboard]
- **Supabase Project:** [URL do Supabase usado]

---

**Documento criado por:** Claude Code
**Última atualização:** 11 de Janeiro de 2025
